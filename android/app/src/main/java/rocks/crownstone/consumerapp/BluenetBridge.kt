/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Jan 15, 2019
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp

import android.app.*
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Criteria
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.*
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import nl.komponents.kovenant.Promise
import nl.komponents.kovenant.android.startKovenant
import nl.komponents.kovenant.android.stopKovenant
import nl.komponents.kovenant.then
import nl.komponents.kovenant.unwrap
import rocks.crownstone.bluenet.Bluenet
import rocks.crownstone.bluenet.BluenetConfig
import rocks.crownstone.bluenet.behaviour.BehaviourHashGen
import rocks.crownstone.bluenet.behaviour.BehaviourSyncerFromCrownstone
import rocks.crownstone.bluenet.encryption.KeySet
import rocks.crownstone.bluenet.encryption.MeshKeySet
import rocks.crownstone.bluenet.packets.behaviour.*
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchItemPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchLegacyItemPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchLegacyPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchPacket
import rocks.crownstone.bluenet.packets.powerSamples.PowerSamplesType
import rocks.crownstone.bluenet.scanhandling.NearestDeviceListEntry
import rocks.crownstone.bluenet.scanparsing.CrownstoneServiceData
import rocks.crownstone.bluenet.scanparsing.ScannedDevice
import rocks.crownstone.bluenet.structs.*
import rocks.crownstone.bluenet.util.*
import rocks.crownstone.bluenet.util.Util.isBitSet
import rocks.crownstone.consumerapp.hubdata.DataType
import rocks.crownstone.consumerapp.hubdata.HubDataReplyPacket
import rocks.crownstone.consumerapp.hubdata.reply.DataReplyPacket
import rocks.crownstone.consumerapp.hubdata.reply.ErrorReplyPacket
import rocks.crownstone.consumerapp.hubdata.reply.SuccessReplyPacket
import java.util.*
import kotlin.collections.ArrayList
import kotlin.math.round

class BluenetBridge(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
	private val TAG = this.javaClass.simpleName
	private val reactContext = reactContext
	private lateinit var bluenet: Bluenet
	private var bluenetInstantiated = false // Whether the bluenet object has been created.
	private lateinit var initBluenetPromise: Promise<Unit, Exception> // Success when bluenet is initialized.
	private lateinit var looper: Looper
	private lateinit var handler: Handler

	private lateinit var behaviourSyncer: BehaviourSyncerFromCrownstone

	private val ONGOING_NOTIFICATION_ID = 99115
	private val BLE_STATUS_NOTIFICATION_ID = 99116
	private val LOCATION_STATUS_NOTIFICATION_ID = 99117

	// Scanning
	enum class ScannerState {
		STOPPED,
		UNIQUE_ONLY,
		BALANCED,
		HIGH_POWER
	}
	private var scannerState = ScannerState.STOPPED
	private var defaultScanMode = ScanMode.BALANCED // To be changed by a setting.
	private var isTracking = false
	private var batterySaving = false
	private var backgroundScanning = true
	private var appForeGround = false

	private var isInSphere = false

	private var nearestStoneSub: SubscriptionId? = null
	private var nearestSetupSub: SubscriptionId? = null
	private var sendUnverifiedAdvertisements = false

	private var lastLocation: Location? = null // Store last known GPS location.

	private val SCAN_FAILURE_ALERT_MIN_INTERVAL_MS: Long = 24*3600*1000 // Only show an alert once a day.
	private var lastScanFailureAlertTimestampMs = -SCAN_FAILURE_ALERT_MIN_INTERVAL_MS

	enum class AppLogLevel {
		NONE,
		BASIC,
		EXTENDED
	}
	private var appLogLevel = AppLogLevel.NONE

	private val tickRunnable = Runnable {
		onTick()
	}

	init {
	}

	fun destroy() {
		stopKovenant() // Stop thread(s)
		if (::bluenet.isInitialized) {
			bluenet.destroy()
		}
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
			if (!::handler.isInitialized) {
				return
			}
			// Make sure function runs on same thread.
			handler.post {
				onBridgeHostResume()
			}
		}

		override fun onHostPause() {
			if (!::handler.isInitialized) {
				return
			}
			// Make sure function runs on same thread.
			handler.post {
				onBridgeHostPause()
			}
		}

		override fun onHostDestroy() {
			Log.w(TAG, "onHostDestroy")
		}
	}

	@Synchronized
	private fun onBridgeHostResume() {
		Log.i(TAG, "onHostResume")
		appForeGround = true
		initBluenetPromise.success {
			handler.post {
				// If the user allowed permission via settings menu, we can now try to make scanner ready.
				// But don't give the activity, so there won't be any requests.
				bluenet.tryMakeScannerReady(null)

				updateScanner()
				// When the GUI is killed, but the app is still running,
				// the GUI needs to get the location and BLE status when the GUI is opened again.
				// Although we might be in login screen, this is unlikely.
				sendLocationStatus()
				sendBleStatus()
//				checkBatteryOptimizationSetting()
			}
		}
	}

	@Synchronized
	private fun onBridgeHostPause() {
		Log.i(TAG, "onHostPause")
		appForeGround = false
		initBluenetPromise.success {
			handler.post {
				updateScanner()
			}
		}
	}

	fun onTrimMemory(level: Int) {
		Log.i(TAG, "onTrimMemory level=$level")
		when (level) {
			ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN -> {
				Log.i(TAG, "Release hidden UI memory.")
				/*
                   Release any UI objects that currently hold memory.

                   The user interface has moved to the background.
                */
			}
			ComponentCallbacks2.TRIM_MEMORY_RUNNING_MODERATE,
			ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW,
			ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL -> {
				Log.i(TAG, "Release memory that app doesn't need.")
				/*
				   Release any memory that your app doesn't need to run.

				   The device is running low on memory while the app is running.
				   The event raised indicates the severity of the memory-related event.
				   If the event is TRIM_MEMORY_RUNNING_CRITICAL, then the system will
				   begin killing background processes.
				*/
			}
			ComponentCallbacks2.TRIM_MEMORY_BACKGROUND,
			ComponentCallbacks2.TRIM_MEMORY_MODERATE,
			ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
				Log.i(TAG, "Release as much memory as possible.")
				/*
				   Release as much memory as the process can.

				   The app is on the LRU list and the system is running low on memory.
				   The event raised indicates where the app sits within the LRU list.
				   If the event is TRIM_MEMORY_COMPLETE, the process will be one of
				   the first to be terminated.
				*/
			}
			else -> {
				/*
				  Release any non-critical data structures.

				  The app received an unrecognized memory level value
				  from the system. Treat this as a generic low-memory message.
				*/
			}
		}
	}

	fun initBluenet() {
		if (bluenetInstantiated) {
			return
		}
		bluenetInstantiated = true

		// Start promise thread(s)
		startKovenant()

//		handler = Handler()

		// Current thread
//		Looper.prepare()
//		Looper.loop()
		looper = Looper.myLooper()!!
		bluenet = Bluenet(looper)
		handler = Handler(looper)
		behaviourSyncer = BehaviourSyncerFromCrownstone(bluenet)
		handler.postDelayed(tickRunnable, 1000)

//		// Main thread
//		bluenet = Bluenet(Looper.getMainLooper())
//		// Create thread for the bluenet library
//		val handlerThread = HandlerThread("BluenetBridge")
//		handlerThread.start()
//		bluenet = Bluenet(handlerThread.looper)

		reactContext.addLifecycleEventListener(lifecycleEventListener)

		initBluenetPromise = bluenet.init(reactContext, ONGOING_NOTIFICATION_ID, getServiceNotification("Crownstone is running", "Crownstone is running in the background"))
		updateServiceNotification()
		initLogger()
		initBluenetPromise
				.success {
					// TODO: this might be called again when app opens.
					Log.i(TAG, "initPromise success")
				}
				.fail {
					Log.e(TAG, "initPromise failed: ${it.message}")
				}
		subscribeBluenetEvents()
	}

	fun initLogger() {
		initBluenetPromise.success {
			handler.post {
//				enableLoggingToFile(true)
//				enableExtendedLogging(true)
				val logLevel = if (rocks.crownstone.bluenet.BuildConfig.DEBUG) Log.Level.VERBOSE else Log.Level.ERROR
				val logLevelFile = if (rocks.crownstone.bluenet.BuildConfig.DEBUG) Log.Level.DEBUG else Log.Level.INFO
				bluenet.setLogLevel(logLevel)
				bluenet.setFileLogLevel(logLevelFile)
			}
		}
	}

	fun subscribeBluenetEvents() {
		initBluenetPromise.success {
			handler.post {
				Log.i(TAG, "subscribeBluenetEvents")
				bluenet.subscribe(BluenetEvent.PERMISSIONS_MISSING, { data: Any? -> onLocationStatus(BluenetEvent.PERMISSIONS_MISSING) })
				bluenet.subscribe(BluenetEvent.PERMISSIONS_GRANTED, { data: Any? -> onLocationStatus(BluenetEvent.PERMISSIONS_GRANTED) })
				bluenet.subscribe(BluenetEvent.LOCATION_SERVICE_TURNED_ON, { data: Any? -> onLocationStatus(BluenetEvent.LOCATION_SERVICE_TURNED_ON) })
				bluenet.subscribe(BluenetEvent.LOCATION_SERVICE_TURNED_OFF, { data: Any? -> onLocationStatus(BluenetEvent.LOCATION_SERVICE_TURNED_OFF) })
				bluenet.subscribe(BluenetEvent.BLE_TURNED_ON, { data: Any? -> onBleStatus(BluenetEvent.BLE_TURNED_ON) })
				bluenet.subscribe(BluenetEvent.BLE_TURNED_OFF, { data: Any? -> onBleStatus(BluenetEvent.BLE_TURNED_OFF) })
				bluenet.subscribe(BluenetEvent.SCAN_RESULT, { data: Any? -> onScan(data as ScannedDevice) })
				bluenet.subscribe(BluenetEvent.IBEACON_ENTER_REGION, { data: Any? -> onRegionEnter(data as IbeaconRegionEventData) })
				bluenet.subscribe(BluenetEvent.IBEACON_EXIT_REGION, { data: Any? -> onRegionExit(data as IbeaconRegionEventData) })
				bluenet.subscribe(BluenetEvent.IBEACON_SCAN, { data: Any? -> onIbeaconScan(data as ScannedIbeaconList) })
//				bluenet.subscribe(BluenetEvent.NEAREST_STONE, { data: Any? -> onNearestStone() })
//				bluenet.subscribe(BluenetEvent.NEAREST_SETUP, { data: Any? -> onNearestSetup() })
				bluenet.subscribe(BluenetEvent.DFU_PROGRESS, { data: Any? -> onDfuProgress(data as DfuProgress) })
				bluenet.subscribe(BluenetEvent.SCAN_FAILURE, { data: Any? -> onScanFailure(data as ScanStartFailure) })
				bluenet.subscribe(BluenetEvent.CORE_CONNECTED, { data: Any? -> onConnect(data as DeviceAddress) })
				bluenet.subscribe(BluenetEvent.CORE_DISCONNECTED, { data: Any? -> onDisconnect(data as DeviceAddress) })
			}
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
		initBluenet()
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
		// Resolve when ready to broadcast.
		resolveCallback(callback)
	}

	@ReactMethod
	@Synchronized
	fun viewsInitialized() {
		Log.i(TAG, "viewsInitialized")
		// All views have been initialized.
		// But it might be at the login screen, so currently we wait for requestLocationPermission().
	}

	@ReactMethod
	@Synchronized
	fun getLaunchArguments(callback: Callback) {
		// Should return the detox launchArgs as map.

		val resultMap = Arguments.createMap()
		val bundle = reactContext.currentActivity?.intent?.getBundleExtra("launchArgs")
		Log.i(TAG, "getLaunchArguments bundle=$bundle")
		if (bundle == null) {
			resolveCallback(callback, resultMap)
			return
		}
		// List of expected string launchArgs.
		val stringKeys = arrayOf("localization", "cloud_v1", "cloud_v2", "mockBridgeUrl")
		for (key in stringKeys) {
			resultMap.putString(key, bundle.getString(key, ""))
		}

		// List of expected bool launchArgs.
		val boolKeys = arrayOf("mockCameraLibrary", "mockImageLibrary", "mockBluenet")
		for (key in boolKeys) {
			resultMap.putBoolean(key, bundle.getBoolean(key, true))
		}
		resolveCallback(callback, resultMap)
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

			val settings = SphereSettings(keySet, null, ibeaconUuid, 0U, 0U)
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
	fun setDevicePreferences(rssiOffset: Int, tapToToggleEnabled: Boolean, ignoreForBehaviour: Boolean, backgroundToken: Double, useTimeBasedValidation: Boolean) {
		// Current rssi offset and whether tap to toggle is enabled.
		// Cache these, to be used for broadcasting.
		Log.i(TAG, "setDevicePreferences rssiOffset=$rssiOffset tapToToggleEnabled=$tapToToggleEnabled ignoreForBehaviour=$ignoreForBehaviour useTimeBasedValidation=$useTimeBasedValidation")
		bluenet.setTapToToggle(null, tapToToggleEnabled, rssiOffset)
		bluenet.setIgnoreMeForBehaviour(null, ignoreForBehaviour)
		bluenet.setTimeBasedValidation(null, useTimeBasedValidation)
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
		bluenet.setCurrentSphere(sphereId)
	}

	@ReactMethod
	@Synchronized
	fun setSunTimes(sunRiseAfterMidnight: Int, sunSetAfterMidnight: Int, sphereId: SphereId) {
		Log.i(TAG, "setSunTimes sphereId=$sphereId sunRiseAfterMidnight=$sunRiseAfterMidnight sunSetAfterMidnight=$sunSetAfterMidnight")
		bluenet.setSunTime(sphereId, sunRiseAfterMidnight.toUint32(), sunSetAfterMidnight.toUint32())
	}

	@ReactMethod
	@Synchronized
	fun quitApp() {
		Log.i(TAG, "quitApp")
		destroy()
	}

	@ReactMethod
	@Synchronized
	fun crash() {
		Log.i(TAG, "crash")
		val bla: Int? = null
		bla!!.inc()
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
		if (!bluenet.isPermissionsGranted()) {
			val activity = reactContext.currentActivity
			if (activity == null || !bluenet.isPermissionRequestable(activity)) {
				Log.i(TAG, "sendLocationStatus manualPermissionRequired: activity=$activity")
				sendEvent("locationStatus", "manualPermissionRequired")
			}
			else {
				Log.i(TAG, "sendLocationStatus noPermission")
				sendEvent("locationStatus", "noPermission")
			}
		}
		else if (!bluenet.isLocationServiceEnabled()) {
			Log.i(TAG, "sendLocationStatus off")
			sendEvent("locationStatus", "off")
		}
		else {
			Log.i(TAG, "sendLocationStatus on")
//			cancelNotification(LOCATION_STATUS_NOTIFICATION_ID)
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
//			cancelNotification(BLE_STATUS_NOTIFICATION_ID)
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
		// Return true when this is a debug build
		Log.i(TAG, "isDevelopmentEnvironment")
		resolveCallback(callback, BuildConfig.DEBUG)
	}

	@ReactMethod
	@Synchronized
	fun setCrownstoneNames(map: ReadableMap) {
		// Only for iOS.
	}

	@ReactMethod
	@Synchronized
	fun gotoOsAppSettings() {
		val activity = reactContext.currentActivity
		if (activity == null) {
			Log.w(TAG, "No activity.")
			return
		}
		val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + activity.packageName))
		activity.startActivity(intent)
	}

	@ReactMethod
	@Synchronized
	fun requestLocationPermission() {
		Log.i(TAG, "requestLocationPermission")
		// Request for location permission during tutorial.
		// Should also ask for location services to be turned on.
		// Always called when app starts.
		// TODO: check if you can't continue the tutorial before giving or denying permission.
		val activity = reactContext.currentActivity
		if (activity == null) {
			Log.w(TAG, "No activity.")
		}

		initBluenetPromise.success {
			handler.post {
//				bluenet.requestLocationPermission(activity)
				bluenet.tryMakeScannerReady(activity)
				sendLocationStatus()
				sendBleStatus()
			}
		}
	}

	private class CsLocationListener(val callback: Callback, val lastLocation: Location?): LocationListener {
		private val TAG = this.javaClass.simpleName
		private var done = false

		override fun onLocationChanged(location: Location) {
			Log.i(TAG, "onLocationChanged location=$location")
//			if (location == null) {
//				rejectCallback("no location available")
//				return
//			}
			resolveCallback(location)
		}

		override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
			Log.i(TAG, "onStatusChanged provider=$provider status=$status")
		}

		override fun onProviderEnabled(provider: String) {
			Log.i(TAG, "onProviderEnabled provider=$provider")
		}

		override fun onProviderDisabled(provider: String) {
			Log.i(TAG, "onProviderDisabled provider=$provider")
		}

		fun onTimeout() {
			if (lastLocation == null || lastLocation.elapsedRealtimeNanos > 5*60*1000*1000) {
				rejectCallback("timeout")
			}
			else {
				resolveCallback(lastLocation)
			}
		}

		private fun resolveCallback(location: Location) {
			if (done) { return }
			done = true
			val dataVal = Arguments.createMap()
			dataVal.putDouble("latitude", location.latitude)
			dataVal.putDouble("longitude", location.longitude)
			Log.d(TAG, "resolve $callback $dataVal")
			val retVal = Arguments.createMap()
			retVal.putMap("data", dataVal)
			retVal.putBoolean("error", false)
			callback.invoke(retVal)
		}

		private fun rejectCallback(error: String?) {
			if (done) { return }
			done = true
			Log.i(TAG, "reject $callback $error")
			val retVal = Arguments.createMap()
			retVal.putString("data", error)
			retVal.putBoolean("error", true)
			callback.invoke(retVal)
		}
	}

	/**
	 * Return true if in app's battery settings "Not optimized" and false if "Optimizing battery use".
	 */
	private fun isIgnoringBatteryOptimization(): Boolean {
		val powerManager = reactContext.applicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
		val packageName = reactContext.applicationContext.packageName
		return powerManager.isIgnoringBatteryOptimizations(packageName)
	}

	private fun requestIgnoreBatteryOptimization() {
		// Brings the user to the battery optimization settings, still requires the user to:
		// - Select "All apps".
		// - Scroll to this app.
		// - Click this app.
		// Alternatively, we could use REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, but google does not seem to like that.
		val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
		reactContext.startActivity(intent)
	}

	private fun checkBatteryOptimizationSetting() {
		if (!isIgnoringBatteryOptimization()) {
			requestIgnoreBatteryOptimization()
		}
	}


	@ReactMethod
	@Synchronized
	fun requestLocation(callback: Callback) {
		Log.i(TAG, "requestLocation")
		if (ContextCompat.checkSelfPermission(reactContext, "android.permission.ACCESS_COARSE_LOCATION") != PackageManager.PERMISSION_GRANTED) {
			Log.w(TAG, "no permission to get location")
			rejectCallback(callback, "no permission to get location")
			return
		}

		val locationManager = reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager?
		if (locationManager == null) {
			Log.w(TAG, "no location manager")
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
			Log.w(TAG, "no location provider available")
			rejectCallback(callback, "no location provider available")
			return
		}
		Log.d(TAG, "location provider=$provider")

		// Maybe we can use the last known location.
		val location = locationManager.getLastKnownLocation(provider)
		if (location == null) {
			Log.i(TAG, "last known location not available")
		}
		else {
			Log.d(TAG, "last known location=$location")
			if (location.elapsedRealtimeNanos < 60 * 1000 * 1000) {
				lastLocation = location
				val dataVal = Arguments.createMap()
				dataVal.putDouble("latitude", location.latitude)
				dataVal.putDouble("longitude", location.longitude)
				resolveCallback(callback, dataVal)
				return
			}
		}

		Log.i(TAG, "Request location update")
		val locationListener = CsLocationListener(callback, lastLocation)
		locationManager.requestSingleUpdate(provider, locationListener, looper)
		handler.postDelayed(Runnable {
			Log.d(TAG, "timeout")
			locationManager.removeUpdates(locationListener)
			locationListener.onTimeout()
		}, 10*1000L)

		// TODO: change to new API: https://stackoverflow.com/questions/51837719/requestsingleupdate-not-working-on-oreo
	}

	@ReactMethod
	@Synchronized
	fun enableLoggingToFile(enable: Boolean) {
		Log.i(TAG, "enableLoggingToFile $enable")
//		if (!enable) { return }
		if (enable) {
			appLogLevel = AppLogLevel.BASIC
			bluenet.initFileLogging(reactContext.currentActivity)
		}
		else {
			appLogLevel = AppLogLevel.NONE
		}
		bluenet.enableFileLogging(enable)
	}

	@ReactMethod
	@Synchronized
	fun enableExtendedLogging(enable: Boolean) {
		Log.i(TAG, "enableExtendedLogging $enable")
//		if (!enable) { return }
		when (enable) {
			true -> {
				appLogLevel = AppLogLevel.EXTENDED
				bluenet.setFileLogLevel(Log.Level.DEBUG)
			}
			false -> {
				appLogLevel = AppLogLevel.BASIC
				bluenet.setFileLogLevel(Log.Level.INFO)
			}
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
		Log.i(TAG, "subscribeToNearest")
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
		Log.i(TAG, "unsubscribeNearest")
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
		Log.i(TAG, "subscribeToUnverified")
		// Starts the flow of crownstoneAdvertisementReceived and unverifiedAdvertisementData events to the app.
		// Can be called multiple times safely
		sendUnverifiedAdvertisements = true
	}

	@ReactMethod
	@Synchronized
	fun unsubscribeUnverified() {
		Log.i(TAG, "unsubscribeUnverified")
		// Starts the flow of crownstoneAdvertisementReceived and unverifiedAdvertisementData events to the app.
		// Can be called multiple times safely
		sendUnverifiedAdvertisements = false
	}

	@ReactMethod
	@Synchronized
	fun canUseDynamicBackgroundBroadcasts(callback: Callback) {
		Log.i(TAG, "canUseDynamicBackgroundBroadcasts")
		resolveCallback(callback, true)
	}

	@ReactMethod
	@Synchronized
	fun vibrate(type: String) {
		// Android uses the RN vibration module.
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
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstones() {
		Log.i(TAG, "startScanningForCrownstones")
		scannerState = ScannerState.HIGH_POWER
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstonesUniqueOnly() {
		Log.i(TAG, "startScanningForCrownstonesUniqueOnly")
		// Validated and non validated, but unique only.
		scannerState = ScannerState.UNIQUE_ONLY
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
		// TODO: set isTracking = false when no more uuid are tracked.
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
		batterySaving = enable

		// Called when app goes to foreground with enable=false
		// Called when app goes to background with enable=true
		// Also called with enable=false when not all handles of crownstones are known.

		// When enabled, only beacon ranging should continue, no service data.
		initBluenetPromise.success {
			handler.post {
				updateScanner()
			}
		}
	}

	@ReactMethod
	@Synchronized
	fun useHighFrequencyScanningInBackground(enable: Boolean) {
		Log.i(TAG, "useHighFrequencyScanningInBackground $enable")
		defaultScanMode = when (enable) {
			true -> ScanMode.LOW_LATENCY
			false -> ScanMode.BALANCED
		}
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun setBackgroundScanning(enable: Boolean) {
		Log.i(TAG, "setBackgroundScanning $enable")
		// Called after used logged in, and when changed.
		// When disabled, no scanning has to happen in background.
		if (enable) {
			// TODO: This is actually a promise, but it should happen faster than it's possible to click a button.
			bluenet.runInForeground(ONGOING_NOTIFICATION_ID, getServiceNotification("Crownstone is running", "Crownstone is running in the background"))
		}
		else {
			bluenet.runInBackground()
		}
		backgroundScanning = enable
		updateServiceNotification()
	}

	private fun determineScanMode(): ScanMode {
		if (!isInSphere) {
			// When out of sphere, always scan balanced.
			return ScanMode.BALANCED
		}
		if (appForeGround) {
			// When in sphere and app is in foreground, always scan with low latency.
			return ScanMode.LOW_LATENCY
		}
		// When in sphere, but app is not in foreground.
		return when (scannerState) {
			ScannerState.HIGH_POWER -> ScanMode.LOW_LATENCY
			ScannerState.BALANCED -> defaultScanMode
			ScannerState.UNIQUE_ONLY -> defaultScanMode
			ScannerState.STOPPED -> ScanMode.LOW_POWER
		}
	}

	private fun updateScanner() {
		Log.i(TAG, "updateScanner scannerState=$scannerState isTracking=$isTracking batterySaving=$batterySaving isInSphere=$isInSphere appForeGround=$appForeGround")
		if ((scannerState == ScannerState.STOPPED) && !isTracking) {
			bluenet.stopScanning()
			return
		}

		val scanMode: ScanMode = determineScanMode()

		Log.i(TAG, "Scan with scanMode=$scanMode")
		bluenet.setScanInterval(scanMode)

		// Always filter for iBeacons, we need them to decrypt service data.
		bluenet.filterForIbeacons(true)

		// When the screen is off, we can only scan for ibeacons. For some reason, adding the crownstone filters results in the scan being blocked.
		// See: https://stackoverflow.com/questions/48077690/ble-scan-is-not-working-when-screen-is-off-on-android-8-1-0/48079800#48079800
		// This now seems to be fixed by adding service data to the crownstone filter.
		bluenet.filterForCrownstones(!batterySaving)
		bluenet.startScanning()
	}
//endregion


//##################################################################################################
//region           Connections
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun connect(address: String, referenceId: String?, highPriority: Boolean, callback: Callback) {
		Log.i(TAG, "connect $address priority=$highPriority")
		val auto: Boolean
		val timeoutMs: Long
		val retries: Int
		if (highPriority) {
			auto = false
			timeoutMs = BluenetConfig.TIMEOUT_CONNECT
			retries = 3
		}
		else {
			auto = true
			timeoutMs = 300*1000L
			retries = 1
		}
		bluenet.connect(address, auto, timeoutMs, retries)
				.success {
					Log.i(TAG, "connected to $address")
					val mode: String = when (bluenet.getOperationMode(address)) {
						CrownstoneMode.NORMAL -> "operation"
						CrownstoneMode.SETUP -> "setup"
						CrownstoneMode.DFU -> "dfu"
						CrownstoneMode.UNKNOWN -> "unknown"
					}
					resolveCallback(callback, mode)
				}
				.fail {
					Log.w(TAG, "failed to connect to $address: ${it.message}")
					when (it) {
						is Errors.Aborted -> rejectCallback(callback, "CONNECTION_CANCELLED")
						else ->              rejectCallback(callback, it)
					}
				}
	}

	@ReactMethod
	@Synchronized
	fun cancelConnectionRequest(address: String, callback: Callback) {
		Log.i(TAG, "cancelConnectionRequest $address")
		bluenet.abort(address)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun disconnectCommand(address: String, callback: Callback) {
		Log.i(TAG, "disconnectCommand $address")
		bluenet.control(address).disconnect()
				.success {
					Log.i(TAG, "disconnected from $address via command")
					resolveCallback(callback)
				}
				.fail {
					Log.w(TAG, "failed to disconnect from $address via command: ${it.message}")
					rejectCallback(callback, it)
				}
	}

	@ReactMethod
	@Synchronized
	fun phoneDisconnect(address: String, callback: Callback) {
		Log.i(TAG, "phoneDisconnect $address")
		bluenet.disconnect(address, false)
				.success {
					Log.i(TAG, "disconnected from $address")
					resolveCallback(callback)
				}
				.fail {
					Log.w(TAG, "failed to disconnect from $address: ${it.message}")
					rejectCallback(callback, it)
				}
	}



	@ReactMethod
	@Synchronized
	fun commandFactoryReset(address: String, callback: Callback) {
		Log.i(TAG, "factoryReset $address")
		bluenet.control(address).factoryReset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setupFactoryReset(address: String, callback: Callback) {
		Log.i(TAG, "setupFactoryReset $address")
		bluenet.control(address).factoryReset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun recover(address: String, callback: Callback) {
		Log.i(TAG, "recover $address")
		// Connect, recover, and disconnect.
		// If stone is not in recovery mode, then return string "NOT_IN_RECOVERY_MODE" as error data.
		bluenet.control(address).recover()
				.success { resolveCallback(callback) }
				.fail {
					Log.w(TAG, "recovery failed: ${it.message}")
					when (it) {
						is Errors.RecoveryRebootRequired -> rejectCallback(callback, "NOT_IN_RECOVERY_MODE")
						else -> rejectCallback(callback, it)
					}
				}
	}

	@ReactMethod
	@Synchronized
	fun setupCrownstone(address: String, config: ReadableMap, callback: Callback) {
		Log.i(TAG, "setupCrownstone $address $config")
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
		val meshAccessAddress: Uint32 = 0xf005ba11U

		try {
			sphereId = config.getInt("sphereId").toUint8()
			crownstoneId = config.getInt("crownstoneId").toUint8()
			adminKey = config.getString("adminKey")
			memberKey = config.getString("memberKey")
			guestKey = config.getString("basicKey")
			serviceDataKey = config.getString("serviceDataKey")
			localizationKey = config.getString("localizationKey")
			meshDevKey = config.getString("meshDeviceKey")
			meshAppKey = config.getString("meshApplicationKey")
			meshNetKey = config.getString("meshNetworkKey")

			iBeaconUuid = UUID.fromString(config.getString("ibeaconUUID"))
			iBeaconMajor = config.getInt("ibeaconMajor").toUint16()
			iBeaconMinor = config.getInt("ibeaconMinor").toUint16()
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

		val subId = bluenet.subscribe(BluenetEvent.SETUP_PROGRESS, { data: Any? -> onSetupProgress(data as Double) })

		// Maybe refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
		// Not sure if this is helpful, as it would've gone wrong already on connect (when session nonce is read in normal mode)
		bluenet.setup(address).setup(crownstoneId, sphereId, keySet, meshKeySet, meshAccessAddress, ibeaconData)
				.success {
					Log.i(TAG, "setup success")
					resolveCallback(callback)
				}
				.fail {
					sendEvent("setupProgress", 0) // TODO: is this required?
					rejectCallback(callback, it)
				}
				.always { bluenet.unsubscribe(subId) }
	}

	@Synchronized
	fun onSetupProgress(progressDouble: Double) {
		val progressApp: Int = round(progressDouble * 13).toInt()
		sendEvent("setupProgress", progressApp)
	}

	@ReactMethod
	@Synchronized
	fun setupPulse(address: String, callback: Callback) {
		Log.i(TAG, "setupPulse $address")
		// Crownstone is already connected
		// This call will turn the relay on, wait 1 second, turn it off, disconnect
		bluenet.control(address).setSwitch(100U)
				.then { bluenet.waitPromise(1000) }.unwrap()
				.then { bluenet.control(address).setSwitch(0U) }.unwrap()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun bootloaderToNormalMode(address: String?, callback: Callback) {
		Log.i(TAG, "bootloaderToNormalMode $address")
		if (address == null) { return }
		// Connect, reset to normal mode, disconnect.
		// Also disconnect when reset fails!
		bluenet.connect(address)
				.then { bluenet.dfu(address).reset() }.unwrap()
				.success { resolveCallback(callback) }
				.fail {
					bluenet.disconnect(address, true)
							.always {
								rejectCallback(callback, it)
							}
				}
	}

	@ReactMethod
	@Synchronized
	fun restartCrownstone(address: String, callback: Callback) {
		Log.i(TAG, "restartCrownstone $address")
		bluenet.control(address).reset()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun putInDFU(address: String, callback: Callback) {
		Log.i(TAG, "putInDFU $address")
		bluenet.control(address).goToDfu()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setupPutInDFU(address: String, callback: Callback) {
		Log.i(TAG, "setupPutInDFU $address")
		bluenet.control(address).goToDfu()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}



	@ReactMethod
	@Synchronized
	fun performDFU(address: String, fileString: String, callback: Callback) {
		Log.i(TAG, "performDFU address=$address file=$fileString")
		bluenet.dfu(address).startDfu(fileString, DfuService::class.java)
				.then { bluenet.disconnect(address,true) }
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getMACAddress(address: String, callback: Callback) {
		Log.i(TAG, "getMACAddress $address")
		// Return mac address as string (00:11:22:AA:BB:CC)
		// Refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
		bluenet.setup(address).getAddress()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun sendNoOp(address: String, callback: Callback) {
		Log.i(TAG, "sendNoOp $address")
		bluenet.control(address).noop()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun sendMeshNoOp(address: String, callback: Callback) {
		Log.i(TAG, "sendMeshNoOp $address")
		bluenet.mesh(address).noop()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getSwitchState(address: String, callback: Callback) {
		Log.i(TAG, "getSwitchState $address")
		bluenet.state(address).getSwitchState()
				.success {
					resolveCallback(callback, convertSwitchState(it))
				}
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setSwitchState(address: String, switchValDouble: Double, callback: Callback) {
		Log.i(TAG, "setSwitchState $address $switchValDouble")
		bluenet.control(address).setSwitch(convertSwitchVal(switchValDouble))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun toggleSwitchState(address: String, valueOnDouble: Double, callback: Callback) {
		Log.i(TAG, "toggleSwitchState $address $valueOnDouble")
		val valueOn = convertSwitchVal(valueOnDouble)
		bluenet.control(address).toggleSwitchReturnValueSet(valueOn)
				.success { resolveCallback(callback, convertSwitchVal(it)) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun multiSwitch(address: String, switchItems: ReadableArray, callback: Callback) {
		Log.i(TAG, "multiSwitch $address $switchItems")
		val listPacket = parseMultiSwitchLegacy(switchItems)
		if (listPacket == null) {
			rejectCallback(callback, "Invalid multiSwitch data: $switchItems")
			return
		}
		bluenet.control(address).multiSwitch(listPacket)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun turnOnMesh(address: String, stoneIds: ReadableArray, callback: Callback) {
		Log.i(TAG, "turnOnMesh $address $stoneIds")
		val listPacket = MultiSwitchPacket()
		for (i in 0 until stoneIds.size()) {
			listPacket.add(MultiSwitchItemPacket(stoneIds.getInt(i).toUint8(), SwitchCommandValue.SMART_ON.num))
		}
		bluenet.control(address).multiSwitch(listPacket)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	private fun parseMultiSwitchLegacy(switchItems: ReadableArray): MultiSwitchLegacyPacket? {
		// switchItems = [{crownstoneId: number(uint16), state: number(float) [ 0 .. 1 ]}, {}, ...]
		val listPacket = MultiSwitchLegacyPacket()
		var success = true
		for (i in 0 until switchItems.size()) {
			val itemMap = switchItems.getMap(i)
			val crownstoneId = Conversion.toUint8(itemMap.getInt("crownstoneId"))
			val timeout = Conversion.toUint16(0)
			val intent = MultiSwitchIntent.MANUAL
			val switchValDouble = itemMap.getDouble("state")
			val switchVal = convertSwitchVal(switchValDouble)
			val item = MultiSwitchLegacyItemPacket(crownstoneId, switchVal, timeout, intent)
			if (!listPacket.add(item)) {
				success = false
				break
			}
		}
		if (!success) {
			return null
		}
		return listPacket
	}

	@ReactMethod
	@Synchronized
	fun getFirmwareVersion(address: String, callback: Callback) {
		Log.i(TAG, "getFirmwareVersion $address")
		bluenet.deviceInfo(address).getFirmwareVersion()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getHardwareVersion(address: String, callback: Callback) {
		Log.i(TAG, "getHardwareVersion $address")
		bluenet.deviceInfo(address).getHardwareVersion()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getBootloaderVersion(address: String, callback: Callback) {
		Log.i(TAG, "getBootloaderVersion $address")
		// When bootloader version is not available (because not in dfu mode), return empty string.
		bluenet.deviceInfo(address).getBootloaderVersion()
				.success { resolveCallback(callback, it) }
				.fail {
					when (it) {
						is Errors.NotInMode -> {
							Log.i(TAG, "Not in DFU mode: resolve with empty string")
							resolveCallback(callback, "")
						}
						is Errors.Result -> {
							if (it.result == ResultType.NOT_FOUND) {
								Log.i(TAG, "Result is NOT FOUND: assuming normal mode, and bootloader version not in IPC, resolve with empty string")
								resolveCallback(callback, "")
							}
							else {
								rejectCallback(callback, it)
							}
						}
						else -> rejectCallback(callback, it)
					}
				}
	}



	@ReactMethod
	@Synchronized
	fun clearErrors(address: String, clearErrorsMap: ReadableMap, callback: Callback) {
		Log.i(TAG, "clearErrors $address")
		// clearErrorsMap, map with errors to clear. Keys: overCurrent, overCurrentDimmer, temperatureChip, temperatureDimmer, dimmerOnFailure, dimmerOffFailure
		val errorState = ErrorState()
		errorState.overCurrent = clearErrorsMap.getBoolean("overCurrent")
		errorState.overCurrentDimmer = clearErrorsMap.getBoolean("overCurrentDimmer")
		errorState.chipTemperature = clearErrorsMap.getBoolean("temperatureChip")
		errorState.dimmerTemperature = clearErrorsMap.getBoolean("temperatureDimmer")
		errorState.dimmerOnFailure = clearErrorsMap.getBoolean("dimmerOnFailure")
		errorState.dimmerOffFailure = clearErrorsMap.getBoolean("dimmerOffFailure")
		errorState.calcBitMask()
		bluenet.control(address).resetErrors(errorState)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}



	@ReactMethod
	@Synchronized
	fun lockSwitch(address: String, enable: Boolean, callback: Callback) {
		Log.i(TAG, "lockSwitch $address $enable")
		bluenet.control(address).lockSwitch(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun allowDimming(address: String, enable: Boolean, callback: Callback) {
		Log.i(TAG, "allowDimming $address $enable")
		bluenet.control(address).allowDimming(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setSwitchCraft(address: String, enable: Boolean, callback: Callback) {
		Log.i(TAG, "setSwitchCraft $address $enable")
		bluenet.config(address).setSwitchCraftEnabled(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setTime(address: String, timestampDouble: Double, callback: Callback) {
		Log.i(TAG, "setTime $address $timestampDouble")
		val timestamp = timestampDouble.toLong()
		bluenet.control(address).setTime(timestamp.toUint32())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun meshSetTime(address: String, timestampDouble: Double, callback: Callback) {
		Log.i(TAG, "meshSetTime $address $timestampDouble")
		val timestamp = timestampDouble.toLong()
		bluenet.mesh(address).setTime(timestamp.toUint32())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setSunTimesViaConnection(address: String, sunRiseAfterMidnight: Int, sunSetAfterMidnight: Int, callback: Callback) {
		Log.i(TAG, "setSunTimesViaConnection $address sunRiseAfterMidnight=$sunRiseAfterMidnight sunSetAfterMidnight=$sunSetAfterMidnight")
		bluenet.config(address).setSunTime(sunRiseAfterMidnight.toUint32(), sunSetAfterMidnight.toUint32())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

//	@ReactMethod
//	@Synchronized
//	fun getTime(address: String, callback: Callback) {
//		Log.i(TAG, "getTime")
//		bluenet.state(address).getTime()
//				.success {
//					resolveCallback(callback, it.toDouble()) // No long in react-native
//				}
//				.fail { rejectCallback(callback, it) }
//	}
//endregion

//##################################################################################################
//region           Broadcasting
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun broadcastSwitch(referenceId: String, stoneIdInt: Int, switchValDouble: Double, autoExecute: Boolean, callback: Callback) {
		Log.i(TAG, "broadcastSwitch referenceId=$referenceId stoneId=$stoneIdInt switchVal=$switchValDouble, autoExecute=$autoExecute")
		val stoneId = Conversion.toUint8(stoneIdInt)
		val switchVal = convertSwitchVal(switchValDouble)
		bluenet.broadCast.switch(referenceId, stoneId, switchVal, autoExecute)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun turnOnBroadcast(referenceId: String, stoneIdInt: Int, autoExecute: Boolean, callback: Callback) {
		Log.i(TAG, "turnOnBroadcast referenceId=$referenceId stoneId=$stoneIdInt, autoExecute=$autoExecute")
		val stoneId = Conversion.toUint8(stoneIdInt)
		bluenet.broadCast.switchOn(referenceId, stoneId, autoExecute)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setTimeViaBroadcast(timestampDouble: Double, sunRiseAfterMidnight: Int, sunSetAfterMidnight: Int, referenceId: String, timeBasedValidation: Boolean, callback: Callback) {
		Log.i(TAG, "setTimeViaBroadcast referenceId=$referenceId timestampDouble=$timestampDouble sunRiseAfterMidnight=$sunRiseAfterMidnight sunSetAfterMidnight=$sunSetAfterMidnight timeBasedValidation=$timeBasedValidation")
		bluenet.broadCast.setTime(referenceId, timestampDouble.toUint32(), sunRiseAfterMidnight.toUint32(), sunSetAfterMidnight.toUint32(), useTimeBasedValidation = timeBasedValidation)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun broadcastBehaviourSettings(referenceId: String, smartEnabled: Boolean, callback: Callback) {
		Log.i(TAG, "broadcastBehaviourSettings referenceId=$referenceId smartEnabled=$smartEnabled")
		val mode = when (smartEnabled) {
			true -> BehaviourSettings.SMART
			false -> BehaviourSettings.DUMB
		}
		bluenet.broadCast.setBehaviourSettings(referenceId, mode)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun broadcastExecute() {
		Log.i(TAG, "broadcastExecute")
		bluenet.broadCast.execute()
	}
//endregion

//##################################################################################################
//region           Behaviour
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun addBehaviour(address: String, behaviour: ReadableMap, callback: Callback) {
		Log.i(TAG, "addBehaviour $address")
		val indexedBehaviourPacket = parseBehaviourTransfer(behaviour)
		if (indexedBehaviourPacket == null) {
			rejectCallback(callback, Errors.ValueWrong())
			return
		}
		Log.i(TAG, "hash = ${BehaviourHashGen.getHash(indexedBehaviourPacket.behaviour)}")
		bluenet.control(address).addBehaviour(indexedBehaviourPacket.behaviour)
				.success {
					val retVal = genBehaviourReply(it)
					resolveCallback(callback, retVal)
				}
				.fail {
					rejectCallback(callback, it)
				}
	}

	@ReactMethod
	@Synchronized
	fun updateBehaviour(address: String, behaviour: ReadableMap, callback: Callback) {
		Log.i(TAG, "updateBehaviour $address")
		val indexedBehaviourPacket = parseBehaviourTransfer(behaviour)
		if (indexedBehaviourPacket == null) {
			rejectCallback(callback, Errors.ValueWrong())
			return
		}
		bluenet.control(address).replaceBehaviour(indexedBehaviourPacket.index, indexedBehaviourPacket.behaviour)
				.success {
					val retVal = genBehaviourReply(it)
					resolveCallback(callback, retVal)
				}
				.fail {
					rejectCallback(callback, it)
				}
	}

	@ReactMethod
	@Synchronized
	fun removeBehaviour(address: String, index: Int, callback: Callback) {
		Log.i(TAG, "removeBehaviour $address")
		val behaviourIndex = Conversion.toUint8(index)
		bluenet.control(address).removeBehaviour(behaviourIndex)
				.success {
					val retVal = genBehaviourReply(it)
					resolveCallback(callback, retVal)
				}
				.fail {
					rejectCallback(callback, it)
				}
	}

	@ReactMethod
	@Synchronized
	fun getBehaviour(address: String, index: Int, callback: Callback) {
		Log.i(TAG, "getBehaviour $address")
		val behaviourIndex = Conversion.toUint8(index)
		bluenet.control(address).getBehaviour(behaviourIndex)
				.success {
					val retVal = genBehaviour(it)
					if (retVal == null) {
						rejectCallback(callback, Errors.ValueWrong())
					}
					else {
						resolveCallback(callback, retVal)
					}
				}
				.fail {
					rejectCallback(callback, it)
				}
	}

	@ReactMethod
	@Synchronized
	fun syncBehaviours(address: String, behaviours: ReadableArray, callback: Callback) {
		Log.i(TAG, "syncBehaviours $address")
		// Synchronize behaviours: the given behaviours is the local believe of what behaviours are on the Crownstone.
		// The sync will check which behaviours are on the Crownstone, and return those.
		val behaviourList = parseBehaviourTransferArray(behaviours)
		if (behaviourList == null) {
			rejectCallback(callback, "Invalid behaviour")
			return
		}
		behaviourSyncer.setBehaviours(behaviourList)
		behaviourSyncer.sync(address)
				.success {
					val behaviourArray = genBehaviourTransferArray(it)
					if (behaviourArray == null) {
						rejectCallback(callback, "Invalid behaviour")
						return@success
					}
					resolveCallback(callback, behaviourArray)
				}
				.fail {
					rejectCallback(callback, it)
				}
	}

	@ReactMethod
	@Synchronized
	fun getBehaviourMasterHash(behaviours: ReadableArray, callback: Callback) {
		Log.i(TAG, "getBehaviourMasterHash")
		val behaviourList = parseBehaviourTransferArray(behaviours)
		if (behaviourList == null) {
			rejectCallback(callback, "Invalid behaviour")
			return
		}
		val hash = BehaviourHashGen.getHash(behaviourList)
		Log.i(TAG, "masterHash=$hash")
		resolveCallback(callback, hash.toDouble())
	}

	@ReactMethod
	@Synchronized
	fun getBehaviourDebugInformation(address: String, callback: Callback) {
		Log.i(TAG, "getBehaviourDebugInformation $address")
		bluenet.control(address).getBehaviourDebug()
				.success {
					val behaviourDebug = it
					Log.i(TAG, "Behaviour debug: $behaviourDebug")
					val map = Arguments.createMap()
					map.putDouble("time", behaviourDebug.time.toDouble())
					map.putInt("sunrise", behaviourDebug.sunrise.toInt())
					map.putInt("sunset", behaviourDebug.sunset.toInt())
					map.putInt("overrideState", behaviourDebug.overrideState.toInt())
					map.putInt("behaviourState", behaviourDebug.behaviourState.toInt())
					map.putInt("aggregatedState", behaviourDebug.aggregatedState.toInt())
					map.putInt("dimmerPowered", behaviourDebug.dimmerPowered.toInt())
					map.putInt("behaviourEnabled", behaviourDebug.behaviourEnabled.toInt())

					val storedBehavioursArray = Arguments.createArray()
					for (i in 0 until 64) {
						storedBehavioursArray.pushBoolean(isBitSet(behaviourDebug.storedBehaviours, i))
					}
					map.putArray("storedBehaviours", storedBehavioursArray)

					val activeBehavioursArray = Arguments.createArray()
					for (i in 0 until 64) {
						activeBehavioursArray.pushBoolean(isBitSet(behaviourDebug.activeBehaviours, i))
					}
					map.putArray("activeBehaviours", activeBehavioursArray)

					val activeEndConditionsArray = Arguments.createArray()
					for (i in 0 until 64) {
						activeEndConditionsArray.pushBoolean(isBitSet(behaviourDebug.activeEndConditions, i))
					}
					map.putArray("activeEndConditions", activeEndConditionsArray)

					val activeTimeoutPeriodArray = Arguments.createArray()
					for (i in 0 until 64) {
						activeTimeoutPeriodArray.pushBoolean(isBitSet(behaviourDebug.activeTimeoutPeriod, i))
					}
					map.putArray("behavioursInTimeoutPeriod", activeTimeoutPeriodArray)

					for (profile in 0 until BehaviourDebugPacket.NUM_PROFILES) {
						val presenceArray = Arguments.createArray()
						for (i in 0 until 64) {
							presenceArray.pushBoolean(isBitSet(behaviourDebug.presenceBitmasks[profile], i))
						}
						map.putArray("presenceProfile_$profile", presenceArray)
					}
					resolveCallback(callback, map)
				}
				.fail { rejectCallback(callback, it) }
	}

	/**
	 * Value that determines when the day starts, defined as offset from midnight in seconds.
	 */
	private val behaviourDayStartOffset = 4*3600

	/**
	 * Parse a list of behaviour maps
	 */
	private fun parseBehaviourTransferArray(behaviours: ReadableArray): List<IndexedBehaviourPacket>? {
		val behaviourList = ArrayList<IndexedBehaviourPacket>()
		for (i in 0 until behaviours.size()) {
			val behaviourMap = behaviours.getMap(i) ?: return null
			val behaviour = parseBehaviourTransfer(behaviourMap) ?: return null
			behaviourList.add(behaviour)
		}
		return behaviourList
	}

	private fun genBehaviourTransferArray(behaviours: List<IndexedBehaviourPacket>): WritableArray? {
		val behaviourArray = Arguments.createArray()
		for (b in behaviours) {
			val behaviourMap = genBehaviour(b) ?: return null
			behaviourArray.pushMap(behaviourMap)
		}
		return behaviourArray
	}

	/**
	 * Parse a behaviour map
	 *
	 * @param behaviour      The map.
	 * @param dayStartOffset Offset in seconds, at which the day is considered to start.
	 */
	private fun parseBehaviourTransfer(behaviour: ReadableMap, dayStartOffset: Int32 = behaviourDayStartOffset): IndexedBehaviourPacket? {
		Log.d(TAG, "parseBehaviourTransfer $behaviour")
		try {
			val type = behaviour.getString("type") ?: throw Exception("No behaviour type")
			val daysOfWeekMap = behaviour.getMap("activeDays") ?: throw Exception("No activeDays")
			val daysOfWeek = parseDaysOfWeek(daysOfWeekMap)
			val behaviourIndex: BehaviourIndex =
					if (behaviour.hasKey("idOnCrownstone") && !behaviour.isNull("idOnCrownstone")) {
						Conversion.toUint8(behaviour.getInt("idOnCrownstone"))
					}
					else {
						INDEX_UNKNOWN
					}
			if (!behaviour.hasKey("profileIndex")) { throw Exception("No profileIndex") }
			val profileId = Conversion.toUint8(behaviour.getInt("profileIndex"))

			val behaviourData = behaviour.getMap("data") ?: throw Exception("No behaviour data")
			val behaviourActionMap = behaviourData.getMap("action") ?: throw Exception("No behaviour action")

			if (!behaviourActionMap.hasKey("data")) { throw Exception("No action data") }
			val switchValDouble = behaviourActionMap.getDouble("data")
			val switchVal = convertSwitchVal(switchValDouble)

			val timeMap = behaviourData.getMap("time") ?: throw Exception("No time")
			val time = parseBehaviourTime(timeMap, dayStartOffset)
			val from = time[0]
			val until = time[1]

			val behaviourPacket = when (type) {
				"BEHAVIOUR" -> {
					parseBehaviour(behaviourData, switchVal, profileId, daysOfWeek, from, until)
				}
				"TWILIGHT" -> {
					TwilightBehaviourPacket(switchVal, profileId, daysOfWeek, from, until)
				}
				else -> {
					throw Exception("Invalid behaviour type $type")
				}
			}
			Log.d(TAG, "index: $behaviourIndex behaviour: $behaviourPacket")
			return IndexedBehaviourPacket(behaviourIndex, behaviourPacket)

		} catch (e: Exception) {
			Log.w(TAG, "Invalid behaviour: $behaviour")
			Log.w(TAG, "Exception: ${e.message}")
			return null
		}
	}

	private fun parseBehaviour(behaviourData: ReadableMap,
							   switchVal: Uint8,
							   profileId: Uint8,
							   daysOfWeek: DaysOfWeekPacket,
							   from: TimeOfDayPacket,
							   until: TimeOfDayPacket
	): BehaviourPacket {
		val presenceMap = behaviourData.getMap("presence") ?: throw Exception("No presence")
		val presence = parseBehaviourPresence(presenceMap)
		val endConditionMap: ReadableMap? =
				if (behaviourData.hasKey("endCondition")) {
					behaviourData.getMap("endCondition")
				}
				else {
					null
				}
		val switchBehaviourPacket = SwitchBehaviourPacket(switchVal, profileId, daysOfWeek, from, until, presence)
		if (endConditionMap == null) {
			return switchBehaviourPacket
		}
		else {
			val endPresenceMap = endConditionMap.getMap("presence") ?: throw Exception("No end condition presence")
			val endPresence = parseBehaviourPresence(endPresenceMap)
			return SmartTimerBehaviourPacket(switchBehaviourPacket, endPresence)
		}
	}

	private fun genBehaviour(indexedBehaviour: IndexedBehaviourPacket, dayStartOffset: Int32 = behaviourDayStartOffset): WritableMap? {
		Log.d(TAG, "genBehaviour $indexedBehaviour")
		val behaviour = indexedBehaviour.behaviour
		val map = Arguments.createMap()
		val dataMap = Arguments.createMap()
		val actionMap = genBehaviourAction(behaviour.switchVal, indexedBehaviour.behaviour.type == BehaviourType.TWILIGHT) ?: return null
		dataMap.putMap("action", actionMap)
		map.putInt("profileIndex", behaviour.profileId.toInt())
		val daysOfWeekMap = genDaysOfWeek(behaviour.daysOfWeek) ?: return null
		map.putMap("activeDays", daysOfWeekMap)
		val timeMap = genBehaviourTime(behaviour.from, behaviour.until, dayStartOffset) ?: return null
		dataMap.putMap("time", timeMap)

		when (indexedBehaviour.index) {
			INDEX_UNKNOWN -> map.putNull("idOnCrownstone")
			else -> map.putInt("idOnCrownstone", indexedBehaviour.index.toInt())
		}
		when (indexedBehaviour.behaviour.type) {
			BehaviourType.UNKNOWN -> return null
			BehaviourType.SWITCH -> {
				map.putString("type", "BEHAVIOUR")
				val switchBehaviour = behaviour as SwitchBehaviourPacket
				val presenceMap = genBehaviourPresence(switchBehaviour.presence) ?: return null
				dataMap.putMap("presence", presenceMap)
			}
			BehaviourType.TWILIGHT -> {
				map.putString("type", "TWILIGHT")
				val twilightBehaviour = behaviour as TwilightBehaviourPacket
			}
			BehaviourType.SMART_TIMER -> {
				map.putString("type", "BEHAVIOUR")
				val smartTimer = behaviour as SmartTimerBehaviourPacket
				val presenceMap = genBehaviourPresence(smartTimer.presence) ?: return null
				dataMap.putMap("presence", presenceMap)
				val endConditionMap = Arguments.createMap()
				val endConditionPresenceMap = genBehaviourPresence(smartTimer.endConditionPresence) ?: return null
				endConditionMap.putString("type", "PRESENCE_AFTER")
				endConditionMap.putMap("presence", endConditionPresenceMap)
				dataMap.putMap("endCondition", endConditionMap)
			}
		}
		map.putMap("data", dataMap)
		Log.d(TAG, "behaviour map: $map")
		return map
	}

	private fun genBehaviourAction(switchVal: Uint8, twilight: Boolean): WritableMap? {
		val map = Arguments.createMap()
		when (twilight) {
			true -> map.putString("type", "DIM_WHEN_TURNED_ON")
			false -> map.putString("type", "BE_ON")
		}
		map.putDouble("data", convertSwitchVal(switchVal))
		return map
	}

	private fun parseDaysOfWeek(daysOfWeek: ReadableMap): DaysOfWeekPacket {
		if (!daysOfWeek.hasKey("Sun")) { throw Exception("No Sun") }
		if (!daysOfWeek.hasKey("Mon")) { throw Exception("No Mon") }
		if (!daysOfWeek.hasKey("Tue")) { throw Exception("No Tue") }
		if (!daysOfWeek.hasKey("Wed")) { throw Exception("No Wed") }
		if (!daysOfWeek.hasKey("Thu")) { throw Exception("No Thu") }
		if (!daysOfWeek.hasKey("Fri")) { throw Exception("No Fri") }
		if (!daysOfWeek.hasKey("Sat")) { throw Exception("No Sat") }
		return DaysOfWeekPacket(
				daysOfWeek.getBoolean("Sun"),
				daysOfWeek.getBoolean("Mon"),
				daysOfWeek.getBoolean("Tue"),
				daysOfWeek.getBoolean("Wed"),
				daysOfWeek.getBoolean("Thu"),
				daysOfWeek.getBoolean("Fri"),
				daysOfWeek.getBoolean("Sat")
		)
	}

	private fun genDaysOfWeek(daysOfWeek: DaysOfWeekPacket): WritableMap {
		val map = Arguments.createMap()
		map.putBoolean("Sun", daysOfWeek.sun)
		map.putBoolean("Mon", daysOfWeek.mon)
		map.putBoolean("Tue", daysOfWeek.tue)
		map.putBoolean("Wed", daysOfWeek.wed)
		map.putBoolean("Thu", daysOfWeek.thu)
		map.putBoolean("Fri", daysOfWeek.fri)
		map.putBoolean("Sat", daysOfWeek.sat)
		return map
	}

	// Returns 2 TimeOfDay packets: [from, until]
	private fun parseBehaviourTime(time: ReadableMap, dayStartOffset: Int32): List<TimeOfDayPacket> {
		val type = time.getString("type") ?: throw Exception("No time type")
		if (type == "ALL_DAY") {
			return listOf(TimeOfDayPacket(BaseTimeType.MIDNIGHT, dayStartOffset), TimeOfDayPacket(BaseTimeType.MIDNIGHT, dayStartOffset))
		}
		if (type != "RANGE") {
			throw Exception("Invalid time type $type")
		}
		val fromMap = time.getMap("from") ?: throw Exception("No time from")
		val toMap = time.getMap("to") ?: throw Exception("No time to")
		val from = parseBehaviourTimeData(fromMap)
		val to = parseBehaviourTimeData(toMap)
		return listOf(from, to)
	}

	private fun genBehaviourTime(from: TimeOfDayPacket, until: TimeOfDayPacket, dayStartOffset: Int32): WritableMap? {
		val map = Arguments.createMap()
		if (from.baseTimeType == BaseTimeType.MIDNIGHT &&
				until.baseTimeType == BaseTimeType.MIDNIGHT &&
				from.timeOffset == dayStartOffset &&
				until.timeOffset == dayStartOffset) {
			map.putString("type", "ALL_DAY")
			return map
		}
		map.putString("type", "RANGE")
		val fromMap = genBehaviourTimeData(from) ?: return null
		val untilMap = genBehaviourTimeData(until) ?: return null
		map.putMap("from", fromMap)
		map.putMap("to", untilMap)
		return map
	}

	private fun parseBehaviourTimeData(time: ReadableMap): TimeOfDayPacket {
		val type = time.getString("type") ?: throw Exception("No time of day type")
		when (type) {
			"SUNRISE" -> {
				if (!time.hasKey("offsetMinutes")) { throw Exception("No time of day offsetMinutes") }
				val offsetSeconds = time.getInt("offsetMinutes") * 60
				return TimeOfDayPacket(BaseTimeType.SUNRISE, offsetSeconds)
			}
			"SUNSET" -> {
				if (!time.hasKey("offsetMinutes")) { throw Exception("No time of day offsetMinutes") }
				val offsetSeconds = time.getInt("offsetMinutes") * 60
				return TimeOfDayPacket(BaseTimeType.SUNSET, offsetSeconds)
			}
			"CLOCK" -> {
				val timeData = time.getMap("data") ?: throw Exception("No clock data")
				if (!timeData.hasKey("hours")) { throw Exception("No clock hours") }
				val hours = timeData.getInt("hours")
				if (!timeData.hasKey("minutes")) { throw Exception("No clock minutes") }
				val minutes = timeData.getInt("minutes")
				val offsetSeconds = hours * 3600 + minutes * 60
				return TimeOfDayPacket(BaseTimeType.MIDNIGHT, offsetSeconds)
			}
			else -> throw Exception("Invalid time of day type: $type")
		}
	}

	private fun genBehaviourTimeData(time: TimeOfDayPacket): WritableMap? {
		val map = Arguments.createMap()
		when (time.baseTimeType) {
			BaseTimeType.UNKNOWN -> return null
			BaseTimeType.SUNRISE -> {
				map.putString("type", "SUNRISE")
				map.putInt("offsetMinutes", time.timeOffset * 60)
				return map
			}
			BaseTimeType.SUNSET -> {
				map.putString("type", "SUNSET")
				map.putInt("offsetMinutes", time.timeOffset * 60)
				return map
			}
			BaseTimeType.MIDNIGHT -> {
				map.putString("type", "CLOCK")
				val dataMap = Arguments.createMap()
				val hours = time.timeOffset / 3600
				val minutes = (time.timeOffset % 3600) / 60
				dataMap.putInt("hours", hours)
				dataMap.putInt("minutes", minutes)
				map.putMap("data", dataMap)
				return map
			}
		}
	}

	private fun parseBehaviourPresence(presence: ReadableMap): PresencePacket {
		val type = presence.getString("type") ?: throw Exception("No presence type")
		when (type) {
			"IGNORE" -> return PresencePacket(PresenceType.ALWAYS_TRUE, ArrayList(), 0U)
			"SOMEBODY" -> {}
			"NOBODY" -> {}
			else -> throw Exception("Invalid presence type: $type")
		}
		val presenceDataMap = presence.getMap("data") ?: throw Exception("No presence data")
		val locationType = presenceDataMap.getString("type") ?: throw Exception("No presence data type")
		val locadionIds = ArrayList<Uint8>()
		when (locationType) {
			"SPHERE" -> {}
			"LOCATION" -> {
				val locationsArr = presenceDataMap.getArray("locationIds") ?: throw Exception("No locationIds")
				for (i in 0 until locationsArr.size()) {
					locadionIds.add(Conversion.toUint8(locationsArr.getInt(i)))
				}
			}
			else -> throw Exception("Invalid presence data type: $type")
		}
		if (!presence.hasKey("delay")) { throw Exception("No presence delay") }
		val timeoutSeconds = Conversion.toUint32(presence.getInt("delay"))
		val presenceType = when (type) {
			"SOMEBODY" -> {
				when (locationType) {
					"SPHERE" -> PresenceType.ANYONE_IN_SPHERE
					"LOCATION" -> PresenceType.ANYONE_IN_ROOM
					else -> PresenceType.UNKNOWN
				}
			}
			"NOBODY" -> {
				when (locationType) {
					"SPHERE" -> PresenceType.NO_ONE_IN_SPHERE
					"LOCATION" -> PresenceType.NO_ONE_IN_ROOM
					else -> PresenceType.UNKNOWN
				}
			}
			else -> PresenceType.UNKNOWN
		}
		return PresencePacket(presenceType, locadionIds, timeoutSeconds)
	}

	private fun genBehaviourPresence(presence: PresencePacket): WritableMap? {
		val map = Arguments.createMap()
		val dataMap = Arguments.createMap()
		when (presence.type) {
			PresenceType.UNKNOWN -> return null
			PresenceType.ALWAYS_TRUE -> map.putString("type", "IGNORE")
			PresenceType.NO_ONE_IN_SPHERE,
			PresenceType.NO_ONE_IN_ROOM -> map.putString("type", "NOBODY")
			PresenceType.ANYONE_IN_SPHERE,
			PresenceType.ANYONE_IN_ROOM -> map.putString("type", "SOMEBODY")
		}
		when (presence.type) {
			PresenceType.UNKNOWN,
			PresenceType.ALWAYS_TRUE -> {}
			PresenceType.NO_ONE_IN_SPHERE,
			PresenceType.ANYONE_IN_SPHERE -> {
				dataMap.putString("type", "SPHERE")
				map.putMap("data", dataMap)
			}
			PresenceType.NO_ONE_IN_ROOM,
			PresenceType.ANYONE_IN_ROOM -> {
				dataMap.putString("type", "LOCATION")
				val locationArr = Arguments.createArray()
				for (location in presence.rooms) {
					locationArr.pushInt(location.toInt())
				}
				dataMap.putArray("locationIds", locationArr)
				map.putMap("data", dataMap)
			}
		}
		when (presence.type) {
			PresenceType.UNKNOWN,
			PresenceType.ALWAYS_TRUE -> {}
			PresenceType.NO_ONE_IN_SPHERE,
			PresenceType.NO_ONE_IN_ROOM,
			PresenceType.ANYONE_IN_SPHERE,
			PresenceType.ANYONE_IN_ROOM -> {
				map.putInt("delay", presence.timeoutSeconds.toInt())
			}
		}
		return map
	}

	private fun genBehaviourReply(indexAndHash: BehaviourIndexAndHashPacket): WritableMap {
		val map = Arguments.createMap()
		map.putInt("index", indexAndHash.index.toInt())
		map.putDouble("masterHash", indexAndHash.hash.hash.toDouble())
		return map
	}
//endregion

//##################################################################################################
//region           Tracked devices
//##################################################################################################
	@ReactMethod
	@Synchronized
	fun registerTrackedDevice(
			address: String,
			deviceId: Int,
			locationId: Int,
			profileId: Int,
			rssiOffset: Int,
			ignoreForPresence: Boolean,
			tapToToggle: Boolean,
			deviceToken: Double,
			ttlMinutes: Int,
			callback: Callback) {
		Log.i(TAG, "registerTrackedDevice $address")
		// Since android can broadcast any payload that can be changed at any time,
		// this function won't be needed.
		Log.w(TAG, "Not implemented")
		resolveCallback(callback)
	}

	@ReactMethod
	@Synchronized
	fun trackedDeviceHeartbeat(
			address: String,
			deviceId: Int,
			locationId: Int,
			deviceToken: Double,
			ttlMinutes: Int,
			callback: Callback) {
		Log.i(TAG, "trackedDeviceHeartbeat $address")
		// Since android can broadcast any payload that can be changed at any time,
		// this function won't be needed.
		Log.w(TAG, "Not implemented")
		resolveCallback(callback)
	}

	@ReactMethod
	@Synchronized
	fun broadcastUpdateTrackedDevice(
			sphereId: String,
			deviceId: Int,
			locationId: Int,
			profileId: Int,
			rssiOffset: Int,
			ignoreForPresence: Boolean,
			tapToToggle: Boolean,
			deviceToken: Double,
			ttlMinutes: Int,
			callback: Callback) {
		Log.i(TAG, "broadcastUpdateTrackedDevice $sphereId")
		// Since android can broadcast any payload that can be changed at any time,
		// this function won't be needed.
		Log.w(TAG, "Not implemented")
		resolveCallback(callback)
	}
//endregion


//##################################################################################################
//region           Config
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun setDoubleTapSwitchcraft(address: String, enable: Boolean, callback: Callback) {
		Log.i(TAG, "setDoubleTapSwitchcraft $address $enable")
		bluenet.config(address).setSwitchCraftDoubleTapEnabled(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setTapToToggle(address: String, value: Boolean, callback: Callback) {
		Log.i(TAG, "setTapToToggle $address $value")
		bluenet.config(address).setTapToToggleEnabled(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setTapToToggleThresholdOffset(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setTapToToggleThresholdOffset $address $value")
		bluenet.config(address).setTapToToggleRssiThresholdOffset(value.toByte())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getTapToToggleThresholdOffset(address: String, callback: Callback) {
		Log.i(TAG, "getTapToToggleThresholdOffset $address")
		bluenet.config(address).getTapToToggleRssiThresholdOffset()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setSoftOnSpeed(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setSoftOnSpeed $address $value")
		bluenet.config(address).setSoftOnSpeed(value.toUint8())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getSoftOnSpeed(address: String, callback: Callback) {
		Log.i(TAG, "getSoftOnSpeed $address")
		bluenet.config(address).getSoftOnSpeed()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setDefaultDimValue(address: String, dimValue: Int, callback: Callback) {
		Log.i(TAG, "setDefaultDimValue $address $dimValue")
		bluenet.config(address).setDefaultDimValue(dimValue.toUint8())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setUartKey(address: String, uartKeyString: String, callback: Callback) {
		Log.i(TAG, "setUartKey $address $uartKeyString")
		val uartKey = Conversion.getKeyFromString(uartKeyString)
		if (uartKey == null) {
			rejectCallback(callback, Errors.SizeWrong())
			return
		}
		bluenet.config(address).setUartKey(uartKey)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

//endregion

//##################################################################################################
//region           Hub
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun transferHubTokenAndCloudId(address: String, hubToken: String, cloudId: String, callback: Callback) {
		Log.i(TAG, "transferHubTokenAndCloudId $address hubToken=$hubToken cloudId=$cloudId")
		val hubDataHandler = HubData(bluenet, address)
		hubDataHandler.setup(hubToken, cloudId)
				.success { resolveCallback(callback, getHubDataReply(it)) }
				.fail { rejectCallback(callback, getHubDataReplyError(it)) }
	}

	@ReactMethod
	@Synchronized
	fun requestCloudId(address: String, callback: Callback) {
		Log.i(TAG, "requestCloudId $address")
		val hubDataHandler = HubData(bluenet, address)
		hubDataHandler.requestData(DataType.CLOUD_ID)
				.success { resolveCallback(callback, getHubDataReply(it)) }
				.fail { rejectCallback(callback, getHubDataReplyError(it)) }
	}

	@ReactMethod
	@Synchronized
	fun factoryResetHub(address: String, callback: Callback) {
		Log.i(TAG, "factoryResetHub $address")
		val hubDataHandler = HubData(bluenet, address)
		hubDataHandler.factoryReset()
				.success { resolveCallback(callback, getHubDataReply(it)) }
				.fail { rejectCallback(callback, getHubDataReplyError(it)) }
	}

	@ReactMethod
	@Synchronized
	fun factoryResetHubOnly(address: String, callback: Callback) {
		Log.i(TAG, "factoryResetHubOnly $address")
		val hubDataHandler = HubData(bluenet, address)
		hubDataHandler.factoryResetHubOnly()
				.success { resolveCallback(callback, getHubDataReply(it)) }
				.fail { rejectCallback(callback, getHubDataReplyError(it)) }
	}

	private fun getHubDataReply(replyPacket: HubDataReplyPacket): WritableMap {
		// Return data should be in the form:
		// {
		//   protocolVersion: number,
		//   type:            string, // success | error | dataReply
		//   errorType:       number, // can be null
		//   dataType:        number // can be null
		//   message:         string // default empty string ""
		// }
		val map = Arguments.createMap()

		// Set protocolVersion
		map.putInt("protocolVersion", replyPacket.protocol.toInt())

		// Set type
		val type: String = when (replyPacket.type) {
			HubDataReplyPacket.HubDataReplyType.SUCCESS -> "success"
			HubDataReplyPacket.HubDataReplyType.DATA_REPLY -> "dataReply"
			HubDataReplyPacket.HubDataReplyType.ERROR -> "error"
			else -> "error"
		}
		map.putString("type", type)

		val replyPayload = replyPacket.payload

		// Set errorType
		if (replyPayload is ErrorReplyPacket) {
			map.putInt("errorType", replyPayload.errorCode.num.toInt())
		}
		else {
			map.putNull("errorType")
		}

		// Set dataType
		if (replyPayload is DataReplyPacket) {
			map.putInt("dataType", replyPayload.type.num.toInt())
		}
		else {
			map.putNull("dataType")
		}

		// Set message
		val message: String = when (replyPacket.type) {
			HubDataReplyPacket.HubDataReplyType.SUCCESS -> (replyPayload as SuccessReplyPacket).payload.string
			HubDataReplyPacket.HubDataReplyType.DATA_REPLY -> (replyPayload as DataReplyPacket).payload.string
			HubDataReplyPacket.HubDataReplyType.ERROR -> (replyPayload as ErrorReplyPacket).payload.string
			else -> ""
		}
		map.putString("message", message)

		return map
	}

	private fun getHubDataReplyError(err: Exception): String {
		if (err is Errors.HubDataReplyTimeout) {
			return "HUB_REPLY_TIMEOUT"
		}
		return err.message ?: ""
	}

//endregion

//##################################################################################################
//region           Dev
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun switchRelay(address: String, value: Boolean, callback: Callback) {
		Log.i(TAG, "switchRelay $address $value")
		bluenet.control(address).setRelay(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun switchDimmer(address: String, value: Double, callback: Callback) {
		Log.i(TAG, "switchDimmer $address $value")
		bluenet.control(address).setDimmer(convertSwitchVal(value))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setUartState(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setUartState $address $value")
		bluenet.config(address).setUartEnabled(UartMode.fromNum(Conversion.toUint8(value)))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getResetCounter(address: String, callback: Callback) {
		Log.i(TAG, "getResetCounter $address")
		bluenet.state(address).getResetCount()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getSwitchcraftThreshold(address: String, callback: Callback) {
		Log.i(TAG, "getSwitchcraftThreshold $address")
		bluenet.config(address).getSwitchCraftThreshold()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setSwitchcraftThreshold(address: String, value: Float, callback: Callback) {
		Log.i(TAG, "setSwitchcraftThreshold $address $value")
		bluenet.config(address).setSwitchCraftThreshold(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getMaxChipTemp(address: String, callback: Callback) {
		Log.i(TAG, "getMaxChipTemp $address")
		bluenet.config(address).getMaxChipTemp()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setMaxChipTemp(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setMaxChipTemp $address $value")
		bluenet.config(address).setMaxChipTemp(value.toByte())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getDimmerCurrentThreshold(address: String, callback: Callback) {
		Log.i(TAG, "getDimmerCurrentThreshold $address")
		bluenet.config(address).getCurrentThresholdDimmer()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setDimmerCurrentThreshold(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setDimmerCurrentThreshold $address")
		bluenet.config(address).setCurrentThresholdDimmer(Conversion.toUint16(value))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getDimmerTempUpThreshold(address: String, callback: Callback) {
		Log.i(TAG, "getDimmerTempUpThreshold $address")
		bluenet.config(address).getDimmerTempUpThreshold()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setDimmerTempUpThreshold(address: String, value: Double, callback: Callback) {
		Log.i(TAG, "setDimmerTempUpThreshold $address")
		bluenet.config(address).setDimmerTempUpThreshold(value.toFloat())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getDimmerTempDownThreshold(address: String, callback: Callback) {
		Log.i(TAG, "getDimmerTempDownThreshold $address")
		bluenet.config(address).getDimmerTempDownThreshold()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setDimmerTempDownThreshold(address: String, value: Double, callback: Callback) {
		Log.i(TAG, "setDimmerTempDownThreshold $address $value")
		bluenet.config(address).setDimmerTempDownThreshold(value.toFloat())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getVoltageZero(address: String, callback: Callback) {
		Log.i(TAG, "getVoltageZero $address")
		bluenet.config(address).getVoltageZero()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setVoltageZero(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setVoltageZero $address $value")
		bluenet.config(address).setVoltageZero(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getCurrentZero(address: String, callback: Callback) {
		Log.i(TAG, "getCurrentZero $address")
		bluenet.config(address).getCurrentZero()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setCurrentZero(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setCurrentZero $address $value")
		bluenet.config(address).setCurrentZero(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getPowerZero(address: String, callback: Callback) {
		Log.i(TAG, "getPowerZero $address")
		bluenet.config(address).getPowerZero()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setPowerZero(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setPowerZero $address $value")
		bluenet.config(address).setPowerZero(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getVoltageMultiplier(address: String, callback: Callback) {
		Log.i(TAG, "getVoltageMultiplier $address")
		bluenet.config(address).getVoltageMultiplier()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setVoltageMultiplier(address: String, value: Double, callback: Callback) {
		Log.i(TAG, "setVoltageMultiplier $address $value")
		bluenet.config(address).setVoltageMultiplier(value.toFloat())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getCurrentMultiplier(address: String, callback: Callback) {
		Log.i(TAG, "getCurrentMultiplier $address")
		bluenet.config(address).getCurrentMultiplier()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun setCurrentMultiplier(address: String, value: Int, callback: Callback) {
		Log.i(TAG, "setCurrentMultiplier $address $value")
		bluenet.config(address).setCurrentMultiplier(value.toFloat())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getCrownstoneUptime(address: String, callback: Callback) {
		Log.i(TAG, "getCrownstoneUptime $address")
		bluenet.debugData(address).getUptime()
				.success { resolveCallback(callback, it.toDouble()) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getAdcRestarts(address: String, callback: Callback) {
		Log.i(TAG, "getAdcRestarts $address")
		bluenet.debugData(address).getAdcRestarts()
				.success {
					val retVal = Arguments.createMap()
					retVal.putDouble("restartCount", it.count.toDouble())
					retVal.putDouble("timestamp", it.lastTimestamp.toDouble())
					resolveCallback(callback, retVal) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getSwitchHistory(address: String, callback: Callback) {
		Log.i(TAG, "getSwitchHistory $address")
		bluenet.debugData(address).getSwitchHistory()
				.success {
					val retVal = Arguments.createArray()
					for (item in it.list) {
						val itemMap = Arguments.createMap()
						itemMap.putDouble("timestamp", item.timestamp.toDouble())
						itemMap.putInt("switchCommand", item.command.toInt())
						itemMap.putInt("switchState", item.state.state.toInt())
						itemMap.putBoolean("viaMesh", item.source.viaMesh)
						itemMap.putInt("sourceReserved", item.source.reserved.toInt())
						itemMap.putInt("sourceData", item.source.reserved.toInt())
						itemMap.putInt("sourceType", item.source.type.num.toInt())
						itemMap.putInt("sourceId", item.source.id.toInt())
						retVal.pushMap(itemMap)
					}
					resolveCallback(callback, retVal) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getPowerSamples(address: String, typeStr: String, callback: Callback) {
		Log.i(TAG, "getPowerSamples $address $typeStr")
		val type: PowerSamplesType = when (typeStr) {
			"triggeredSwitchcraft" -> PowerSamplesType.SWITCHCRAFT
			"missedSwitchcraft" -> PowerSamplesType.SWITCHCRAFT_NON_TRIGGERED
			"filteredBuffer" -> PowerSamplesType.NOW_FILTERED
			"unfilteredBuffer" -> PowerSamplesType.NOW_UNFILTERED
			"softFuse" -> PowerSamplesType.SOFT_FUSE
			else -> PowerSamplesType.UNKNOWN
		}

		bluenet.debugData(address).getPowerSamples(type)
				.success {
					val retVal = Arguments.createArray()
					for (item in it) {
						val itemMap = Arguments.createMap()
						itemMap.putInt("type", item.type.num.toInt())
						itemMap.putInt("index", item.index.toInt())
						itemMap.putInt("count", item.count.toInt())
						itemMap.putDouble("timestamp", item.timestamp.toDouble())
						itemMap.putInt("delay", item.delayUs.toInt())
						itemMap.putInt("sampleInterval", item.sampleIntervalUs.toInt())
						itemMap.putInt("offset", item.offset.toInt())
						itemMap.putDouble("multiplier", item.multiplier.toDouble())
						val samplesArray = Arguments.createArray()
						for (sample in item.samples) {
							samplesArray.pushInt(sample.toInt())
						}
						itemMap.putArray("samples", samplesArray)
						retVal.pushMap(itemMap)
					}
					resolveCallback(callback, retVal) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getMinSchedulerFreeSpace(address: String, callback: Callback) {
		Log.i(TAG, "getMinSchedulerFreeSpace $address")
		bluenet.debugData(address).getSchedulerMinFree()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getLastResetReason(address: String, callback: Callback) {
		Log.i(TAG, "getLastResetReason $address")
		bluenet.debugData(address).getResetReason()
				.success {
					val retVal = Arguments.createMap()
					retVal.putDouble("raw", it.toDouble())
					retVal.putBoolean("resetPin",       isBitSet(it, 0))
					retVal.putBoolean("watchdog",       isBitSet(it, 1))
					retVal.putBoolean("softReset",      isBitSet(it, 2))
					retVal.putBoolean("lockup",         isBitSet(it, 3))
					retVal.putBoolean("gpio",           isBitSet(it, 16))
					retVal.putBoolean("lpComp",         isBitSet(it, 17))
					retVal.putBoolean("debugInterface", isBitSet(it, 18))
					retVal.putBoolean("nfc",            isBitSet(it, 19))
					resolveCallback(callback, retVal)
				}
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getGPREGRET(address: String, callback: Callback) {
		Log.i(TAG, "getGPREGRET $address")
		bluenet.debugData(address).getGpregret()
				.success {
					val retVal = Arguments.createArray()
					for (packet in it) {
						val packetMap = Arguments.createMap()
						packetMap.putDouble("raw", packet.value.toDouble())
						if (packet.index == 0U.toUint8()) {
							packetMap.putInt("counter", (packet.value and 0x1FU).toInt())
							packetMap.putBoolean("brownout", isBitSet(packet.value, 5))
							packetMap.putBoolean("dfuMode", isBitSet(packet.value, 5))
							packetMap.putBoolean("storageRecovered", isBitSet(packet.value, 5))
						}
						retVal.pushMap(packetMap)
					}
					resolveCallback(callback, retVal)
				}
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getUICR(address: String, callback: Callback) {
		Log.i(TAG, "getUICR $address")
		bluenet.deviceInfo(address).getUicrData()
				.success {
					val retVal = Arguments.createMap()
					retVal.putDouble("board",       it.board.toDouble())
					retVal.putInt("productType",    it.productType.toInt())
					retVal.putInt("region",         it.region.toInt())
					retVal.putInt("productFamily",  it.productFamily.toInt())
					retVal.putInt("reserved1",      it.reserved1.toInt())
					retVal.putInt("hardwarePatch",  it.hardwarePatch.toInt())
					retVal.putInt("hardwareMinor",  it.hardwareMinor.toInt())
					retVal.putInt("hardwareMajor",  it.hardwareMajor.toInt())
					retVal.putInt("reserved2",      it.reserved2.toInt())
					retVal.putInt("productHousing", it.housing.toInt())
					retVal.putInt("productionWeek", it.productionWeek.toInt())
					retVal.putInt("productionYear", it.productionYear.toInt())
					retVal.putInt("reserved3",      it.reserved3.toInt())
					resolveCallback(callback, retVal) }
				.fail { rejectCallback(callback, it) }
	}

	@ReactMethod
	@Synchronized
	fun getAdcChannelSwaps(address: String, callback: Callback) {
		Log.i(TAG, "getAdcChannelSwaps $address")
		bluenet.debugData(address).getAdcChannelSwaps()
				.success {
					val retVal = Arguments.createMap()
					retVal.putDouble("swapCount", it.count.toDouble())
					retVal.putDouble("timestamp", it.lastTimestamp.toDouble())
					resolveCallback(callback, retVal) }
				.fail { rejectCallback(callback, it) }
	}



//endregion


//##################################################################################################
//region           Advertising
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun startAdvertising() {
		Log.i(TAG, "startAdvertising")
		// Start background advertising
		// Start advertising time (aka base advertising) TODO
		bluenet.backgroundBroadcaster.start()
	}

	@ReactMethod
	@Synchronized
	fun stopAdvertising() {
		Log.i(TAG, "stopAdvertising")
		// Stop background advertising
		// Stop advertising time (aka base advertising) TODO
		bluenet.backgroundBroadcaster.stop()
	}
//endregion


//##################################################################################################
//region           Events
//##################################################################################################

	@ReactMethod
	private fun addListener(eventName: String) {
		Log.i(TAG, "addListener $eventName")
	}

	@ReactMethod
	private fun removeListeners(count: Double) {
		Log.i(TAG, "removeListeners $count")
	}

	@Synchronized
	private fun onConnect(address: DeviceAddress) {
		Log.i(TAG, "onConnect $address")
		sendEvent("connectedToPeripheral", address)
	}

	@Synchronized
	private fun onDisconnect(address: DeviceAddress) {
		Log.i(TAG, "onDisconnect $address")
		// This event is often triggered before the disconnect promise is (about 10 to 30 ms).
		// The js side won't attempt a new connection to this address until it gets this event.
		// So we should be able to simply delay sending the event, so it arrives after the promise is resolved.
		handler.postDelayed({
			sendEvent("disconnectedFromPeripheral", address)
		}, 100)
	}

	@Synchronized
	private fun onLocationStatus(event: BluenetEvent) {
		Log.i(TAG, "onLocationStatus $event")
		when (event) {
			BluenetEvent.PERMISSIONS_MISSING -> {
//				if (backgroundScanning && !appForeGround) {
//					sendNotification(LOCATION_STATUS_NOTIFICATION_ID, "Location permission missing.", "App needs location permission for localization to work.")
//				}
			}
			BluenetEvent.PERMISSIONS_GRANTED -> {
			}
			BluenetEvent.LOCATION_SERVICE_TURNED_ON -> {
			}
			BluenetEvent.LOCATION_SERVICE_TURNED_OFF -> {
//				if (backgroundScanning && !appForeGround) {
//					sendNotification(LOCATION_STATUS_NOTIFICATION_ID, "Location disabled.", "Location needs to be enabled for localization to work.")
//				}
			}
		}
		updateServiceNotification()
		sendLocationStatus()
	}

	@Synchronized
	private fun onBleStatus(event: BluenetEvent) {
		Log.i(TAG, "onBleStatus $event")
		when (event) {
			BluenetEvent.BLE_TURNED_ON -> {
			}
			BluenetEvent.BLE_TURNED_OFF -> {
//				if (backgroundScanning && !appForeGround) {
//					sendNotification(BLE_STATUS_NOTIFICATION_ID, "Localization not working", "Bluetooth must be enabled for localization to work.")
//				}
			}
		}
		updateServiceNotification()
		sendBleStatus()
	}

	@Synchronized
	private fun onScanFailure(error: ScanStartFailure) {
		Log.w(TAG, "onScanFailure $error")
		val currentTimestampMs = SystemClock.elapsedRealtime()
		if (currentTimestampMs - lastScanFailureAlertTimestampMs < SCAN_FAILURE_ALERT_MIN_INTERVAL_MS) {
			return
		}
		lastScanFailureAlertTimestampMs = currentTimestampMs
		var reason = ""
		when (error) {
			ScanStartFailure.NO_ERROR,
			ScanStartFailure.ALREADY_STARTED,
			ScanStartFailure.UNKNOWN -> {
				return
			}
			ScanStartFailure.APPLICATION_REGISTRATION_FAILED -> {
				reason = "App cannot access Bluetooth."
			}
			ScanStartFailure.FEATURE_UNSUPPORTED -> {
				reason = "BLE scanning is not supported on this device."
			}
			ScanStartFailure.INTERNAL_ERROR -> {
				reason = "Android internal error."
			}
			ScanStartFailure.OUT_OF_HARDWARE_RESOURCES -> {
				reason = "Out of hardware resources."
			}
			ScanStartFailure.SCANNING_TOO_FREQUENTLY -> {
				reason = "Scanning too frequently."
			}
		}
		val mapAlert = Arguments.createMap()
		mapAlert.putString("header", "Bluetooth problem")
		mapAlert.putString("body", "There is a problem detected with Bluetooth, please turn Bluetooth off and on again. Reason: $reason")
		mapAlert.putString("buttonText", "Ok")
		sendEvent("libAlert", mapAlert)
	}

	@Synchronized
	private fun onRegionEnter(eventData: IbeaconRegionEventData) {
		val uuid = eventData.changedRegion
		val referenceId = eventData.changedRegionReferenceId
		Log.i(TAG, "enterSphere uuid=$uuid refId=$referenceId")

		isInSphere = eventData.list.isNotEmpty()
		updateScanner()
		updateServiceNotification()

		sendEvent("enterSphere", referenceId)
	}

	@Synchronized
	private fun onRegionExit(eventData: IbeaconRegionEventData) {
		val uuid = eventData.changedRegion
		val referenceId = eventData.changedRegionReferenceId
		Log.i(TAG, "exitSphere uuid=$uuid refId=$referenceId")

		isInSphere = eventData.list.isNotEmpty()
		updateScanner()
		updateServiceNotification()

		sendEvent("exitSphere", referenceId)
	}

	@Synchronized
	private fun onIbeaconScan(scanList: ScannedIbeaconList) {
		if (appLogLevel == AppLogLevel.BASIC || appLogLevel == AppLogLevel.EXTENDED) {
			Log.i("IbeaconScan", "onTimeout numBeacons=${scanList.size}")
			for (scan in scanList) {
				Log.d("IbeaconScan", "    ${scan.address} uuid=${scan.ibeaconData.uuid} major=${scan.ibeaconData.major} minor=${scan.ibeaconData.minor} rssi=${scan.rssi}")
			}

			logMemoryUsage()
		}

		if (scanList.isEmpty()) {
			return
		}
		val array = Arguments.createArray()
		for (scan in scanList) {
			val beaconId = "${scan.ibeaconData.uuid.toString().uppercase()}_Maj:${scan.ibeaconData.major}_Min:${scan.ibeaconData.minor}"
			val map = Arguments.createMap()
			map.putString("id", beaconId)
			map.putString("uuid", scan.ibeaconData.uuid.toString())
			map.putInt("major", scan.ibeaconData.major.toInt())
			map.putInt("minor", scan.ibeaconData.minor.toInt())
			map.putInt("rssi", scan.rssi)
			map.putString("referenceId", scan.referenceId)
			array.pushMap(map)
		}
		sendEvent("iBeaconAdvertisement", array)
	}

	@Synchronized
	private fun onNearestStone(data: Any?) {
		// Any stone, validated or not, any operation mode.
		val nearest = data as NearestDeviceListEntry
		val nearestMap = exportNearest(nearest)
//		Log.i(TAG, "nearestCrownstone: $nearest")
		sendEvent("nearestCrownstone", nearestMap)
	}

	@Synchronized
	private fun onNearestSetup(data: Any?) {
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
	private fun onDfuProgress(progress: DfuProgress) {
		val map = Arguments.createMap()
		map.putInt("progress", progress.percentage)
		map.putDouble("currentSpeedBytesPerSecond", progress.currentSpeed.toDouble())
		map.putDouble("avgSpeedBytesPerSecond", progress.avgSpeed.toDouble())
		map.putInt("part", progress.currentPart)
		map.putInt("totalParts", progress.totalParts)
		sendEvent("dfuProgress", map)
	}

	private fun onTick() {
		Log.i(TAG, "onTick")
		handler.postDelayed(tickRunnable, 1000)
		sendEvent("tick")
	}

	@Synchronized
	private fun onScan(device: ScannedDevice) {
//		Log.d(TAG, "onScan: $device")
		if (device.isStone()) {
			if (sendUnverifiedAdvertisements) {
				val advertisementMap = exportAdvertisementData(device, null)
				sendEvent("crownstoneAdvertisementReceived", advertisementMap) // Any advertisement, verified and unverified from crownstones.
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
		serviceDataMap.putBoolean("alternativeState", serviceData.type == ServiceDataType.ALT_STATE)
		serviceDataMap.putBoolean("hasError", serviceData.flagError)
		serviceDataMap.putBoolean("setupMode", device.operationMode == OperationMode.SETUP)
		serviceDataMap.putBoolean("hubMode", serviceData.type == ServiceDataType.HUB_STATE)
		serviceDataMap.putInt("crownstoneId", serviceData.crownstoneId.toInt())
		serviceDataMap.putDouble("switchState", convertSwitchState(serviceData.switchState))
//		serviceDataMap.putInt("flagsBitmask", 0) // Not required
		serviceDataMap.putInt("temperature", serviceData.temperature.toInt())
		serviceDataMap.putDouble("powerFactor", serviceData.powerFactor)
		serviceDataMap.putDouble("powerUsageReal", serviceData.powerUsageReal)
		serviceDataMap.putDouble("powerUsageApparent", serviceData.powerUsageApparent)
		serviceDataMap.putDouble("accumulatedEnergy", serviceData.energyUsed.toDouble())




		if (serviceData.version == ServiceDataVersion.V1 || serviceData.version == ServiceDataVersion.UNKNOWN) {
			serviceDataMap.putDouble("timestamp", -1.0)
		}
		else if (serviceData.flagTimeSet) {
			serviceDataMap.putDouble("timestamp", serviceData.timestamp.toDouble())
		}
		else {
			serviceDataMap.putInt("timestamp", serviceData.count.toInt())
		}

		// Bitmask flags.
		serviceDataMap.putBoolean("dimmerReady", serviceData.flagDimmerReady)
		serviceDataMap.putBoolean("dimmingAllowed", serviceData.flagDimmable)
		serviceDataMap.putBoolean("switchLocked", serviceData.flagSwitchLocked)
		serviceDataMap.putBoolean("timeSet", serviceData.flagTimeSet)
		serviceDataMap.putBoolean("switchCraftEnabled", serviceData.flagSwitchCraft)
		serviceDataMap.putBoolean("tapToToggleEnabled", serviceData.flagTapToToggleEnabled)
		serviceDataMap.putBoolean("behaviourOverridden", serviceData.flagBehaviourOverridden)

		// Alternative state
		serviceDataMap.putDouble("assetFiltersCRC", serviceData.assetFiltersCrc.toDouble())
		serviceDataMap.putInt("assetFiltersMasterVersion", serviceData.assetFiltersVersion.toInt())
		serviceDataMap.putBoolean("behaviourEnabled", serviceData.flagBehaviourEnabled)
		serviceDataMap.putInt("behaviourMasterHash", serviceData.behaviourHash.toInt())

		// Hub data
		val hubDataArray = Arguments.createArray()
		for (b in serviceData.hubData) {
			hubDataArray.pushInt(b.toInt())
		}
		serviceDataMap.putArray("hubData", hubDataArray)
		serviceDataMap.putBoolean("uartAlive",                            serviceData.hubFlagUartAlive)
		serviceDataMap.putBoolean("uartAliveEncrypted",                   serviceData.hubFlagUartAliveEncrypted)
		serviceDataMap.putBoolean("uartEncryptionRequiredByCrownstone",   serviceData.hubFlagUartEncryptionRequiredByStone)
		serviceDataMap.putBoolean("uartEncryptionRequiredByHub",          serviceData.hubFlagUartEncryptionRequiredByHub)
		serviceDataMap.putBoolean("hubHasBeenSetup",                      serviceData.hubFlagHasBeenSetup)
		serviceDataMap.putBoolean("hubHasInternet",                       serviceData.hubFlagHasInternet)
		serviceDataMap.putBoolean("hubHasError",                          serviceData.hubFlagHasError)

		val deviceTypeString = when (serviceData.deviceType) {
			DeviceType.CROWNSTONE_PLUG -> "plug"
			DeviceType.CROWNSTONE_BUILTIN -> "builtin"
			DeviceType.CROWNSTONE_DONGLE -> "crownstoneUSB"
			DeviceType.GUIDESTONE -> "guidestone"
			DeviceType.CROWNSTONE_BUILTIN_ONE -> "builtinOne"
			DeviceType.CROWNSTONE_HUB -> "hub"
			DeviceType.SOCKET_F -> "socketF"
			DeviceType.PROTO_WITH_DIMMER -> "prototype_relay_dimmer"
			DeviceType.PROTO_WITH_RELAY -> "prototype_relay"
			DeviceType.PROTO_WITHOUT_SWITCH -> "prototype_no_switching"
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
		errorMap.putDouble("bitMask", serviceData.errorBitmask.toDouble())
		serviceDataMap.putMap("errors", errorMap)
		serviceDataMap.putInt("uniqueElement", serviceData.changingData)

		return serviceDataMap
	}


	@Synchronized
	fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
		bluenet.handlePermissionResult(requestCode, permissions, grantResults, currentActivity)
	}
//endregion


//##################################################################################################
//region           Helper functions
//##################################################################################################

	/**
	 * Convert 0.0 .. 100.0 value to switch value (0-100).
	 */
	private fun convertSwitchVal(switchVal: Double): Uint8 {
		var switchValInt = 0
		if (switchVal >= 100.0) {
			switchValInt = 100
		}
		else if (switchVal > 0) {
			switchValInt = Math.round(switchVal).toInt()
		}
		return Conversion.toUint8(switchValInt)
	}

	/**
	 * Convert switch value (0-100) to 0.0 .. 100.0 value.
	 */
	private fun convertSwitchVal(switchVal: Uint8): Double {
		return switchVal.toDouble()
	}

	/**
	 * Converts switch state (0-228) to value used in react: 0.0 - 228.0.
	 */
	private fun convertSwitchState(switchState: SwitchState): Double {
		return switchState.state.toDouble()
	}


	private fun rejectCallback(callback: Callback, error: Exception) {
		when (error) {
			is Errors.NotConnected -> rejectCallback(callback, "NOT_CONNECTED")
			else ->                   rejectCallback(callback, error.message)
		}
	}

	private fun rejectCallback(callback: Callback, error: String?) {
		Log.w(TAG, "reject $callback $error")
		val retVal = Arguments.createMap()
		retVal.putString("data", error)
		retVal.putBoolean("error", true)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback) {
		Log.d(TAG, "resolve $callback")
		val retVal = Arguments.createMap()
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: String) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putString("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: Boolean) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putBoolean("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: Byte) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putInt("data", data.toInt())
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: UByte) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putInt("data", data.toInt())
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: Short) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putInt("data", data.toInt())
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: UShort) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putInt("data", data.toInt())
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: Int) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putInt("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: Float) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putDouble("data", data.toDouble())
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: Double) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putDouble("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: WritableMap) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putMap("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}

	private fun resolveCallback(callback: Callback, data: WritableArray) {
		Log.d(TAG, "resolve $callback $data")
		val retVal = Arguments.createMap()
		retVal.putArray("data", data)
		retVal.putBoolean("error", false)
		callback.invoke(retVal)
	}


	private fun sendEvent(eventName: String) {
		Log.v(TAG, "sendEvent $eventName")
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, null)
	}

	private fun sendEvent(eventName: String, params: WritableMap?) {
		Log.v(TAG, "sendEvent $eventName")
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun sendEvent(eventName: String, params: WritableArray?) {
		Log.v(TAG, "sendEvent $eventName")
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun sendEvent(eventName: String, params: String?) {
		Log.v(TAG, "sendEvent $eventName")
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun sendEvent(eventName: String, params: Int?) {
		Log.v(TAG, "sendEvent $eventName")
		reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
	}

	private fun sendNotification(id: Int, title: String, text: String) {
		NotificationManagerCompat.from(reactContext).notify(id, getNotification(false, title, text))
	}

	private fun cancelNotification(id: Int) {
		NotificationManagerCompat.from(reactContext).cancel(id)
	}

	private fun getServiceNotification(title: String, text: String): Notification {
		return getNotification(true, title, text)
	}

	private fun updateServiceNotification() {
		if (!backgroundScanning) {
			return
		}

		var title = "Localization running"
		var text = when (isInSphere) {
			true -> "Currently in sphere."
			false -> "Currently not in sphere."
		}

		if (!bluenet.isBleEnabled()) {
			title = "Localization not working"
			text = "Bluetooth must be enabled for localization to work."
		}
		else if (!bluenet.isPermissionsGranted()) {
			title = "Localization not working"
			text = "App needs location permission for localization to work."
		}
		else if (!bluenet.isLocationServiceEnabled()) {
			title = "Localization not working"
			text = "Location needs to be enabled for localization to work."
		}

		NotificationManagerCompat.from(reactContext).notify(ONGOING_NOTIFICATION_ID, getNotification(true, title, text))
	}

	private fun getNotification(serviceNotification: Boolean, title: String, text: String): Notification {
		// The id of the notification channel. Must be unique per package. The value may be truncated if it is too long.
		val channelId = when (serviceNotification) {
			true -> "Service"
			false -> "Notification"
		}

		// The user visible name of the channel. The recommended maximum length is 40 characters; the value may be truncated if it is too long.
		val channelName = when (serviceNotification) {
			true -> "Background"
			false -> "Alerts"
		}

		// The recommended maximum length is 300 characters; the value may be truncated if it is too long.
		val channelDescription = when (serviceNotification) {
			true -> "Shows when the app is running in the backbround."
			false -> "Various alerts."
		}

		val importance = when (serviceNotification) {
			true -> android.app.NotificationManager.IMPORTANCE_MIN
			false -> android.app.NotificationManager.IMPORTANCE_DEFAULT
		}

		val compatImportance = when (serviceNotification) {
			true -> NotificationCompat.PRIORITY_MIN
			false -> NotificationCompat.PRIORITY_DEFAULT
		}

		val showBadge = !serviceNotification
		val onGoing = serviceNotification


		val notificationIntent = Intent(reactContext, MainActivity::class.java)
//		notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
//		notificationIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
		notificationIntent.action = Intent.ACTION_MAIN
		notificationIntent.addCategory(Intent.CATEGORY_LAUNCHER)
		notificationIntent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT

		if (Build.VERSION.SDK_INT >= 26) {
			// Create the notification channel, must be done before posting any notification.
			// It's safe to call this repeatedly because creating an existing notification channel performs no operation.
			val channel = NotificationChannel(channelId, channelName, importance)
			channel.description = channelDescription
			channel.setShowBadge(showBadge)
			channel.setSound(null, null)

			// Register the channel with the system; you can't change the importance or other notification behaviors after this
			val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
			notificationManager.createNotificationChannel(channel)
		}


//		notificationIntent.setClassName("rocks.crownstone.consumerapp", "MainActivity");
//		notificationIntent.setAction("ACTION_MAIN");
//		PendingIntent pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_ONE_SHOT);
		val pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
//		PendingIntent pendingIntent = PendingIntent.getActivity(reactContext, 0, notificationIntent, 0);

		val notification = NotificationCompat.Builder(reactContext, channelId)
		notification.setSmallIcon(R.mipmap.ic_notification)
		notification.setContentTitle(title)
		notification.setContentText(text)
		notification.setContentIntent(pendingIntent)
		notification.setOngoing(onGoing)
		notification.setSound(null)

//		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
			notification.setPriority(compatImportance)
//		}

		notification.setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
		// TODO: add action to close the app + service
		// TODO: add action to pause the app?
//		notification.addAction(android.R.drawable.ic_menu_close_clear_cancel, )
//		notification.setLargeIcon()

		return notification.build()
	}

	private fun logMemoryUsage() {
		val activityManager = getReactApplicationContext().getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
		var memoryInfo = ActivityManager.MemoryInfo()
		activityManager.getMemoryInfo(memoryInfo)
		Log.i("Memory", "Sys memory: total=${memoryInfo.totalMem} available=${memoryInfo.availMem}")
		val runtime = Runtime.getRuntime()
		val used = runtime.totalMemory() - runtime.freeMemory()
		val availableHeap = runtime.maxMemory() - used
		Log.i("Memory", "Runtime: max=${runtime.maxMemory()} total=${runtime.totalMemory()} free=${runtime.freeMemory()} used=$used availableHeap=$availableHeap")
		Log.i("Memory", "heapSize=${Debug.getNativeHeapSize()} heapAvailable=${Debug.getNativeHeapFreeSize()}")
	}
}
//endregion
