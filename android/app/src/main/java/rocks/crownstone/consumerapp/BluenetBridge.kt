package rocks.crownstone.consumerapp

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import nl.komponents.kovenant.Deferred
import nl.komponents.kovenant.Promise
import nl.komponents.kovenant.android.startKovenant
import nl.komponents.kovenant.android.stopKovenant
import rocks.crownstone.bluenet.Bluenet

class BluenetBridge(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
	private val TAG = this.javaClass.simpleName
	private val reactContext = reactContext
	private val bluenet = Bluenet()
	private val initPromise: Promise<Unit, Exception>

	init {
		startKovenant() // Start thread(s)
		initPromise = bluenet.init(reactContext)
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

		initPromise.success {
			// TODO: makeScannerReady here
		}

		val activity = reactContext.currentActivity
		if (activity != null) {
			bluenet.makeScannerReady(activity)
					.success {
						resolveCallback(callBack)
					}
					.fail {
						// Should never fail..
						rejectCallback(callBack, it.message)
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
	fun setSettings(config: ReadableMap, callBack: Callback) {
		// keys can be either in plain string or hex string format, check length to determine which
		Log.i(TAG, "setSettings")
		// keys can be either in plain string or hex string format, check length to determine which

		var adminKey: String? = null
		var memberKey: String? = null
		var guestKey: String? = null
		if (config.hasKey("adminKey")) {
			adminKey = config.getString("adminKey")
		}
		if (config.hasKey("memberKey")) {
			memberKey = config.getString("memberKey")
		}
		if (config.hasKey("guestKey")) {
			guestKey = config.getString("guestKey")
		}

		adminKey = getKeyFromString(adminKey)
		memberKey = getKeyFromString(memberKey)
		guestKey = getKeyFromString(guestKey)


		bluenet.loadSphereData()

		if (!config.hasKey("encryptionEnabled")) {
			rejectCallback(callBack, "missing parameter")
			return
		}
		val enableEncryption = config.getBoolean("encryptionEnabled")
		if (enableEncryption && guestKey == null && memberKey == null && adminKey == null) {
			rejectCallback(callBack, "no key supplied")
			return
		}

		// This is also provided, it's the same as used for the iBeacon UUID:
		if (!config.hasKey("referenceId")) {
			rejectCallback(callBack, "missing parameter")
			return
		}
		currentSphereId = config.getString("referenceId")
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

	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstones() {

	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstonesUniqueOnly() {

	}

	@ReactMethod
	@Synchronized
	fun stopScanning() {

	}




	@ReactMethod
	@Synchronized
	fun trackIBeacon(ibeaconUUID: String, sphereId: String) {

	}

	@ReactMethod
	@Synchronized
	fun stopTrackingIBeacon(ibeaconUUID: String) {

	}

	@ReactMethod
	@Synchronized
	fun pauseTracking() {

	}

	@ReactMethod
	@Synchronized
	fun resumeTracking() {

	}

	@ReactMethod
	@Synchronized
	fun clearTrackedBeacons(callBack: Callback) {

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