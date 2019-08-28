/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Jan 15, 2019
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Criteria
import android.location.LocationManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.support.v4.app.NotificationCompat
import android.support.v4.content.ContextCompat
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
import rocks.crownstone.bluenet.encryption.MeshKeySet
import rocks.crownstone.bluenet.packets.ControlPacket
import rocks.crownstone.bluenet.packets.keepAlive.KeepAliveSameTimeout
import rocks.crownstone.bluenet.packets.keepAlive.KeepAliveSameTimeoutItem
import rocks.crownstone.bluenet.packets.keepAlive.MultiKeepAlivePacket
import rocks.crownstone.bluenet.packets.meshCommand.MeshControlPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchListItemPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchListPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchPacket
import rocks.crownstone.bluenet.packets.schedule.ScheduleCommandPacket
import rocks.crownstone.bluenet.packets.schedule.ScheduleEntryPacket
import rocks.crownstone.bluenet.scanhandling.NearestDeviceListEntry
import rocks.crownstone.bluenet.scanparsing.CrownstoneServiceData
import rocks.crownstone.bluenet.scanparsing.ScannedDevice
import rocks.crownstone.bluenet.structs.*
import rocks.crownstone.bluenet.util.Conversion
import rocks.crownstone.bluenet.util.Log
import rocks.crownstone.bluenet.util.SubscriptionId
import rocks.crownstone.bluenet.util.Util
import rocks.crownstone.localization.*
import java.io.File
import java.util.*
import kotlin.math.round

class BluenetBridge(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
	private val TAG = this.javaClass.simpleName
	private val reactContext = reactContext
	private lateinit var bluenet: Bluenet
	private val localization = FingerprintLocalization.getInstance()
	private lateinit var initPromise: Promise<Unit, Exception>
	private lateinit var handler: Handler

	private val ONGOING_NOTIFICATION_ID = 99115

	// Scanning
	enum class ScannerState {
		STOPPED,
		UNIQUE_ONLY,
		HIGH_POWER
	}
//	private var uniqueScansOnly = false // Easier than unsubscribing and subscribing to events.
	private var scannerState = ScannerState.STOPPED
	private var isTracking = false
	private var appForeGround = true // Assume we start in foreground.

	// Localization
	private var isLocalizationTraining = false // TODO: keep this up in localization lib.
	private var isLocalizationTrainingPaused = false
	private var lastLocationId: String? = null
	private var currentSphereId = "" // TODO: get rid of this, as we should support multisphere. Currently needed because scans don't have the sphere id, nor location updates.

	private var nearestStoneSub: SubscriptionId? = null
	private var nearestSetupSub: SubscriptionId? = null
	private var sendUnverifiedAdvertisements = false


	init {

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
//		System.exit(0) // Not recommended, seems to restart app
		Process.killProcess(Process.myPid()) // Not recommended either
	}

	override fun getName(): String {
		return "BluenetJS"
	}

	private val lifecycleEventListener = object : LifecycleEventListener {
		override fun onHostResume() {
			Log.i(TAG, "onHostResume")
			appForeGround = true
			if (::bluenet.isInitialized) {
				bluenet.filterForCrownstones(true)
				sendLocationStatus()
				sendBleStatus()
			}
		}

		override fun onHostPause() {
			Log.i(TAG, "onHostPause")
			appForeGround = false
			if (::bluenet.isInitialized) {
				bluenet.filterForCrownstones(false)
			}
		}

		override fun onHostDestroy() {
			Log.w(TAG, "onHostDestroy")
		}
	}




//##################################################################################################
//region           Generic
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun rerouteEvents() {
		// Start sending events to RN.
		// Can be called before user is logged in.
		// Called before isReady().
		// Subscribe this class as listener for:
		// - Scanned devices
		// - Events
		// - Location
		// - Beacon
		// - etc.
		Log.i(TAG, "rerouteEvents")

		startKovenant() // Start thread(s)

		handler = Handler()

		// Current thread
//		Looper.prepare()
//		Looper.loop()
		bluenet = Bluenet(Looper.myLooper())
//		// Main thread
//		bluenet = Bluenet(Looper.getMainLooper())
//		// Create thread for the bluenet library
//		val handlerThread = HandlerThread("BluenetBridge")
//		handlerThread.start()
//		bluenet = Bluenet(handlerThread.looper)

		reactContext.addLifecycleEventListener(lifecycleEventListener)

		initPromise = bluenet.init(reactContext, ONGOING_NOTIFICATION_ID, getServiceNotification("Crownstone is running in the background"))
		initPromise.success {
			// TODO: this might be called again when app opens.
			Log.i(TAG, "initPromise success")
			bluenet.subscribe(BluenetEvent.NO_LOCATION_SERVICE_PERMISSION, { data: Any -> onLocationStatus(BluenetEvent.NO_LOCATION_SERVICE_PERMISSION) })
			bluenet.subscribe(BluenetEvent.LOCATION_PERMISSION_GRANTED,    { data: Any -> onLocationStatus(BluenetEvent.LOCATION_PERMISSION_GRANTED) })
			bluenet.subscribe(BluenetEvent.LOCATION_SERVICE_TURNED_ON,     { data: Any -> onLocationStatus(BluenetEvent.LOCATION_SERVICE_TURNED_ON) })
			bluenet.subscribe(BluenetEvent.LOCATION_SERVICE_TURNED_OFF,    { data: Any -> onLocationStatus(BluenetEvent.LOCATION_SERVICE_TURNED_OFF) })
			bluenet.subscribe(BluenetEvent.BLE_TURNED_ON,   { data: Any -> onBleStatus(BluenetEvent.BLE_TURNED_ON) })
			bluenet.subscribe(BluenetEvent.BLE_TURNED_OFF,  { data: Any -> onBleStatus(BluenetEvent.BLE_TURNED_OFF) })
			bluenet.subscribe(BluenetEvent.SCAN_RESULT, ::onScan)
			bluenet.subscribe(BluenetEvent.IBEACON_ENTER_REGION, ::onRegionEnter)
			bluenet.subscribe(BluenetEvent.IBEACON_EXIT_REGION, ::onRegionExit)
			bluenet.subscribe(BluenetEvent.IBEACON_SCAN, ::onIbeaconScan)
//			bluenet.subscribe(BluenetEvent.NEAREST_STONE, ::onNearestStone)
//			bluenet.subscribe(BluenetEvent.NEAREST_SETUP, ::onNearestSetup)
			bluenet.subscribe(BluenetEvent.DFU_PROGRESS, ::onDfuProgress)
			val logLevel =     if (rocks.crownstone.bluenet.BuildConfig.DEBUG) Log.Level.VERBOSE else Log.Level.ERROR
			val logLevelFile = if (rocks.crownstone.bluenet.BuildConfig.DEBUG) Log.Level.DEBUG else Log.Level.INFO
			bluenet.setLogLevel(logLevel)
			bluenet.setFileLogLevel(logLevelFile)
		}
		initPromise
				.success {
//					val activity = reactContext.currentActivity
//					if (activity != null) {
//						bluenet.makeScannerReady(activity)
//								.success {
//
//								}
//								.fail {
//									// Should never fail..
//									Log.e(TAG, "makeScannerReady failed: ${it.message}")
//								}
//					}
//					else {
//						bluenet.tryMakeScannerReady(activity)
//					}
				}
				.fail {
					Log.e(TAG, "initPromise failed: ${it.message}")
				}
	}

	@ReactMethod
	@Synchronized
	fun initBroadcasting() {
		Log.i(TAG, "initBroadcasting")
		// Should ask for permissions in order to broadcast.
	}

	@ReactMethod
	@Synchronized
	fun checkBroadcastAuthorization(callback: Callback) {
		Log.i(TAG, "checkBroadcastAuthorization")
		// Should send bleBroadcastStatus event.
		// bleBroadcastStatus and checkBroadcastAuthorization values: "notDetermined" | "restricted" | "denied" | "authorized"
		sendEvent("bleBroadcastStatus", "authorized")
		resolveCallback(callback, "authorized")
	}

	@ReactMethod
	@Synchronized
	fun isReady(callback: Callback) {
		Log.i(TAG, "isReady $callback")
		// Check if bluenet lib is ready (scanner and bluetooth).
		// Only invoke callback once lib is ready, do not invoke on error.
		// Only called at start of app.
		// Can be called multiple times, and should all be invoked once ready.
		bluenet.isReadyPromise()
				.success {
					Log.i(TAG, "resolve isReady $callback")
					resolveCallback(callback)
				}
	}

	@ReactMethod
	@Synchronized
	fun isPeripheralReady(callback: Callback) {
		Log.i(TAG, "isPeripheralReady")
		// Resolve when ready to advertise.
		resolveCallback(callback)
	}

	@ReactMethod
	@Synchronized
	fun viewsInitialized() {
		Log.i(TAG, "viewsInitialized")
		// All views have been initialized
		// This means the missing bluetooth functions can now be shown.

		// Try to make the scanner ready.
		initPromise.success {
			val activity = reactContext.currentActivity
			bluenet.tryMakeScannerReady(activity)
		}

		if (::bluenet.isInitialized) {
			sendLocationStatus()
			sendBleStatus()
		}
		else {
			Log.w(TAG, "Bluenet is not initialized yet.")
		}
	}

	@ReactMethod
	@Synchronized
	fun setKeySets(keySets: ReadableArray, callback: Callback) {
		Log.i(TAG, "setKeySets")
		// keys can be either in plain string or hex string format, check length to determine which

		val keys = Keys()
		val sphereSettings = SphereSettingsMap()
//		val iter = keySets.keySetIterator()
//		while (iter.hasNextKey()) {
//			val sphereId = iter.nextKey()
//			val keySetJson = keySets.getMap(sphereId)
		for (i in 0 until keySets.size()) {
			val keySetJson = keySets.getMap(i) ?: continue
			if (!keySetJson.hasKey("referenceId")) {
				rejectCallback(callback, "Missing referenceId: $keySets")
				return
			}
			val sphereId = keySetJson.getString("referenceId")
			if (sphereId == null) {
				rejectCallback(callback, "Invalid referenceId: $sphereId")
				return
			}
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
			var serviceDataKey: String? = null
			var localizationKey: String? = null

			if (keySetJson.hasKey("adminKey")) {
				adminKey = keySetJson.getString("adminKey")
			}
			if (keySetJson.hasKey("memberKey")) {
				memberKey = keySetJson.getString("memberKey")
			}
			if (keySetJson.hasKey("basicKey")) {
				guestKey = keySetJson.getString("basicKey")
			}
			if (keySetJson.hasKey("serviceDataKey")) {
				serviceDataKey = keySetJson.getString("serviceDataKey")
			}
			if (keySetJson.hasKey("localizationKey")) {
				localizationKey = keySetJson.getString("localizationKey")
			}
			val keySet = KeySet(adminKey, memberKey, guestKey, serviceDataKey, localizationKey)

			val settings = SphereSettings(keySet, null, ibeaconUuid, 0, 0)
			sphereSettings.put(sphereId, settings)
		}
		bluenet.setSphereSettings(sphereSettings)
		resolveCallback(callback)
	}

	@ReactMethod
	@Synchronized
	fun clearKeySets() {
		Log.i(TAG, "clearKeySets")
//		bluenet.clearKeys()
		bluenet.clearSphereSettings()
	}

	@ReactMethod
	@Synchronized
	fun setDevicePreferences(rssiOffset: Int, tapToToggleEnabled: Boolean) {
		// Current rssi offset and whether tap to toggle is enabled.
		// Cache these, to be used for broadcasting.
		Log.i(TAG, "setDevicePreferences rssiOffset=$rssiOffset tapToToggleEnabled=$tapToToggleEnabled")
		bluenet.setTapToToggle(null, tapToToggleEnabled, rssiOffset)
	}

	@ReactMethod
	@Synchronized
	fun setLocationState(sphereUid: Int, locationUid: Int, profile: Int, deviceToken: Int, sphereId: SphereId) {
		// Current sphere short id, location short id, and profile.
		// Cache these for each sphere, to be used for broadcasting.
		Log.i(TAG, "setLocationState sphereUid=$sphereUid locationUid=$locationUid profile=$profile sphereId=$sphereId")
		bluenet.setSphereShortId(sphereId, Conversion.toUint8(sphereUid))
		bluenet.setLocation(sphereId, Conversion.toUint8(locationUid))
		bluenet.setProfile(sphereId, Conversion.toUint8(profile))
		bluenet.setDeviceToken(sphereId, Conversion.toUint8(deviceToken))
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
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun requestBleState() {
		Log.i(TAG, "requestBleState")
		// Send events "bleStatus" and "locationStatus" with the current state.
		sendBleStatus()
		sendLocationStatus()
	}

	@Synchronized
	private fun sendLocationStatus() {
		Log.i(TAG, "sendLocationStatus")
		// "locationStatus" can be: "unknown", "off", "foreground", "on", "noPermission"
		if (!bluenet.isLocationPermissionGranted()) {
			sendEvent("locationStatus", "noPermission")
		}
		else if (!bluenet.isLocationServiceEnabled()) {
			sendEvent("locationStatus", "off")
		}
		else {
			sendEvent("locationStatus", "on")
		}
	}

	@Synchronized
	private fun sendBleStatus() {
		// "bleStatus" can be: "unauthorized", "poweredOff", "poweredOn", "unknown"
		if (!bluenet.isBleEnabled()) {
			Log.i(TAG, "sendBleStatus poweredOff")
			sendEvent("bleStatus", "poweredOff")
		}
		else {
			Log.i(TAG, "sendBleStatus poweredOn")
			sendEvent("bleStatus", "poweredOn")
		}
	}

	@ReactMethod
	@Synchronized
	fun getTrackingState(callback: Callback) {
		Log.i(TAG, "getTrackingState")
		val data = Arguments.createMap()
		data.putBoolean("isMonitoring", true) // True when tracking iBeacons.
		data.putBoolean("isRanging", true) // True when tracking iBeacons (delivered every second).
		resolveCallback(callback, data)
	}

	@ReactMethod
	@Synchronized
	fun isDevelopmentEnvironment(callback: Callback) {
		// Return whether this is app is for development
		Log.i(TAG, "isDevelopmentEnvironment")
		resolveCallback(callback, false)
	}

	@ReactMethod
	@Synchronized
	fun setCrownstoneNames(map: ReadableMap) {
		// Only for iOS.
	}

	@ReactMethod
	@Synchronized
	fun requestLocationPermission() {
		Log.i(TAG, "requestLocationPermission")
		// Request for location permission during tutorial.
		// Should also ask for location services to be turned on.
		// TODO: check if you can't continue the tutorial before giving or denying permission.
		val activity = reactContext.currentActivity ?: return
//		bluenet.requestLocationPermission(activity)
		bluenet.tryMakeScannerReady(activity)
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
		Log.i(TAG, "enableLoggingToFile $enable")
		if (enable) {
			bluenet.initFileLogging(reactContext.currentActivity)
		}
		bluenet.enableFileLogging(enable)
	}

	@ReactMethod
	@Synchronized
	fun enableExtendedLogging(enable: Boolean) {
		Log.i(TAG, "enableExtendedLogging $enable")
		when (enable) {
			true -> bluenet.setFileLogLevel(Log.Level.DEBUG)
			false -> bluenet.setFileLogLevel(Log.Level.INFO)
		}
	}

	@ReactMethod
	@Synchronized
	fun clearLogs() {
		Log.i(TAG, "clearLogs")
		bluenet.initFileLogging(reactContext.currentActivity)
		bluenet.clearLogFiles()
	}

	@ReactMethod
	@Synchronized
	fun subscribeToNearest() {
		// Starts the flow of nearestSetupCrownstone and nearestCrownstone events to the app.
		// Can be called multiple times safely
		if (nearestStoneSub == null) {
			nearestStoneSub = bluenet.subscribe(BluenetEvent.NEAREST_STONE, ::onNearestStone)
		}
		if (nearestSetupSub == null) {
			nearestSetupSub = bluenet.subscribe(BluenetEvent.NEAREST_SETUP, ::onNearestSetup)
		}
	}

	@ReactMethod
	@Synchronized
	fun unsubscribeNearest() {
		// Stops the flow of nearestSetupCrownstone and nearestCrownstone events to the app.
		// Can be called multiple times safely
		val nearestStoneSubVal = nearestStoneSub
		if (nearestStoneSubVal != null) {
			bluenet.unsubscribe(nearestStoneSubVal)
			nearestStoneSub = null
		}
		val nearestSetupSubVal = nearestSetupSub
		if (nearestSetupSubVal != null) {
			bluenet.unsubscribe(nearestSetupSubVal)
			nearestSetupSub = null
		}
	}

	@ReactMethod
	@Synchronized
	fun subscribeToUnverified() {
		// Starts the flow of crownstoneAdvertisementReceived and unverifiedAdvertisementData events to the app.
		// Can be called multiple times safely
		sendUnverifiedAdvertisements = true
	}

	@ReactMethod
	@Synchronized
	fun unsubscribeUnverified() {
		// Starts the flow of crownstoneAdvertisementReceived and unverifiedAdvertisementData events to the app.
		// Can be called multiple times safely
		sendUnverifiedAdvertisements = false
	}

//endregion


//##################################################################################################
//region           Scanning
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun startScanning() {
		Log.i(TAG, "startScanning")
		scannerState = ScannerState.HIGH_POWER
		bluenet.filterForIbeacons(true)
		bluenet.filterForCrownstones(appForeGround)
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstones() {
		Log.i(TAG, "startScanningForCrownstones")
		scannerState = ScannerState.HIGH_POWER
		bluenet.filterForIbeacons(true)
		bluenet.filterForCrownstones(appForeGround)
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstonesUniqueOnly() {
		Log.i(TAG, "startScanningForCrownstonesUniqueOnly")
		// Validated and non validated, but unique only.
		scannerState = ScannerState.UNIQUE_ONLY
		bluenet.filterForIbeacons(true)
		bluenet.filterForCrownstones(appForeGround)
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun stopScanning() {
		Log.i(TAG, "stopScanning")
		// Can't just stopScanning, tracking might still be on.
		scannerState = ScannerState.STOPPED
		updateScanner()
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
		isTracking = true
		updateScanner()
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
		// TODO: change isTracking?
	}

	@ReactMethod
	@Synchronized
	fun pauseTracking() {
		Log.i(TAG, "pauseTracking")
		// Stop tracking, but keep the list of tracked iBeacon UUIDs. Stop sending any tracking events: iBeacon, enter/exit region. Assume all tracked iBeacon UUIDs are out the region.
		bluenet.iBeaconRanger.pause()
		isTracking = false
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun resumeTracking() {
		Log.i(TAG, "resumeTracking")
		// Start tracking again, with the list that is already there.
		bluenet.iBeaconRanger.resume()
		isTracking = true
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun clearTrackedBeacons(callback: Callback) {
		Log.i(TAG, "clearTrackedBeacons")
		// Clear the list of tracked iBeacons and stop tracking.
		bluenet.iBeaconRanger.stopTracking()
		isTracking = false
		updateScanner()
		resolveCallback(callback)
	}

	@ReactMethod
	@Synchronized
	fun batterySaving(enable: Boolean) {
		Log.i(TAG, "batterySaving $enable")
		// Called when app goes to foreground with enable=true
		// Called when app goes to background with enable=false
		// When enabled, beacon ranging should still continue.
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun setBackgroundScanning(enable: Boolean) {
		Log.i(TAG, "setBackgroundScanning $enable")
		// Called after used logged in, and when changed.
		// When disabled, no scanning has to happen in background.
		if (enable) {
			// TODO: This is actually a promise, but it should happen faster than it's possible to click a button.
			bluenet.runInForeground(ONGOING_NOTIFICATION_ID, getServiceNotification("Crownstone is running in the background"))
		}
		else {
			bluenet.runInBackground()
		}
	}

	private fun updateScanner() {
		bluenet.filterForIbeacons(isTracking)
		when (scannerState) {
			ScannerState.STOPPED -> {
				if (isTracking) {
					bluenet.setScanInterval(ScanMode.BALANCED)
					bluenet.startScanning()
				}
				else {
					bluenet.stopScanning()
				}
			}
			ScannerState.UNIQUE_ONLY -> {
				if (isTracking) {
					bluenet.setScanInterval(ScanMode.BALANCED)
				}
				else {
					bluenet.setScanInterval(ScanMode.BALANCED)
				}
				bluenet.startScanning()
			}
			ScannerState.HIGH_POWER -> {
				bluenet.setScanInterval(ScanMode.LOW_LATENCY)
				bluenet.startScanning()
			}
		}
	}
//endregion


//##################################################################################################
//region           Localization
//##################################################################################################

	private val localizationCallback = LocalizationCallback { locationId: String? ->
		onLocationUpdate(locationId)
	}

	@Synchronized
	private fun onLocationUpdate(locationId: String?) {
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
		val fixedSamlesStr = samplesStr.replace("[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}".toRegex()) { it.value.toUpperCase() }
		Log.i(TAG, "fixed: $fixedSamlesStr")
		try {
			val samples = FingerprintSamplesMap(fixedSamlesStr)
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
//endregion


//##################################################################################################
//region           Connections
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun connect(address: String, referenceId: String, callback: Callback) {
		Log.i(TAG, "connect $address")
		bluenet.connect(address)
				.success {
					Log.i(TAG, "connected")
					resolveCallback(callback)
				}
				.fail {
					Log.w(TAG, "failed to connect: ${it.message}")
					rejectCallback(callback, it.message)
				}
	}

	@ReactMethod
	@Synchronized
	fun disconnectCommand(callback: Callback) {
		Log.i(TAG, "disconnectCommand")
		bluenet.control.disconnect()
				.success {
					Log.i(TAG, "disconnected via command")
					resolveCallback(callback)
				}
				.fail {
					Log.w(TAG, "failed to disconnect via command: ${it.message}")
					rejectCallback(callback, it.message)
				}
	}

	@ReactMethod
	@Synchronized
	fun phoneDisconnect(callback: Callback) {
		Log.i(TAG, "phoneDisconnect")
		bluenet.disconnect(false)
				.success {
					Log.i(TAG, "disconnected")
					resolveCallback(callback)
				}
				.fail {
					Log.w(TAG, "failed to disconnect: ${it.message}")
					rejectCallback(callback, it.message)
				}
	}



	@ReactMethod
	@Synchronized
	fun commandFactoryReset(callback: Callback) {
		Log.i(TAG, "factoryReset")
		bluenet.control.factoryReset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setupFactoryReset(callback: Callback) {
		Log.i(TAG, "setupFactoryReset")
		bluenet.control.factoryReset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun recover(address: String, callback: Callback) {
		Log.i(TAG, "recover $address")
		// Connect, recover, and disconnect.
		// If stone is not in recovery mode, then return string "NOT_IN_RECOVERY_MODE" as error data.
		bluenet.control.recover(address)
				.success { resolveCallback(callback) }
				.fail {
					Log.w(TAG, "recovery failed: ${it.message}")
					when (it) {
						is Errors.RecoveryRebootRequired -> rejectCallback(callback, "NOT_IN_RECOVERY_MODE")
						else -> rejectCallback(callback, it.message)
					}
				}
	}

	@ReactMethod
	@Synchronized
	fun setupCrownstone(config: ReadableMap, callback: Callback) {
		Log.i(TAG, "setupCrownstone $config")
		// Emit events "setupProgress" to show the progress
		// keys can be either in plain string or hex string format, check length to determine which

		val crownstoneId: Uint8
		val sphereId: Uint8
		var adminKey: String?
		var memberKey: String?
		var guestKey: String?
		var serviceDataKey: String?
		var localizationKey: String?
		var meshDevKey: String?
		var meshAppKey: String?
		var meshNetKey: String?
		val iBeaconUuid: UUID
		val iBeaconMajor: Uint16
		val iBeaconMinor: Uint16
		var meshAccessAddress: Uint32

		try {
			sphereId = config.getInt("sphereId").toShort()
			crownstoneId = config.getInt("crownstoneId").toShort()
			adminKey = config.getString("adminKey")
			memberKey = config.getString("memberKey")
			guestKey = config.getString("basicKey")
			serviceDataKey = config.getString("serviceDataKey")
			localizationKey = config.getString("localizationKey")
			meshDevKey = config.getString("meshDeviceKey")
			meshAppKey = config.getString("meshApplicationKey")
			meshNetKey = config.getString("meshNetworkKey")

			iBeaconUuid = UUID.fromString(config.getString("ibeaconUUID"))
			iBeaconMajor = config.getInt("ibeaconMajor")
			iBeaconMinor = config.getInt("ibeaconMinor")
			val meshAccessAddressStr = config.getString("meshAccessAddress")
			if (meshAccessAddressStr == null) {
				rejectCallback(callback, "missing meshAccessAddress")
				return
			}
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


		val keySet = KeySet(adminKey, memberKey, guestKey, serviceDataKey, localizationKey)
		val meshKeySet = MeshKeySet(meshDevKey, meshAppKey, meshNetKey)
		val ibeaconData = IbeaconData(iBeaconUuid, iBeaconMajor, iBeaconMinor, 0)

		val subId = bluenet.subscribe(BluenetEvent.SETUP_PROGRESS, ::onSetupProgress)

		// Maybe refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
		// Not sure if this is helpful, as it would've gone wrong already on connect (when session nonce is read in normal mode)
		bluenet.setup.setup(crownstoneId, sphereId, keySet, meshKeySet, meshAccessAddress, ibeaconData)
				.success { resolveCallback(callback) }
				.fail {
					sendEvent("setupProgress", 0) // TODO: is this required?
					rejectCallback(callback, it.message)
				}
				.always { bluenet.unsubscribe(subId) }
	}

	@Synchronized
	fun onSetupProgress(data: Any) {
		val progressDouble = data as Double
		val progressApp: Int = round(progressDouble * 13).toInt()
		sendEvent("setupProgress", progressApp)
	}

	@ReactMethod
	@Synchronized
	fun setupPulse(callback: Callback) {
		// Crownstone is already connected
		// This call will turn the relay on, wait 1 second, turn it off, disconnect
		bluenet.control.setSwitch(100)
				.then { bluenet.waitPromise(1000) }.unwrap()
				.then { bluenet.control.setSwitch(0) }.unwrap()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun bootloaderToNormalMode(address: String, callback: Callback) {
		Log.i(TAG, "bootloaderToNormalMode $address")
		bluenet.connect(address)
				.then { bluenet.dfu.reset() }.unwrap()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun restartCrownstone(callback: Callback) {
		Log.i(TAG, "restartCrownstone")
		bluenet.control.reset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun putInDFU(callback: Callback) {
		Log.i(TAG, "putInDFU")
		bluenet.control.goToDfu()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setupPutInDFU(callback: Callback) {
		Log.i(TAG, "setupPutInDFU")
		bluenet.control.goToDfu()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}



	@ReactMethod
	@Synchronized
	fun performDFU(address: String, fileString: String, callback: Callback) {
		Log.i(TAG, "performDFU address=$address file=$fileString")
		bluenet.dfu.startDfu(address, fileString, DfuService::class.java)
				.then { bluenet.disconnect(true) }
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getMACAddress(callback: Callback) {
		Log.i(TAG, "getMACAddress")
		// Return mac address as string (00:11:22:AA:BB:CC)
		// Refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
		bluenet.setup.getAddress()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun sendNoOp(callback: Callback) {
		Log.i(TAG, "sendNoOp")
		bluenet.control.noop()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun sendMeshNoOp(callback: Callback) {
		Log.i(TAG, "sendMeshNoOp")
		bluenet.control.meshCommand(MeshControlPacket(ControlPacket(ControlType.NOOP)))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}



	@ReactMethod
	@Synchronized
	fun getSwitchState(callback: Callback) {
		Log.i(TAG, "getSwitchState")
		bluenet.state.getSwitchState()
				.success {
					resolveCallback(callback, convertSwitchState(it))
				}
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setSwitchState(switchValDouble: Double, callback: Callback) {
		Log.i(TAG, "setSwitchState $switchValDouble")
		bluenet.control.setSwitch(convertSwitchVal(switchValDouble))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun broadcastSwitch(referenceId: String, stoneIdInt: Int, switchValDouble: Double, callback: Callback) {
		Log.i(TAG, "broadcastSwitch referenceId=$referenceId stoneId=$stoneIdInt switchVal=$switchValDouble")
		val stoneId = Conversion.toUint8(stoneIdInt)
		val switchVal = convertSwitchVal(switchValDouble)
		bluenet.broadCast.switch(referenceId, stoneId, switchVal)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun toggleSwitchState(valueOnDouble: Double, callback: Callback) {
		Log.i(TAG, "toggleSwitchState $valueOnDouble")
		val valueOn = convertSwitchVal(valueOnDouble)
		bluenet.control.toggleSwitchReturnValueSet(valueOn)
				.success { resolveCallback(callback, convertSwitchVal(it)) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun multiSwitch(switchItems: ReadableArray, callback: Callback) {
		Log.i(TAG, "multiSwitch $switchItems")
		// switchItems = [{crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }, {}, ...]

		val listPacket = MultiSwitchListPacket()
		var success = true
		for (i in 0 until switchItems.size()) {
			val itemMap = switchItems.getMap(i) ?: continue
			val crownstoneId = Conversion.toUint8(itemMap.getInt("crownstoneId"))
			val timeout = Conversion.toUint16(itemMap.getInt("timeout"))
			val intentInt = itemMap.getInt("intent")
			val intent = MultiSwitchIntent.fromNum(Conversion.toUint8(intentInt))
			val switchValDouble = itemMap.getDouble("state")
			val switchVal = convertSwitchVal(switchValDouble)
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
		Log.i(TAG, "getFirmwareVersion")
		bluenet.deviceInfo.getFirmwareVersion()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getHardwareVersion(callback: Callback) {
		Log.i(TAG, "getHardwareVersion")
		bluenet.deviceInfo.getHardwareVersion()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getBootloaderVersion(callback: Callback) {
		Log.i(TAG, "getBootloaderVersion")
		// When bootloader version is not available (because not in dfu mode), return empty string.
		bluenet.deviceInfo.getBootloaderVersion()
				.success { resolveCallback(callback, it) }
				.fail {
					when (it) {
						is Errors.NotInMode -> {
							Log.i(TAG, "Not in DFU mode: resolve with empty string")
							resolveCallback(callback, "")
						}
						else -> rejectCallback(callback, it.message)
					}
				}
	}



	@ReactMethod
	@Synchronized
	fun clearErrors(clearErrorsMap: ReadableMap, callback: Callback) {
		Log.i(TAG, "clearErrors")
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
		Log.i(TAG, "lockSwitch $enable")
		bluenet.control.lockSwitch(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun allowDimming(enable: Boolean, callback: Callback) {
		Log.i(TAG, "allowDimming $enable")
		bluenet.control.allowDimming(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setSwitchCraft(enable: Boolean, callback: Callback) {
		Log.i(TAG, "setSwitchCraft $enable")
		bluenet.control.enableSwitchCraft(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setMeshChannel(channel: Int, callback: Callback) {
		Log.i(TAG, "setMeshChannel $channel")
		bluenet.config.setMeshChannel(channel.toShort())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}


	@ReactMethod
	@Synchronized
	fun setTime(timestampDouble: Double, callback: Callback) {
		Log.i(TAG, "setTime $timestampDouble")
		val timestamp = timestampDouble.toLong()
		bluenet.control.setTime(timestamp)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun meshSetTime(timestampDouble: Double, callback: Callback) {
		Log.i(TAG, "meshSetTime $timestampDouble")
		val timestamp = timestampDouble.toLong()
		// TODO: implement as single command
		bluenet.control.meshCommand(MeshControlPacket(ControlPacket(ControlType.SET_TIME, Conversion.toByteArray(timestamp))))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getTime(callback: Callback) {
		Log.i(TAG, "getTime")
		bluenet.state.getTime()
				.success {
					resolveCallback(callback, it.toDouble()) // No long in react-native
				}
				.fail { rejectCallback(callback, it.message) }
	}


	@ReactMethod
	@Synchronized
	fun addSchedule(scheduleEntryMap: ReadableMap, callback: Callback) {
		Log.i(TAG, "addSchedule $scheduleEntryMap")
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
		Log.i(TAG, "addSchedule $scheduleEntryMap")
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
		Log.i(TAG, "clearSchedule $scheduleEntryIndex")
		// Clears the schedule entry at given index.
		bluenet.control.removeSchedule(scheduleEntryIndex.toShort())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getAvailableScheduleEntryIndex(callback: Callback) {
		Log.i(TAG, "getAvailableScheduleEntryIndex")
		// Returns an empty spot in the schedule list.
		bluenet.state.getAvailableScheduleEntryIndex()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getSchedules(callback: Callback) {
		Log.i(TAG, "getSchedules")
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
		Log.i(TAG, "keepAlive")
		// Send a keep alive message with no action.
		bluenet.control.keepAlive()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun keepAliveState(actionBool: Boolean, state: Double, timeout: Int, callback: Callback) {
		Log.i(TAG, "keepAliveState action=$actionBool state=$state timeout=$timeout")
		// Send a keep alive message with optional action.
		val action = when (actionBool) {
			true -> KeepAliveAction.CHANGE
			false -> KeepAliveAction.NO_CHANGE
		}
		val switchVal = convertSwitchVal(state)
		bluenet.control.keepAliveAction(action, switchVal, timeout)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun meshKeepAlive(callback: Callback) {
		Log.i(TAG, "meshKeepAlive")
		// Make the crownstone resend the last keep alive message on the mesh.
		bluenet.control.keepAliveMeshRepeat()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun meshKeepAliveState(timeout: Int, keepAliveItems: ReadableArray, callback: Callback) {
		Log.i(TAG, "meshKeepAliveState timeout=$timeout entries: $keepAliveItems")
		// Make the crownstone send a keep alive message on the mesh.
		// keepAliveItems = [{crownstoneId: number(uint16), action: Boolean, state: number(float) [ 0 .. 1 ]}]
		val sameTimeoutPacket = KeepAliveSameTimeout(timeout)
		for (i in 0 until keepAliveItems.size()) {
			val entry = keepAliveItems.getMap(i) ?: continue
			val crownstoneId = Conversion.toUint8(entry.getInt("crownstoneId"))
			val actionSwitch = KeepAliveActionSwitch()
			if (entry.getBoolean("action")) {
				val switchVal = convertSwitchVal(entry.getDouble("state"))
				actionSwitch.setAction(switchVal)
			}
			val item = KeepAliveSameTimeoutItem(crownstoneId, actionSwitch)
			sameTimeoutPacket.add(item)
		}
		val multiKeepAlivePacket = MultiKeepAlivePacket(sameTimeoutPacket)
		bluenet.control.keepAliveMeshAction(multiKeepAlivePacket)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}
//endregion


//##################################################################################################
//region           Advertising
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun startAdvertising() {
		Log.i(TAG, "startAdvertising")
		// TODO
	}

	@ReactMethod
	@Synchronized
	fun stopAdvertising() {
		Log.i(TAG, "stopAdvertising")
		// TODO
	}
//endregion


//##################################################################################################
//region           Events
//##################################################################################################

	@Synchronized
	private fun onLocationStatus(event: BluenetEvent) {
		Log.i(TAG, "onLocationStatus $event")
		when (event) {
			BluenetEvent.NO_LOCATION_SERVICE_PERMISSION -> {
			}
			BluenetEvent.LOCATION_PERMISSION_GRANTED -> {
			}
			BluenetEvent.LOCATION_SERVICE_TURNED_ON -> {
			}
			BluenetEvent.LOCATION_SERVICE_TURNED_OFF -> {
			}
		}
		sendLocationStatus()
	}

	@Synchronized
	private fun onBleStatus(event: BluenetEvent) {
		Log.i(TAG, "onBleStatus $event")
		when (event) {
			BluenetEvent.BLE_TURNED_ON -> {
			}
			BluenetEvent.BLE_TURNED_OFF -> {
			}
		}
		sendBleStatus()
	}

	@Synchronized
	private fun onRegionEnter(data: Any) {
		val eventData = data as IbeaconRegionEventData
		val uuid = eventData.changedRegion
		for (region in eventData.list) {
			if (region.key == uuid) {
				val referenceId = region.value
				currentSphereId = referenceId
				Log.i(TAG, "enterSphere uuid=$uuid refId=$referenceId")
				sendEvent("enterSphere", referenceId)
			}
		}
	}

	@Synchronized
	private fun onRegionExit(data: Any) {
		val eventData = data as IbeaconRegionEventData
		val uuid = eventData.changedRegion
		for (region in eventData.list) {
			if (region.key == uuid) {
				val referenceId = region.value
//				currentSphereId = ""
				Log.i(TAG, "exitSphere uuid=$uuid refId=$referenceId")
				sendEvent("exitSphere", referenceId)
			}
		}
	}

	@Synchronized
	private fun onIbeaconScan(data: Any) {
		val scanList = data as ScannedIbeaconList
		if (scanList.isEmpty()) {
			return
		}
		val array = Arguments.createArray()
		for (scan in scanList) {
			val beaconId = "${scan.ibeaconData.uuid.toString().toUpperCase()}_Maj:${scan.ibeaconData.major}_Min:${scan.ibeaconData.minor}"
			if (isLocalizationTraining && !isLocalizationTrainingPaused) {
				localization.feedMeasurement(scan.rssi, beaconId, null, null)
			}
			localization.track(scan.rssi, beaconId, null)
			val map = Arguments.createMap()
			map.putString("id", beaconId)
			map.putString("uuid", scan.ibeaconData.uuid.toString())
			map.putInt("major", scan.ibeaconData.major)
			map.putInt("minor", scan.ibeaconData.minor)
			map.putInt("rssi", scan.rssi)
			map.putString("referenceId", scan.referenceId)
			array.pushMap(map)
		}
		sendEvent("iBeaconAdvertisement", array)
	}

	@Synchronized
	private fun onNearestStone(data: Any) {
		// Any stone, validated or not, any operation mode.
		val nearest = data as NearestDeviceListEntry
		val nearestMap = exportNearest(nearest)
//		Log.i(TAG, "nearestCrownstone: $nearest")
		sendEvent("nearestCrownstone", nearestMap)
	}

	@Synchronized
	private fun onNearestSetup(data: Any) {
		val nearest = data as NearestDeviceListEntry
		val nearestMap = exportNearest(nearest)
		sendEvent("nearestSetupCrownstone", nearestMap)
	}

	private fun exportNearest(nearest: NearestDeviceListEntry): WritableMap {
		val map = Arguments.createMap()
//		map.putString("name", nearest.name) // TODO: is this required?
		map.putString("handle", nearest.deviceAddress)
		map.putInt("rssi", nearest.rssi)
		map.putBoolean("verified", nearest.validated)
		map.putBoolean("setupMode", nearest.operationMode == OperationMode.SETUP)
		map.putBoolean("dfuMode", nearest.operationMode == OperationMode.DFU)
		return map
	}

	@Synchronized
	private fun onDfuProgress(data: Any) {
		val progress = data as DfuProgress
		val map = Arguments.createMap()
		map.putInt("progress", progress.percentage)
		map.putDouble("currentSpeedBytesPerSecond", progress.currentSpeed.toDouble())
		map.putDouble("avgSpeedBytesPerSecond", progress.avgSpeed.toDouble())
		map.putInt("part", progress.currentPart)
		map.putInt("totalParts", progress.totalParts)
		sendEvent("dfuProgress", map)
	}

	@Synchronized
	private fun onScan(data: Any) {
		val device = data as ScannedDevice

		if (device.isStone()) {
			if (sendUnverifiedAdvertisements) {
				sendEvent("crownstoneAdvertisementReceived", device.address) // Any advertisement, verified and unverified from crownstones.
			}
		}

		if (device.operationMode == OperationMode.DFU) {
			val advertisementMap = exportAdvertisementData(device, null)
			sendEvent("verifiedDFUAdvertisementData", advertisementMap)
			return
		}

		if (device.serviceData != null) {
			onScanWithServiceData(device)
		}
	}


	@Synchronized
	private fun onScanWithServiceData(device: ScannedDevice) {
		if (!device.isStone()) {
			return
		}
		val serviceData = device.serviceData ?: return
		if (scannerState == ScannerState.UNIQUE_ONLY && !serviceData.unique) {
			return
		}
		val advertisementMap = exportAdvertisementData(device, serviceData) // Any advertisement, verified and unverified from crownstones.
//		// Clone the advertisementMap to avoid the error: com.facebook.react.bridge.ObjectAlreadyConsumedException: Map already consumed
//		val advertisementBundle = Arguments.toBundle(advertisementMap)
//		// Then send: Arguments.fromBundle(advertisementBundle)

		if (device.validated) {
			when (device.operationMode) {
				OperationMode.SETUP -> sendEvent("verifiedSetupAdvertisementData", advertisementMap)
				OperationMode.NORMAL -> sendEvent("verifiedAdvertisementData", advertisementMap) // Any verfied advertisement, only normal operation mode.
			}
//			sendEvent("anyVerifiedAdvertisementData", Arguments.fromBundle(advertisementBundle)) // Any verfied advertisement, normal, setup and dfu mode.
		}
		else if (sendUnverifiedAdvertisements) {
			sendEvent("unverifiedAdvertisementData", advertisementMap)
		}
	}

	private fun exportAdvertisementData(device: ScannedDevice, serviceData: CrownstoneServiceData?): WritableMap {
		// See crownstoneAdvertisement in proxy.d.ts
		val advertisementMap = Arguments.createMap()
		advertisementMap.putString("handle", device.address)
		advertisementMap.putString("name", device.name)
		advertisementMap.putInt("rssi", device.rssi)
		advertisementMap.putBoolean("isInDFUMode", device.operationMode == OperationMode.DFU)

//		if (device.validated && device.operationMode == OperationMode.NORMAL) {
//			advertisementMap.putString("referenceId", currentSphereId) // TODO: make this work for multisphere
//		}
		if (device.validated && device.operationMode == OperationMode.NORMAL && device.sphereId != null) {
			advertisementMap.putString("referenceId", device.sphereId)
		}

//		val serviceDataMap = when (serviceData) {
//			null -> Arguments.createMap()
//			else -> exportServiceData(device, serviceData)
//		}
//		advertisementMap.putMap("serviceData", serviceDataMap)
		if (serviceData != null) {
			val serviceDataMap = exportServiceData(device, serviceData)
			advertisementMap.putMap("serviceData", serviceDataMap)
		}

		return advertisementMap
	}

	private fun exportServiceData(device: ScannedDevice, serviceData: CrownstoneServiceData): WritableMap {
		val serviceDataMap = Arguments.createMap()

//		serviceDataMap.putInt("opCode", serviceData.version.num.toInt()) // Not required
//		serviceDataMap.putInt("dataType", serviceData.type.num.toInt()) // Not required
		serviceDataMap.putBoolean("stateOfExternalCrownstone", serviceData.flagExternalData)
		serviceDataMap.putBoolean("hasError", serviceData.flagError)
		serviceDataMap.putBoolean("setupMode", device.operationMode == OperationMode.SETUP)
		serviceDataMap.putInt("crownstoneId", serviceData.crownstoneId.toInt())
		serviceDataMap.putDouble("switchState", convertSwitchState(serviceData.switchState))
//		serviceDataMap.putInt("flagsBitmask", 0) // Not required
		serviceDataMap.putInt("temperature", serviceData.temperature.toInt())
		serviceDataMap.putDouble("powerFactor", serviceData.powerFactor)
		serviceDataMap.putDouble("powerUsageReal", serviceData.powerUsageReal)
		serviceDataMap.putDouble("powerUsageApparent", serviceData.powerUsageApparent)
		serviceDataMap.putDouble("accumulatedEnergy", serviceData.energyUsed.toDouble()) // TODO: should be long?

		if (serviceData.version == ServiceDataVersion.V1 || serviceData.version == ServiceDataVersion.UNKNOWN) {
			serviceDataMap.putDouble("timestamp", -1.0)
		}
		else if (serviceData.flagTimeSet) {
			serviceDataMap.putDouble("timestamp", serviceData.timestamp.toDouble())
		}
		else {
			serviceDataMap.putInt("timestamp", serviceData.count)
		}

		serviceDataMap.putBoolean("dimmingAvailable", serviceData.flagDimmingAvailable)
		serviceDataMap.putBoolean("dimmingAllowed", serviceData.flagDimmable)
		serviceDataMap.putBoolean("switchLocked", serviceData.flagSwitchLocked)
		serviceDataMap.putBoolean("timeSet", serviceData.flagTimeSet)
		serviceDataMap.putBoolean("switchCraftEnabled", serviceData.flagSwitchCraft)

		val deviceTypeString = when (serviceData.deviceType) {
			DeviceType.CROWNSTONE_PLUG -> "plug"
			DeviceType.CROWNSTONE_BUILTIN -> "builtin"
			DeviceType.CROWNSTONE_DONGLE -> "crownstoneUSB"
			DeviceType.GUIDESTONE -> "guidestone"
			DeviceType.CROWNSTONE_BUILTIN_ONE -> "builtinOne"
			else -> "undefined"
		}
		if (deviceTypeString == "undefined") {
			Log.e(TAG, "Device type undefined: $device")
		}
		serviceDataMap.putString("deviceType", deviceTypeString)

		serviceDataMap.putInt("rssiOfExternalCrownstone", serviceData.externalRssi.toInt())

		val errorMode = when (serviceData.type) {
			ServiceDataType.ERROR -> true
			ServiceDataType.EXT_ERROR -> true
			else -> false
		}
		serviceDataMap.putBoolean("errorMode", errorMode)

		val errorMap = Arguments.createMap()
		errorMap.putBoolean("overCurrent", serviceData.errorOverCurrent)
		errorMap.putBoolean("overCurrentDimmer", serviceData.errorOverCurrentDimmer)
		errorMap.putBoolean("temperatureChip", serviceData.errorChipTemperature)
		errorMap.putBoolean("temperatureDimmer", serviceData.errorDimmerTemperature)
		errorMap.putBoolean("dimmerOnFailure", serviceData.errorDimmerFailureOn)
		errorMap.putBoolean("dimmerOffFailure", serviceData.errorDimmerFailureOff)
		errorMap.putNull("bitMask") // Only used for debug
		serviceDataMap.putMap("errors", errorMap)
		serviceDataMap.putInt("uniqueElement", serviceData.changingData)

		return serviceDataMap
	}


	@Synchronized
	fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
		bluenet.handlePermissionResult(requestCode, permissions, grantResults)
	}
//endregion


//##################################################################################################
//region           Helper functions
//##################################################################################################

	/** Convert 0.0 .. 1.0 value to switch value (0-100).
	 */
	private fun convertSwitchVal(switchVal: Double): Uint8 {
		var switchValInt = 0
		if (switchVal >= 1.0) {
			switchValInt = 100
		}
		else if (switchVal > 0) {
			switchValInt = Math.round(switchVal * 100).toInt()
		}
		return Conversion.toUint8(switchValInt)
	}

	/** Convert switch value (0-100) to 0.0 .. 1.0 value.
	 */
	private fun convertSwitchVal(switchVal: Uint8): Double {
		return switchVal.toDouble() / 100
	}

	/** Converts switch state (0-228) to value used in react: 0 - 228.
	 */
	private fun convertSwitchState(switchState: SwitchState): Double {
//		var switchStateInt = switchState.state.toInt()
//		if (switchStateInt > 100) {
//			switchStateInt = 100
//		}
//		return switchStateInt.toDouble() / 100
//		return switchState.value.toDouble() / 100
		return switchState.state.toDouble()
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

	private fun resolveCallback(callback: Callback, data: Boolean) {
		val retVal = Arguments.createMap()
		retVal.putBoolean("data", data)
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
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun sendEvent(eventName: String, params: Int?) {
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun getServiceNotification(text: String): Notification {
		val notificationChannelId = "Crownstone" // The id of the notification channel. Must be unique per package. The value may be truncated if it is too long.
//		val icon = BitmapFactory.decodeResource(resources, R.drawable.ic_launcher_background)

		val notificationIntent = Intent(reactContext, MainActivity::class.java)
//		notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
//		notificationIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
		notificationIntent.action = Intent.ACTION_MAIN
		notificationIntent.addCategory(Intent.CATEGORY_LAUNCHER)
		notificationIntent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT

		if (Build.VERSION.SDK_INT >= 26) {
			// Create the notification channel, must be done before posting any notification.
			// It's safe to call this repeatedly because creating an existing notification channel performs no operation.
			val name = "Crownstone" // The user visible name of the channel. The recommended maximum length is 40 characters; the value may be truncated if it is too long.
//			val importance = android.app.NotificationManager.IMPORTANCE_NONE
			val importance = android.app.NotificationManager.IMPORTANCE_MIN
//			val importance = android.app.NotificationManager.IMPORTANCE_LOW
			val channel = NotificationChannel(notificationChannelId, name, importance)
//			channel.description = "description" // The recommended maximum length is 300 characters; the value may be truncated if it is too long.
			channel.setShowBadge(false)

			// Register the channel with the system; you can't change the importance or other notification behaviors after this
			val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
			notificationManager.createNotificationChannel(channel)
		}


//		notificationIntent.setClassName("rocks.crownstone.consumerapp", "MainActivity");
//		notificationIntent.setAction("ACTION_MAIN");
//		PendingIntent pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_ONE_SHOT);
		val pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT)
//		PendingIntent pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, 0);

		val notification = NotificationCompat.Builder(reactContext, notificationChannelId)
				.setSmallIcon(R.drawable.icon_notification)
				.setContentTitle("Crownstone is running")
				.setContentText(text)
				.setContentIntent(pendingIntent)
				.setOngoing(true)
				.setPriority(NotificationCompat.PRIORITY_LOW)
				.setVisibility(Notification.VISIBILITY_PUBLIC)
				// TODO: add action to close the app + service
				// TODO: add action to pause the app?
//				.addAction(android.R.drawable.ic_menu_close_clear_cancel, )
//				.setLargeIcon()
				.build()

		return notification
	}
}
//endregion
