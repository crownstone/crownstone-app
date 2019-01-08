package rocks.crownstone.consumerapp

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Criteria
import android.location.LocationManager
import android.os.Build
import android.support.v4.content.ContextCompat
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import nl.komponents.kovenant.Promise
import nl.komponents.kovenant.android.startKovenant
import nl.komponents.kovenant.android.stopKovenant
import nl.komponents.kovenant.then
import nl.komponents.kovenant.unwrap
import org.json.JSONException
import rocks.crownstone.bluenet.Bluenet
import rocks.crownstone.bluenet.encryption.KeySet
import rocks.crownstone.bluenet.packets.ControlPacket
import rocks.crownstone.bluenet.packets.meshCommand.MeshControlPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchListItemPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchListPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchPacket
import rocks.crownstone.bluenet.packets.schedule.ScheduleCommandPacket
import rocks.crownstone.bluenet.packets.schedule.ScheduleEntryPacket
import rocks.crownstone.bluenet.scanparsing.ScannedDevice
import rocks.crownstone.bluenet.structs.*
import rocks.crownstone.bluenet.util.Conversion
import rocks.crownstone.localization.*
import java.util.*

class BluenetBridge(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
	private val TAG = this.javaClass.simpleName
	private val reactContext = reactContext
	private val bluenet = Bluenet()
	private val localization = FingerprintLocalization.getInstance()
	private val initPromise: Promise<Unit, Exception>
	private val readyCallbacks = ArrayList<Callback>()

	private val ONGOING_NOTIFICATION_ID = 99115

	// Scanning
	private var uniqueScansOnly = false // Easier than unsubscribing and subscribing to events.

	// Localization
	private var isLocalizationTraining = false
	private var isLocalizationTrainingPaused = false
	private var lastLocationId: String? = null
	private var currentSphereId = "" // TODO: get rid of this, as we should support multisphere. Currently needed because scans don't have the sphere id, nor location updates.

	init {
		startKovenant() // Start thread(s)
		initPromise = bluenet.init(reactContext)
		initPromise.success {
			bluenet.subscribe(BluenetEvent.SCAN_RESULT, ::onScan)
			bluenet.subscribe(BluenetEvent.IBEACON_ENTER_REGION, ::onRegionEnter)
		}
	}

	// TODO: call this?
	fun destroy() {
		stopKovenant() // Stop thread(s)
		bluenet.destroy()
		reactContext.currentActivity?.finish()
		reactContext.runOnUiQueueThread {
			reactContext.destroy()
		}

		// See: http://stackoverflow.com/questions/2033914/is-quitting-an-application-frowned-upon
//		System.exit(0); // Not recommended, seems to restart app
//		Process.killProcess(Process.myPid()) // Not recommended either
	}

	override fun getName(): String {
		return "BluenetJS"
	}


////////////////////////////////////////////////////////////////////////////////////////////////////
//  Generic
////////////////////////////////////////////////////////////////////////////////////////////////////

	@ReactMethod
	@Synchronized
	fun isReady(callback: Callback) {
		Log.i(TAG, "isReady")
		// Check if bluenet lib is ready (scanner and bluetooth).
		// Only invoke callback once lib is ready, do not invoke on error.
		// Only called at start of app.
		// Can be called multiple times, and should all be invoked once ready.
		if (bluenet.isScannerReady()) {
			resolveCallback(callback)
			return
		}

		readyCallbacks.add(callback)
		initPromise.success {
			val activity = reactContext.currentActivity
			if (activity != null) {
				bluenet.makeScannerReady(activity)
						.success {
							//						resolveCallback(callback)
							for (cb in readyCallbacks) {
								resolveCallback(cb)
							}
							readyCallbacks.clear()
						}
						.fail {
							// Should never fail..
							Log.e(TAG, "makeScannerReady failed: ${it.message}")
						}
			}
		}
	}

	@ReactMethod
	@Synchronized
	fun viewsInitialized() {
		Log.i(TAG, "viewsInitialized")
		// All views have been initialized
		// This means the missing bluetooth functions can now be shown.
		requestBleState()
	}

	@ReactMethod
	@Synchronized
	fun setKeySets(keySets: ReadableArray, callback: Callback) {
		Log.i(TAG, "setKeySets")
		// keys can be either in plain string or hex string format, check length to determine which

		val keys = Keys()
//		val iter = keySets.keySetIterator()
//		while (iter.hasNextKey()) {
//			val sphereId = iter.nextKey()
//			val keySetJson = keySets.getMap(sphereId)
		for (i in 0 until keySets.size()) {
			val keySetJson = keySets.getMap(i)
			if (!keySetJson.hasKey("referenceId")) {
				rejectCallback(callback, "Missing referenceId: $keySets")
				return
			}
			val sphereId = keySetJson.getString("referenceId")
			if (!keySetJson.hasKey("iBeaconUuid")) {
				rejectCallback(callback, "Missing iBeaconUuid: $keySets")
				return
			}
			val ibeaconUuidString = keySetJson.getString("iBeaconUuid")
			val ibeaconUuid = try {
				 UUID.fromString(ibeaconUuidString)
			}
			catch (e: IllegalArgumentException) {
				rejectCallback(callback, "Invalid UUID: $ibeaconUuidString")
				return
			}
			var adminKey: String? = null
			var memberKey: String? = null
			var guestKey: String? = null
			if (keySetJson.hasKey("adminKey")) {
				adminKey = keySetJson.getString("adminKey")
			}
			if (keySetJson.hasKey("memberKey")) {
				memberKey = keySetJson.getString("memberKey")
			}
			if (keySetJson.hasKey("guestKey")) {
				guestKey = keySetJson.getString("guestKey")
			}
			val keySet = KeySet(adminKey, memberKey, guestKey)
			val keyData = KeyData(keySet, ibeaconUuid)
			keys.put(sphereId, keyData)
		}
		bluenet.loadKeys(keys)
		resolveCallback(callback)
	}



	@ReactMethod
	@Synchronized
	fun quitApp() {
		Log.i(TAG, "quitApp")
		destroy()
	}

	@ReactMethod
	@Synchronized
	fun resetBle() {
		Log.i(TAG, "resetBle")

	}

	@ReactMethod
	@Synchronized
	fun requestBleState() {
		Log.i(TAG, "requestBleState")
		// Send events "bleStatus" and "locationStatus" with the current state.
		if (!bluenet.isLocationPermissionGranted()) {
			sendEvent("locationStatus", "noPermission")
		}
		else if (!bluenet.isLocationServiceEnabled()) {
			sendEvent("locationStatus", "off")
		}
		else {
			sendEvent("locationStatus", "on")
		}
		if (!bluenet.isBleEnabled()) {
			sendEvent("bleStatus", "poweredOff")
		}
		else {
			sendEvent("bleStatus", "poweredOn")
		}
	}

	@ReactMethod
	@Synchronized
	fun requestLocationPermission() {
		Log.i(TAG, "requestLocationPermission")
		// Request for location permission during tutorial.
		// TODO: check if you can't continue the tutorial before giving or denying permission.
		val activity = reactContext.currentActivity ?: return
		bluenet.requestLocationPermission(activity)
	}

	@ReactMethod
	@Synchronized
	fun requestLocation(callback: Callback) {
		Log.i(TAG, "requestLocation")
		if (ContextCompat.checkSelfPermission(reactContext, "android.permission.ACCESS_COARSE_LOCATION") != PackageManager.PERMISSION_GRANTED) {
			rejectCallback(callback, "no permission to get location")
			return
		}

		val locationManager = reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager?
		if (locationManager == null) {
			rejectCallback(callback, "no location manager")
			return
		}

		val criteria = Criteria()
		criteria.accuracy = Criteria.ACCURACY_COARSE
		criteria.isAltitudeRequired = false
		criteria.isBearingRequired = false
		criteria.isSpeedRequired = false
		val provider = locationManager.getBestProvider(criteria, true)
		if (provider == null) {
			rejectCallback(callback, "no location provider available")
			return
		}

		val location = locationManager.getLastKnownLocation(provider)
		if (location == null) {
			rejectCallback(callback, "no location available")
			return
		}

		val dataVal = Arguments.createMap()
		dataVal.putDouble("latitude", location.latitude)
		dataVal.putDouble("longitude", location.longitude)
		resolveCallback(callback, dataVal)
	}

	@ReactMethod
	@Synchronized
	fun forceClearActiveRegion() {
		Log.i(TAG, "forceClearActiveRegion")
		// Forces not being in an ibeacon region (not needed for android as far as I know)
	}



	@ReactMethod
	@Synchronized
	fun enableLoggingToFile(enable: Boolean) {

	}

	@ReactMethod
	@Synchronized
	fun enableExtendedLogging(enable: Boolean) {

	}

	@ReactMethod
	@Synchronized
	fun clearLogs() {

	}


////////////////////////////////////////////////////////////////////////////////////////////////////
//  Scanning
////////////////////////////////////////////////////////////////////////////////////////////////////

	@ReactMethod
	@Synchronized
	fun startScanning() {
		Log.i(TAG, "startScanning")
		uniqueScansOnly = false
		bluenet.startScanning()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstones() {
		Log.i(TAG, "startScanningForCrownstones")
		uniqueScansOnly = false
		bluenet.filterForCrownstones(true)
		bluenet.startScanning()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstonesUniqueOnly() {
		Log.i(TAG, "startScanningForCrownstonesUniqueOnly")
		// Validated and non validated, but unique only.
		uniqueScansOnly = true
		bluenet.startScanning()
	}

	@ReactMethod
	@Synchronized
	fun stopScanning() {
		Log.i(TAG, "stopScanning")
		// TODO: Only stop scanning when not tracking..
		bluenet.stopScanning()
	}




	@ReactMethod
	@Synchronized
	fun trackIBeacon(uuidString: String, sphereId: String) {
		Log.i(TAG, "trackIBeacon uuid=$uuidString sphere=$sphereId")
		// Add the UUID to the list of tracked iBeacons, associate it with given sphereId, and start tracking.
		val uuid = try {
			UUID.fromString(uuidString)
		}
		catch (e: IllegalArgumentException) {
			return
		}
		bluenet.iBeaconRanger.track(uuid, sphereId)
	}

	@ReactMethod
	@Synchronized
	fun stopTrackingIBeacon(uuidString: String) {
		Log.i(TAG, "stopTrackingIBeacon uuid=$uuidString")
		// Remove the UUID from the list of tracked iBeacons.
		val uuid = try {
			UUID.fromString(uuidString)
		}
		catch (e: IllegalArgumentException) {
			return
		}
		bluenet.iBeaconRanger.stopTracking(uuid)
	}

	@ReactMethod
	@Synchronized
	fun pauseTracking() {
		Log.i(TAG, "pauseTracking")
		// Stop tracking, but keep the list of tracked iBeacon UUIDs. Stop sending any tracking events: iBeacon, enter/exit region. Assume all tracked iBeacon UUIDs are out the region.
		bluenet.iBeaconRanger.pause()
	}

	@ReactMethod
	@Synchronized
	fun resumeTracking() {
		Log.i(TAG, "resumeTracking")
		// Start tracking again, with the list that is already there.
		bluenet.iBeaconRanger.resume()
	}

	@ReactMethod
	@Synchronized
	fun clearTrackedBeacons(callback: Callback) {
		Log.i(TAG, "clearTrackedBeacons")
		// Clear the list of tracked iBeacons and stop tracking.
		bluenet.iBeaconRanger.stopTracking()
		resolveCallback(callback)
	}

	@ReactMethod
	@Synchronized
	fun batterySaving(enable: Boolean) {
		Log.i(TAG, "batterySaving $enable")
		// Called when app goes to foreground with enable=true
		// Called when app goes to background with enable=false
		// When enabled, beacon ranging should still continue.

	}

	@ReactMethod
	@Synchronized
	fun setBackgroundScanning(enable: Boolean) {
		Log.i(TAG, "setBackgroundScanning $enable")
		// Called after used logged in, and when changed.
		// When disabled, no scanning has to happen in background.
		if (enable) {
			// This is actually a promise, but it should happen faster than it's possible to click a button.
			bluenet.runInForeground(ONGOING_NOTIFICATION_ID, getServiceNotification("Crownstone is running in the background"))
		}
		else {
			bluenet.runInBackground()
		}
	}


	private val localizationCallback = LocalizationCallback { locationId: String? ->
		Log.d(TAG, "locationUpdate locationId=$locationId")
		if (locationId == null) {
			if (lastLocationId != null) {
				Log.d(TAG, "Send exit $currentSphereId $lastLocationId")
				val mapExit = Arguments.createMap()
				mapExit.putString("region", currentSphereId)
				mapExit.putString("location", lastLocationId)
				sendEvent("exitLocation", mapExit)
			}
		}
		else if (lastLocationId == null) {
			Log.i(TAG, "Send enter $currentSphereId $locationId")
			val mapEnter = Arguments.createMap()
			mapEnter.putString("region", currentSphereId)
			mapEnter.putString("location", locationId)
			sendEvent("enterLocation", mapEnter)
		}
		else if (locationId != lastLocationId) {
			Log.i(TAG, "Send exit $currentSphereId $lastLocationId")
			val mapExit = Arguments.createMap()
			mapExit.putString("region", currentSphereId)
			mapExit.putString("location", lastLocationId)
			sendEvent("exitLocation", mapExit)

			Log.i(TAG, "Send enter $currentSphereId $locationId")
			val mapEnter = Arguments.createMap()
			mapEnter.putString("region", currentSphereId)
			mapEnter.putString("location", locationId)
			sendEvent("enterLocation", mapEnter)
		}
		if (locationId != null) {
			Log.d(TAG, "Send current $currentSphereId $locationId")
			val mapCurrent = Arguments.createMap()
			mapCurrent.putString("region", currentSphereId)
			mapCurrent.putString("location", locationId)
			sendEvent("currentLocation", mapCurrent)
		}
		lastLocationId = locationId
	}

	@ReactMethod
	@Synchronized
	fun startIndoorLocalization() {
		Log.i(TAG, "startIndoorLocalization")
		// Start using the classifier
		localization.startLocalization(localizationCallback)
	}

	@ReactMethod
	@Synchronized
	fun stopIndoorLocalization() {
		Log.i(TAG, "stopIndoorLocalization")
		// Stop using the classifier
		localization.stopLocalization()
	}

	@ReactMethod
	@Synchronized
	fun startCollectingFingerprint() {
		Log.i(TAG, "startCollectingFingerprint")
		localization.startFingerprint()
		isLocalizationTraining = true
		isLocalizationTrainingPaused = false
	}

	@ReactMethod
	@Synchronized
	fun abortCollectingFingerprint() {
		Log.i(TAG, "abortCollectingFingerprint")
		localization.abortFingerprint()
		isLocalizationTraining = false
	}

	@ReactMethod
	@Synchronized
	fun pauseCollectingFingerprint() {
		Log.i(TAG, "pauseCollectingFingerprint")
		// Stop feeding scans to the localization class
		isLocalizationTrainingPaused = true
	}

	@ReactMethod
	@Synchronized
	fun resumeCollectingFingerprint() {
		Log.i(TAG, "resumeCollectingFingerprint")
		// Start feeding scans to the localization class again
		isLocalizationTrainingPaused = false
	}

	@ReactMethod
	@Synchronized
	fun finalizeFingerprint(sphereId: String, locationId: String, callback: Callback) {
		Log.i(TAG, "finalizeFingerprint sphereId=$sphereId locationId=$locationId")
		localization.finalizeFingerprint(sphereId, locationId, null)
		isLocalizationTraining = false
		val fingerprint = localization.getFingerprint(sphereId, locationId)
		if (fingerprint != null) {
			val samplesStr = fingerprint.samples.toString()
			resolveCallback(callback, samplesStr)
		}
		else {
			rejectCallback(callback, "")
		}
	}

	@ReactMethod
	@Synchronized
	fun loadFingerprint(sphereId: String, locationId: String, samplesStr: String) {
		Log.i(TAG, "loadFingerprint sphereId=$sphereId locationId=$locationId samples=$samplesStr")
		val fingerprint = Fingerprint()
		fingerprint.sphereId = sphereId
		fingerprint.locationId = locationId
		try {
			val samples = FingerprintSamplesMap(samplesStr)
			if (!samples.isEmpty()) {
				fingerprint.setSamples(samples)
				localization.importFingerprint(sphereId, locationId, fingerprint)
			}
			else {
				Log.e(TAG, "fingerprint samples empty?: $samplesStr")
			}
		}
		catch (e: JSONException) {
			Log.e(TAG, "Failed to load fingerprint samples: $samplesStr")
			e.printStackTrace()
		}
	}

	@ReactMethod
	@Synchronized
	fun clearFingerprints() {
		Log.i(TAG, "clearFingerprints")
		localization.clear()
	}

	@ReactMethod
	@Synchronized
	fun clearFingerprintsPromise(callback: Callback) {
		Log.i(TAG, "clearFingerprintsPromise")
		localization.clear()
		resolveCallback(callback)
	}



////////////////////////////////////////////////////////////////////////////////////////////////////
//  Connections
////////////////////////////////////////////////////////////////////////////////////////////////////

	@ReactMethod
	@Synchronized
	fun connect(address: String, callback: Callback) {
		bluenet.connect(address)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun disconnectCommand(callback: Callback) {
		bluenet.control.disconnect()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun phoneDisconnect(callback: Callback) {
		bluenet.disconnect(false)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}



	@ReactMethod
	@Synchronized
	fun commandFactoryReset(callback: Callback) {
		bluenet.control.factoryReset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setupFactoryReset(callback: Callback) {
		bluenet.control.factoryReset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun recover(address: String, callback: Callback) {
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun setupCrownstone(config: ReadableMap, callback: Callback) {
		// Emit events "setupProgress" to show the progress
		// keys can be either in plain string or hex string format, check length to determine which

		val crownstoneId: Uint8
		var adminKey: String?
		var memberKey: String?
		var guestKey: String?
		val iBeaconUuid: UUID
		val iBeaconMajor: Uint16
		val iBeaconMinor: Uint16
		var meshAccessAddress: Uint32

		try {
			crownstoneId = config.getInt("crownstoneId").toShort()
			adminKey = config.getString("adminKey")
			memberKey = config.getString("memberKey")
			guestKey = config.getString("guestKey")
			iBeaconUuid = UUID.fromString(config.getString("ibeaconUUID"))
			iBeaconMajor = config.getInt("ibeaconMajor")
			iBeaconMinor = config.getInt("ibeaconMinor")
			val meshAccessAddressStr = config.getString("meshAccessAddress")
			val meshAccessAddressBytes = Conversion.hexStringToBytes(meshAccessAddressStr)
			if (meshAccessAddressBytes.size != 4) {
				rejectCallback(callback, "invalid meshAccessAddress")
				return
			}
			meshAccessAddress = Conversion.byteArrayTo(meshAccessAddressBytes)
		} catch (e: NoSuchKeyException) {
			val errStr = "wrong setup arguments: " + config.toString()
			rejectCallback(callback, errStr)
			return
		} catch (e: UnexpectedNativeTypeException) {
			val errStr = "wrong setup arguments: " + config.toString()
			rejectCallback(callback, errStr)
			return
		} catch (e: IllegalArgumentException) {
			val errStr = "wrong setup arguments: " + config.toString()
			rejectCallback(callback, errStr)
			return
		}

		Log.v(TAG, "cs id=$crownstoneId, keys=[$adminKey $memberKey $guestKey], meshaddr=$meshAccessAddress, ibeacon=[$iBeaconUuid $iBeaconMajor $iBeaconMinor]")

		val keySet = KeySet(adminKey, memberKey, guestKey)
		val ibeaconData = IbeaconData(iBeaconUuid, iBeaconMajor, iBeaconMinor, 0)

		// TODO: subscribe to setup progress events

		// Maybe refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
		// Not sure if this is helpful, as it would've gone wrong already on connect (when session nonce is read in normal mode)
		bluenet.setup.setup(crownstoneId, keySet, meshAccessAddress, ibeaconData)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun bootloaderToNormalMode(address: String, callback: Callback) {
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun restartCrownstone(callback: Callback) {
		bluenet.control.reset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun putInDFU(callback: Callback) {
		bluenet.control.goToDfu()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setupPutInDFU(callback: Callback) {
		bluenet.control.goToDfu()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}



	@ReactMethod
	@Synchronized
	fun performDFU(address: String, fileString: String, callback: Callback) {
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun getMACAddress(callback: Callback) {
		// Refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun sendNoOp(callback: Callback) {
		bluenet.control.noop()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun sendMeshNoOp(callback: Callback) {
		bluenet.control.meshCommand(MeshControlPacket(ControlPacket(ControlType.NOOP)))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
		// TODO: implement as single command
	}



	@ReactMethod
	@Synchronized
	fun getSwitchState(callback: Callback) {
		bluenet.state.getSwitchState()
				.success {
					resolveCallback(callback, convertSwitchState(it))
				}
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setSwitchState(switchStateDouble: Double, callback: Callback) {
		bluenet.control.setSwitch(convertSwitchVal(switchStateDouble))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun toggleSwitchState(valueOnDouble: Double, callback: Callback) {
		val valueOn = convertSwitchVal(valueOnDouble)
		// TODO: bluenet.control.toggleSwitch()
	}

	@ReactMethod
	@Synchronized
	fun multiSwitch(switchItems: ReadableArray, callback: Callback) {
		// switchItems = [{crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }, {}, ...]
		Log.i(TAG, "multiSwitch $switchItems")


		val listPacket = MultiSwitchListPacket()


		var success = true
		for (i in 0 until switchItems.size()) {
			val itemMap = switchItems.getMap(i)
			val crownstoneId = Conversion.toUint8(itemMap.getInt("crownstoneId"))
			val timeout = Conversion.toUint16(itemMap.getInt("timeout"))
			val intentInt = itemMap.getInt("intent")
			val intent = MultiSwitchIntent.fromNum(Conversion.toUint8(intentInt))
			val switchStateDouble = itemMap.getDouble("state")
			val switchVal = convertSwitchVal(switchStateDouble)
			val item = MultiSwitchListItemPacket(crownstoneId, switchVal, timeout, intent)
			if (!listPacket.add(item)) {
				success = false
				break
			}
		}
		if (!success) {
			rejectCallback(callback, "Invalid multiSwitch data: $switchItems")
			return
		}
		bluenet.control.multiSwtich(MultiSwitchPacket(listPacket))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}



	@ReactMethod
	@Synchronized
	fun getFirmwareVersion(callback: Callback) {
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun getHardwareVersion(callback: Callback) {
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun getBootloaderVersion(callback: Callback) {
		// TODO
	}



	@ReactMethod
	@Synchronized
	fun getErrors(callback: Callback) {
		// return a map: { overCurrent: boolean, overCurrentDimmer: boolean, temperatureChip: boolean, temperatureDimmer: boolean, bitMask: uint32 }
		bluenet.state.getErrors()
				.success {
					val stateErrorMap = Arguments.createMap()
					stateErrorMap.putBoolean("overCurrent", it.overCurrent)
					stateErrorMap.putBoolean("overCurrentDimmer", it.overCurrentDimmer)
					stateErrorMap.putBoolean("temperatureChip", it.chipTemperature)
					stateErrorMap.putBoolean("temperatureDimmer", it.dimmerTemperature)
					stateErrorMap.putInt("bitMask", it.bitmask.toInt())
					resolveCallback(callback, stateErrorMap)
				}
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun clearErrors(clearErrorsMap: ReadableMap, callback: Callback) {
		// clearErrorsMap, map with errors to clear. Keys: overCurrent, overCurrentDimmer, temperatureChip, temperatureDimmer, dimmerOnFailure, dimmerOffFailure
		val errorState = ErrorState()
		errorState.overCurrent = clearErrorsMap.getBoolean("overCurrent")
		errorState.overCurrentDimmer = clearErrorsMap.getBoolean("overCurrentDimmer")
		errorState.chipTemperature = clearErrorsMap.getBoolean("temperatureChip")
		errorState.dimmerTemperature = clearErrorsMap.getBoolean("temperatureDimmer")
		errorState.dimmerOnFailure = clearErrorsMap.getBoolean("dimmerOnFailure")
		errorState.dimmerOffFailure = clearErrorsMap.getBoolean("dimmerOffFailure")
		errorState.calcBitMask()
		bluenet.control.resetErrors(errorState)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}



	@ReactMethod
	@Synchronized
	fun lockSwitch(enable: Boolean, callback: Callback) {
		bluenet.control.lockSwitch(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun allowDimming(enable: Boolean, callback: Callback) {
		bluenet.control.allowDimming(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setSwitchCraft(enable: Boolean, callback: Callback) {
		bluenet.control.enableSwitchCraft(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}



	@ReactMethod
	@Synchronized
	fun setTime(timestampDouble: Double, callback: Callback) {
		val timestamp = timestampDouble as Long
		bluenet.control.setTime(timestamp)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun meshSetTime(timestampDouble: Double, callback: Callback) {
		val timestamp = timestampDouble as Long
		// TODO: implement as single command
		bluenet.control.meshCommand(MeshControlPacket(ControlPacket(ControlType.SET_TIME, Conversion.toByteArray(timestamp))))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getTime(callback: Callback) {
		bluenet.state.getTime()
				.success {
					resolveCallback(callback, it.toDouble()) // No long in react-native
				}
				.fail { rejectCallback(callback, it.message) }
	}


	@ReactMethod
	@Synchronized
	fun addSchedule(scheduleEntryMap: ReadableMap, callback: Callback) {
		// Adds a new entry to the schedule on an empty spot.
		// If no empty spots: fails
		val packet = parseScheduleEntryMap(scheduleEntryMap)
		if (packet == null) {
			rejectCallback(callback, "invalid schedule entry")
			return
		}
		bluenet.state.getAvailableScheduleEntryIndex()
				.then {
					bluenet.control.setSchedule(ScheduleCommandPacket(Conversion.toUint8(it), packet))
				}.unwrap()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setSchedule(scheduleEntryMap: ReadableMap, callback: Callback) {
		// Overwrites a schedule entry at given index.
		val packet = parseScheduleEntryMap(scheduleEntryMap)
		if (packet == null || !scheduleEntryMap.hasKey("scheduleEntryIndex")) {
			rejectCallback(callback, "invalid schedule entry")
			return
		}
		val index = Conversion.toUint8(scheduleEntryMap.getInt("scheduleEntryIndex"))
		bluenet.control.setSchedule(ScheduleCommandPacket(index, packet))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun clearSchedule(scheduleEntryIndex: Int, callback: Callback) {
		// Clears the schedule entry at given index.
		bluenet.control.removeSchedule(scheduleEntryIndex.toShort())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getAvailableScheduleEntryIndex(callback: Callback) {
		// Returns an empty spot in the schedule list.
		bluenet.state.getAvailableScheduleEntryIndex()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getSchedules(callback: Callback) {
		// Returns an array of schedule entry maps.
		bluenet.state.getScheduleList()
				.success {
					val scheduleArray = Arguments.createArray()
					for (i in 0 until it.list.size) {
						val entry = it.list[i]
						if (!entry.isActive()) {
							continue
						}
						val entryMap = exportScheduleEntryMap(entry) ?: continue
						entryMap.putInt("scheduleEntryIndex", i)
						scheduleArray.pushMap(entryMap)
					}
					resolveCallback(callback, scheduleArray)
				}
				.fail { rejectCallback(callback, it.message) }
	}

	/**
	 * Parses a schedule entry map and returns it as schedule entry packet.
	 * @param map the map.
	 * @return the packet, or null when parsing failed.
	 */

	private fun parseScheduleEntryMap(map: ReadableMap): ScheduleEntryPacket? {
	// scheduleEntryMap:
	//		scheduleEntryIndex     : number, // 0 .. 9
	//		nextTime               : number, // timestamp since epoch in seconds
	//		switchState            : number, // 0 .. 1
	//		fadeDuration           : number, // # seconds
	//		intervalInMinutes      : number, // # minutes
	//		ignoreLocationTriggers : boolean,
	//		repeatMode             : "24h" | "minute" | "none",
	//		activeMonday           : boolean,
	//		activeTuesday          : boolean,
	//		activeWednesday        : boolean,
	//		activeThursday         : boolean,
	//		activeFriday           : boolean,
	//		activeSaturday         : boolean,
	//		activeSunday           : boolean,
		val packet = ScheduleEntryPacket()
		try {
			packet.overrideMask.location = map.getBoolean("ignoreLocationTriggers")
			packet.timestamp = map.getDouble("nextTime").toLong()
			packet.minutes = 0
			val repeatType = map.getString("repeatMode")
			when (repeatType) {
				"24h" -> {
					packet.repeatType = ScheduleRepeatType.DAY
					packet.dayOfWeekMask.sunday = map.getBoolean("activeSunday")
					packet.dayOfWeekMask.monday = map.getBoolean("activeMonday")
					packet.dayOfWeekMask.tuesday = map.getBoolean("activeTuesday")
					packet.dayOfWeekMask.wednesday = map.getBoolean("activeWednesday")
					packet.dayOfWeekMask.thursday = map.getBoolean("activeThursday")
					packet.dayOfWeekMask.friday = map.getBoolean("activeFriday")
					packet.dayOfWeekMask.saturday = map.getBoolean("activeSaturday")
				}
				"minute" -> {
					packet.repeatType = ScheduleRepeatType.MINUTES
					packet.minutes = map.getInt("intervalInMinutes")
				}
				"none" -> {
					packet.repeatType = ScheduleRepeatType.ONCE
				}
				else -> {
					Log.w(TAG, "Unknown repeat type $repeatType")
					return null
				}
			}

			val switchStateDouble = map.getDouble("switchState")
			packet.switchVal = convertSwitchVal(switchStateDouble)
			packet.fadeDuration = map.getInt("fadeDuration")
			if (packet.fadeDuration > 0) {
				packet.actionType = ScheduleActionType.FADE
			}
			else {
				packet.actionType = ScheduleActionType.SWITCH
			}
		} catch (e: NoSuchKeyException) {
			Log.w(TAG, "Wrong schedule entry: " + map.toString())
			return null
		} catch (e: UnexpectedNativeTypeException) {
			Log.w(TAG, "Wrong schedule entry: " + map.toString())
			return null
		}

		return packet
//		return if (!packet.isValidPacketToSet()) {
//			null
//		}
//		else packet
	}

	/**
	 * Exports a ScheduleEntryPacket to a schedule entry map.
	 * @param packet the packet.
	 * @return the map, or null when inactive or when parsing failed.
	 */
	private fun exportScheduleEntryMap(packet: ScheduleEntryPacket): WritableMap? {
		if (!packet.isActive()) {
			return null
		}
		val map = Arguments.createMap()
		map.putBoolean("active", true)
		map.putDouble("nextTime", packet.timestamp.toDouble())
		map.putBoolean("ignoreLocationTriggers", packet.overrideMask.location)

		// Repeat type
		// Always fill all values with something.
		map.putInt("intervalInMinutes", 0)
		map.putBoolean("activeSunday", false)
		map.putBoolean("activeMonday", false)
		map.putBoolean("activeTuesday", false)
		map.putBoolean("activeWednesday", false)
		map.putBoolean("activeThursday", false)
		map.putBoolean("activeFriday", false)
		map.putBoolean("activeSaturday", false)
		when (packet.repeatType) {
			ScheduleRepeatType.MINUTES -> {
				map.putString("repeatMode", "minute")
				map.putInt("intervalInMinutes", packet.minutes)
			}
			ScheduleRepeatType.DAY -> {
				map.putString("repeatMode", "24h")
				map.putBoolean("activeSunday", packet.dayOfWeekMask.sunday)
				map.putBoolean("activeMonday", packet.dayOfWeekMask.monday)
				map.putBoolean("activeTuesday", packet.dayOfWeekMask.tuesday)
				map.putBoolean("activeWednesday", packet.dayOfWeekMask.wednesday)
				map.putBoolean("activeThursday", packet.dayOfWeekMask.thursday)
				map.putBoolean("activeFriday", packet.dayOfWeekMask.friday)
				map.putBoolean("activeSaturday", packet.dayOfWeekMask.saturday)
			}
			ScheduleRepeatType.ONCE -> {
				map.putString("repeatMode", "none")
			}
			else -> {
				Log.e(TAG, "wrong schedule entry: " + packet.toString())
				return null
			}
		}

		// Action type
		// Always fill all values with something invalid.
		map.putDouble("switchState", 0.0)
		map.putInt("fadeDuration", 0)
		when (packet.actionType) {
			ScheduleActionType.SWITCH -> {
				map.putDouble("switchState", convertSwitchVal(packet.switchVal))
			}
			ScheduleActionType.FADE -> {
				map.putDouble("switchState", convertSwitchVal(packet.switchVal))
				map.putInt("fadeDuration", packet.fadeDuration)
			}
			ScheduleActionType.TOGGLE -> {
				return null
			}
			else -> {
				return null
			}
		}
		return map
	}



	@ReactMethod
	@Synchronized
	fun keepAlive(callback: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun keepAliveState(action: Boolean, state: Float, timeout: Int, callback: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun meshKeepAlive(callback: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun meshKeepAliveState(timeout: Int, keepAliveItems: ReadableArray, callback: Callback) {

	}


	@Synchronized
	private fun onRegionEnter(data: Any) {
		val eventData = data as IbeaconRegionEventData
		val uuid = eventData.changedRegion
		for (region in eventData.list) {
			if (region.key == uuid) {
				currentSphereId = region.value
			}
		}
	}

	@Synchronized
	private fun onRegionExit(data: Any) {
		val eventData = data as IbeaconRegionEventData
//		if (eventData.list.isEmpty()) {
//			currentSphereId = ""
//		}
	}

	@Synchronized
	private fun onScan(data: Any) {
		val device = data as ScannedDevice
		if (device.serviceData != null) {
			onScanWithServiceData(device)
		}
	}

	@Synchronized
	private fun onScanWithServiceData(device: ScannedDevice) {
		val serviceData = device.serviceData ?: return
		if (uniqueScansOnly && !serviceData.unique) {
			return
		}

	}

	@Synchronized
	fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
		bluenet.handlePermissionResult(requestCode, permissions, grantResults)
	}


	/** Convert 0.0 .. 1.0 value to switch value (0-100).
	 */
	private fun convertSwitchVal(switchVal: Double): Uint8 {
		var switchValInt = 0
		if (switchVal >= 1.0) {
			switchValInt = 100
		}
		else if (switchVal > 0) {
			switchValInt = Math.round(switchVal * 100) as Int
		}
		return Conversion.toUint8(switchValInt)
	}

	/** Convert switch value (0-100) to 0.0 .. 1.0 value.
	 */
	private fun convertSwitchVal(switchVal: Uint8): Double {
		return switchVal.toDouble() / 100
	}

	/** Converts switch state (0-228) to 0.0 .. 1.0 value.
	 */
	private fun convertSwitchState(switchState: Uint8): Double {
		var switchStateInt = switchState.toInt()
		if (switchStateInt > 100) {
			switchStateInt = 100
		}
		return switchStateInt.toDouble() / 100
	}


	private fun rejectCallback(callback: Callback, error: String?) {
		val retVal = Arguments.createMap()
		retVal.putString("data", error)
		retVal.putBoolean("error", true)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback) {
		val retVal = Arguments.createMap()
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: String) {
		val retVal = Arguments.createMap()
		retVal.putString("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: Int) {
		val retVal = Arguments.createMap()
		retVal.putInt("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: Double) {
		val retVal = Arguments.createMap()
		retVal.putDouble("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: WritableMap) {
		val retVal = Arguments.createMap()
		retVal.putMap("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: WritableArray) {
		val retVal = Arguments.createMap()
		retVal.putArray("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}



	private fun sendEvent(eventName: String, params: WritableMap?) {
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun sendEvent(eventName: String, params: WritableArray?) {
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun sendEvent(eventName: String, params: String?) {
		Log.d(TAG, "sendEvent $eventName: $params")
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun sendEvent(eventName: String, params: Int?) {
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun getServiceNotification(text: String): Notification {
		val notificationIntent = Intent(reactContext, MainActivity::class.java)
//		notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
//		notificationIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
		notificationIntent.action = Intent.ACTION_MAIN
		notificationIntent.addCategory(Intent.CATEGORY_LAUNCHER)
		notificationIntent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT


//		notificationIntent.setClassName("rocks.crownstone.consumerapp", "MainActivity");
//		notificationIntent.setAction("ACTION_MAIN");
//		PendingIntent pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_ONE_SHOT);
		val pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT)
//		PendingIntent pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, 0);

		val notification = Notification.Builder(reactContext)
				.setContentTitle("Crownstone is running")
				.setContentText(text)
				.setContentIntent(pendingIntent)
				.setSmallIcon(R.drawable.icon_notification)
				// TODO: add action to close the app + service
				// TODO: add action to pause the app?
//				.addAction(android.R.drawable.ic_menu_close_clear_cancel, )
//				.setLargeIcon()
				.build()

		if (Build.VERSION.SDK_INT >= 21) {
			notification.visibility = Notification.VISIBILITY_PUBLIC
		}
		return notification
	}
}