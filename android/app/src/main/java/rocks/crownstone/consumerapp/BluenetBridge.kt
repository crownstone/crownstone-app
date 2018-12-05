package rocks.crownstone.consumerapp

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import nl.komponents.kovenant.Deferred
import nl.komponents.kovenant.Promise
import nl.komponents.kovenant.android.startKovenant
import nl.komponents.kovenant.android.stopKovenant
import rocks.crownstone.bluenet.Bluenet
import rocks.crownstone.bluenet.encryption.KeySet
import rocks.crownstone.bluenet.scanparsing.ScannedDevice
import rocks.crownstone.bluenet.structs.BluenetEvent
import rocks.crownstone.bluenet.structs.KeyData
import rocks.crownstone.bluenet.structs.Keys
import java.util.*

class BluenetBridge(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
	private val TAG = this.javaClass.simpleName
	private val reactContext = reactContext
	private val bluenet = Bluenet()
	private val initPromise: Promise<Unit, Exception>
	private val readyCallbacks = ArrayList<Callback>()

	// Scanning
	private var uniqueScansOnly = false

	// ibeacon tracking
	private var

	init {
		startKovenant() // Start thread(s)
		initPromise = bluenet.init(reactContext)
		initPromise.success {
			bluenet.subscribe(BluenetEvent.SCAN_RESULT,::onScan)
		}
	}

	// TODO: call this?
	fun destroy() {
		stopKovenant() // Stop thread(s)
	}

	override fun getName(): String {
		return "BluenetJS"
	}


////////////////////////////////////////////////////////////////////////////////////////////////////
//  Generic
////////////////////////////////////////////////////////////////////////////////////////////////////

	@ReactMethod
	@Synchronized
	fun isReady(callBack: Callback) {
		// Check if bluenet lib is ready (scanner and bluetooth).
		// Only invoke callback once lib is ready, do not invoke on error.
		// Only called at start of app.
		// Can be called multiple times, and should all be invoked once ready.
		if (bluenet.isScannerReady()) {
			resolveCallback(callBack)
			return
		}

		readyCallbacks.add(callBack)
		initPromise.success {
			val activity = reactContext.currentActivity
			if (activity != null) {
				bluenet.makeScannerReady(activity)
						.success {
							//						resolveCallback(callBack)
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
		// All views have been initialized
		// This means the missing bluetooth functions can now be shown.
//		if (_bleTurnedOff) {
//			BleLog.getInstance().LOGd(TAG, "bluetooth off");
//			sendEvent("bleStatus", "poweredOff");
//		}
//		if (_locationServiceTurnedOff) {
//			BleLog.getInstance().LOGd(TAG, "location service off");
//			sendEvent("locationStatus", "off");
//		}
//		if (_locationPermissionMissing) {
//			BleLog.getInstance().LOGd(TAG, "location permission missing");
//			sendEvent("locationStatus", "noPermission");
//		}
	}

	@ReactMethod
	@Synchronized
	fun setKeySets(keySets: ReadableArray, callBack: Callback) {
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
				rejectCallback(callBack, "Missing referenceId: $keySets")
				return
			}
			val sphereId = keySetJson.getString("referenceId")
			if (!keySetJson.hasKey("iBeaconUuid")) {
				rejectCallback(callBack, "Missing iBeaconUuid: $keySets")
				return
			}
			val ibeaconUuidString = keySetJson.getString("iBeaconUuid")
			val ibeaconUuid = try {
				 UUID.fromString(ibeaconUuidString)
			}
			catch (e: IllegalArgumentException) {
				rejectCallback(callBack, "Invalid UUID: $ibeaconUuidString")
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
		resolveCallback(callBack)
	}



	@ReactMethod
	@Synchronized
	fun quitApp() {

	}

	@ReactMethod
	@Synchronized
	fun resetBle() {

	}

	@ReactMethod
	@Synchronized
	fun requestBleState() {

	}

	@ReactMethod
	@Synchronized
	fun requestLocationPermission() {

	}

	@ReactMethod
	@Synchronized
	fun requestLocation(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun forceClearActiveRegion() {
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
		uniqueScansOnly = false
		bluenet.startScanning()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstones() {
		uniqueScansOnly = false
		bluenet.filterForCrownstones(true)
		bluenet.startScanning()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstonesUniqueOnly() {
		// Validated and non validated, but unique only.
		uniqueScansOnly = true
		bluenet.startScanning()
	}

	@ReactMethod
	@Synchronized
	fun stopScanning() {
		// TODO: Only stop scanning when not tracking..
		bluenet.stopScanning()
	}




	@ReactMethod
	@Synchronized
	fun trackIBeacon(uuidString: String, sphereId: String) {
		// Add the UUID to the list of tracked iBeacons, associate it with given sphereId, and start tracking.
		val uuid = try {
			UUID.fromString(uuidString)
		}
		catch (e: IllegalArgumentException) {
			return
		}
		bluenet.trackIbeacon(uuid)
	}

	@ReactMethod
	@Synchronized
	fun stopTrackingIBeacon(uuidString: String) {
		// Remove the UUID from the list of tracked iBeacons.
		val uuid = try {
			UUID.fromString(uuidString)
		}
		catch (e: IllegalArgumentException) {
			return
		}
		bluenet.stopTrackingIbeacon(uuid)
	}

	@ReactMethod
	@Synchronized
	fun pauseTracking() {
		// Stop tracking, but keep the list of tracked iBeacon UUIDs. Stop sending any tracking events: iBeacon, enter/exit region. Assume all tracked iBeacon UUIDs are out the region.

	}

	@ReactMethod
	@Synchronized
	fun resumeTracking() {
		// Start tracking again, with the list that is already there.

	}

	@ReactMethod
	@Synchronized
	fun clearTrackedBeacons(callBack: Callback) {
		// Clear the list of tracked iBeacons and stop tracking.
	}

	@ReactMethod
	@Synchronized
	fun batterySaving(enable: Boolean) {

	}

	@ReactMethod
	@Synchronized
	fun setBackgroundScanning(enable: Boolean) {

	}




	@ReactMethod
	@Synchronized
	fun startIndoorLocalization() {
		// Start using the classifier
	}

	@ReactMethod
	@Synchronized
	fun stopIndoorLocalization() {
		// Stop using the classifier
	}

	@ReactMethod
	@Synchronized
	fun startCollectingFingerprint() {

	}

	@ReactMethod
	@Synchronized
	fun abortCollectingFingerprint() {

	}

	@ReactMethod
	@Synchronized
	fun pauseCollectingFingerprint() {
		// Stop feeding scans to the localization class

	}

	@ReactMethod
	@Synchronized
	fun resumeCollectingFingerprint() {
		// Start feeding scans to the localization class again

	}

	@ReactMethod
	@Synchronized
	fun finalizeFingerprint(sphereId: String, locationId: String, callback: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun loadFingerprint(sphereId: String, locationId: String, samplesStr: String) {

	}

	@ReactMethod
	@Synchronized
	fun clearFingerprints() {

	}

	@ReactMethod
	@Synchronized
	fun clearFingerprintsPromise(callback: Callback) {

	}




////////////////////////////////////////////////////////////////////////////////////////////////////
//  Connections
////////////////////////////////////////////////////////////////////////////////////////////////////

	@ReactMethod
	@Synchronized
	fun connect(uuid: String, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun disconnectCommand(callback: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun phoneDisconnect(callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun commandFactoryReset(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun setupFactoryReset(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun recover(address: String, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun setupCrownstone(config: ReadableMap, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun bootloaderToNormalMode(address: String, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun restartCrownstone(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun putInDFU(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun setupPutInDFU(callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun performDFU(address: String, fileString: String, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun getMACAddress(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun sendNoOp(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun sendMeshNoOp(callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun getSwitchState(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun setSwitchState(switchStateFloat: Float, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun toggleSwitchState(valueOnFloat: Float, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun multiSwitch(switchItems: ReadableArray, callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun getFirmwareVersion(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun getHardwareVersion(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun getBootloaderVersion(callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun getErrors(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun clearErrors(callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun lockSwitch(enable: Boolean, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun allowDimming(enable: Boolean, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun setSwitchCraft(enable: Boolean, callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun setTime(timestampDouble: Double, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun meshSetTime(timestampDouble: Double, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun getTime(callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun addSchedule(scheduleEntryMap: ReadableMap, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun setSchedule(scheduleEntryMap: ReadableMap, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun clearSchedule(scheduleEntryIndex: Int, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun getAvailableScheduleEntryIndex(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun getSchedules(callBack: Callback) {

	}



	@ReactMethod
	@Synchronized
	fun keepAlive(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun keepAliveState(action: Boolean, state: Float, timeout: Int, callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun meshKeepAlive(callBack: Callback) {

	}

	@ReactMethod
	@Synchronized
	fun meshKeepAliveState(timeout: Int, keepAliveItems: ReadableArray, callBack: Callback) {

	}





	private fun onScan(data: Any) {
		val device = data as ScannedDevice
		if (device.serviceData != null) {
			onScanWithServiceData(device)
		}
	}

	private fun onScanWithServiceData(device: ScannedDevice) {
		val serviceData = device.serviceData ?: return
		if (uniqueScansOnly && !serviceData.unique) {
			return
		}

	}






	private fun rejectCallback(callBack: Callback, error: String?) {
		val retVal = Arguments.createMap()
		retVal.putString("data", error)
		retVal.putBoolean("error", true)
		callBack.invoke(retVal)
	}

	private fun resolveCallback(callBack: Callback) {
		val retVal = Arguments.createMap()
		retVal.putBoolean("error", false)
		callBack.invoke(retVal)
	}

	private fun resolveCallback(callBack: Callback, data: String) {
		val retVal = Arguments.createMap()
		retVal.putString("data", data)
		retVal.putBoolean("error", false)
		callBack.invoke(retVal)
	}

	private fun resolveCallback(callBack: Callback, data: Int) {
		val retVal = Arguments.createMap()
		retVal.putInt("data", data)
		retVal.putBoolean("error", false)
		callBack.invoke(retVal)
	}

	private fun resolveCallback(callBack: Callback, data: Double) {
		val retVal = Arguments.createMap()
		retVal.putDouble("data", data)
		retVal.putBoolean("error", false)
		callBack.invoke(retVal)
	}

	private fun resolveCallback(callBack: Callback, data: WritableMap) {
		val retVal = Arguments.createMap()
		retVal.putMap("data", data)
		retVal.putBoolean("error", false)
		callBack.invoke(retVal)
	}

	private fun resolveCallback(callBack: Callback, data: WritableArray) {
		val retVal = Arguments.createMap()
		retVal.putArray("data", data)
		retVal.putBoolean("error", false)
		callBack.invoke(retVal)
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
}