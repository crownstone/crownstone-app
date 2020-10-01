/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Jan 15, 2019
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp

import android.app.ActivityManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.PendingIntent
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Criteria
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.*
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import nl.komponents.kovenant.Promise
import nl.komponents.kovenant.android.startKovenant
import nl.komponents.kovenant.android.stopKovenant
import nl.komponents.kovenant.then
import nl.komponents.kovenant.unwrap
import org.json.JSONException
import rocks.crownstone.bluenet.Bluenet
import rocks.crownstone.bluenet.behaviour.BehaviourHashGen
import rocks.crownstone.bluenet.behaviour.BehaviourSyncerFromCrownstone
import rocks.crownstone.bluenet.encryption.KeySet
import rocks.crownstone.bluenet.encryption.MeshKeySet
import rocks.crownstone.bluenet.packets.behaviour.*
import rocks.crownstone.bluenet.packets.keepAlive.KeepAliveSameTimeout
import rocks.crownstone.bluenet.packets.keepAlive.KeepAliveSameTimeoutItem
import rocks.crownstone.bluenet.packets.keepAlive.MultiKeepAlivePacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchLegacyItemPacket
import rocks.crownstone.bluenet.packets.multiSwitch.MultiSwitchLegacyPacket
import rocks.crownstone.bluenet.packets.powerSamples.PowerSamplesType
import rocks.crownstone.bluenet.packets.schedule.ScheduleCommandPacket
import rocks.crownstone.bluenet.packets.schedule.ScheduleEntryPacket
import rocks.crownstone.bluenet.scanhandling.NearestDeviceListEntry
import rocks.crownstone.bluenet.scanparsing.CrownstoneServiceData
import rocks.crownstone.bluenet.scanparsing.ScannedDevice
import rocks.crownstone.bluenet.structs.*
import rocks.crownstone.bluenet.util.*
import rocks.crownstone.bluenet.util.Util.isBitSet
import rocks.crownstone.localization.library.*
import rocks.crownstone.localization.library.structs.Fingerprint
import rocks.crownstone.localization.library.structs.FingerprintSamplesMap
import rocks.crownstone.localization.library.structs.PredictionProbabilityLocation
import rocks.crownstone.localization.library.structs.PredictionResult
import rocks.crownstone.localization.library.util.LocalizationEvent
import java.util.*
import kotlin.collections.ArrayList
import kotlin.math.round

class BluenetBridge(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
	private val TAG = this.javaClass.simpleName
	private val reactContext = reactContext
	private lateinit var bluenet: Bluenet
	private var bluenetInstantiated = false // Whether the bluenet object has been created.
	private lateinit var initBluenetPromise: Promise<Unit, Exception> // Success when bluenet is initialized.
	private val localization = FingerprintLocalization()
	private lateinit var looper: Looper
	private lateinit var handler: Handler

	private lateinit var behaviourSyncer: BehaviourSyncerFromCrownstone

	private val ONGOING_NOTIFICATION_ID = 99115

	// Scanning
	enum class ScannerState {
		STOPPED,
		UNIQUE_ONLY,
		BALANCED,
		HIGH_POWER
	}
//	private var uniqueScansOnly = false // Easier than unsubscribing and subscribing to events.
	private var scannerState = ScannerState.STOPPED
	private var prevScannerState = ScannerState.STOPPED
	private var isTracking = false
	private var appForeGround = true // Assume we start in foreground.

	// Localization
	private var isLocalizationTraining = false // TODO: keep this up in localization lib.
	private var isLocalizationTrainingPaused = false
	private var lastLocationId: String? = null
	private var lastSphereId = "" // TODO: get rid of this, as we should support multisphere. Currently needed because scans don't have the sphere id, nor location updates.

	private var nearestStoneSub: rocks.crownstone.bluenet.util.SubscriptionId? = null
	private var nearestSetupSub: rocks.crownstone.bluenet.util.SubscriptionId? = null
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

	init {

	}

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
				bluenet.filterForCrownstones(true)
				// When the GUI is killed, but the app is still running,
				// the GUI needs to get the location and BLE status when the GUI is opened again.
				// Although we might be in login screen, this is unlikely.
				sendLocationStatus()
				sendBleStatus()
			}
		}
	}

	@Synchronized
	private fun onBridgeHostPause() {
		Log.i(TAG, "onHostPause")
		appForeGround = false
		initBluenetPromise.success {
			handler.post {
				bluenet.filterForCrownstones(false)
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

//		// Main thread
//		bluenet = Bluenet(Looper.getMainLooper())
//		// Create thread for the bluenet library
//		val handlerThread = HandlerThread("BluenetBridge")
//		handlerThread.start()
//		bluenet = Bluenet(handlerThread.looper)

		reactContext.addLifecycleEventListener(lifecycleEventListener)

		initBluenetPromise = bluenet.init(reactContext, ONGOING_NOTIFICATION_ID, getServiceNotification("Crownstone is running in the background"))
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
				bluenet.subscribe(BluenetEvent.NO_LOCATION_SERVICE_PERMISSION, { data: Any? -> onLocationStatus(BluenetEvent.NO_LOCATION_SERVICE_PERMISSION) })
				bluenet.subscribe(BluenetEvent.LOCATION_PERMISSION_GRANTED, { data: Any? -> onLocationStatus(BluenetEvent.LOCATION_PERMISSION_GRANTED) })
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
		// Always called when app starts.
		// TODO: check if you can't continue the tutorial before giving or denying permission.
		if (reactContext.currentActivity == null) {
			Log.w(TAG, "No activity.")
		}
//		val activity = reactContext.currentActivity ?: return
		val activity = reactContext.currentActivity

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

		override fun onLocationChanged(location: Location?) {
			Log.i(TAG, "onLocationChanged location=$location")
			if (location == null) {
				rejectCallback("no location available")
				return
			}
			resolveCallback(location)
		}

		override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
			Log.i(TAG, "onStatusChanged provider=$provider status=$status")
		}

		override fun onProviderEnabled(provider: String?) {
			Log.i(TAG, "onProviderEnabled provider=$provider")
		}

		override fun onProviderDisabled(provider: String?) {
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
		}, 10*1000)

		// TODO: change to new API: https://stackoverflow.com/questions/51837719/requestsingleupdate-not-working-on-oreo
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
		scannerState = ScannerState.HIGH_POWER
		updateScanner()
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
		scannerState = prevScannerState
		updateScanner()
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

//endregion


//##################################################################################################
//region           Scanning
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun startScanning() {
		Log.i(TAG, "startScanning")
//		scannerState = ScannerState.HIGH_POWER
		scannerState = ScannerState.BALANCED
		bluenet.filterForIbeacons(true)
		bluenet.filterForCrownstones(appForeGround)
		updateScanner()
	}

	@ReactMethod
	@Synchronized
	fun startScanningForCrownstones() {
		Log.i(TAG, "startScanningForCrownstones")
//		scannerState = ScannerState.HIGH_POWER
		scannerState = ScannerState.BALANCED
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
			ScannerState.UNIQUE_ONLY,
			ScannerState.BALANCED-> {
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
		prevScannerState = scannerState
	}
//endregion


//##################################################################################################
//region           Localization
//##################################################################################################


	private val localizationCallback: LocalizationCallback = object : LocalizationCallback {
		override fun onLocationUpdate(sphereId: String?, locationId: String?) {
			this@BluenetBridge.onLocationUpdate(sphereId, locationId)
		}
	}

	@Synchronized
	private fun onLocationUpdate(sphereId: String?, locationId: String?) {
		//TODO: incorporate sphereID
		Log.d(TAG, "locationUpdate sphereId=$sphereId locationId=$locationId")
		if (locationId == null) {
			if (lastLocationId != null) {
				Log.d(TAG, "Send exit $lastSphereId $lastLocationId")
				val mapExit = Arguments.createMap()
				mapExit.putString("region", lastSphereId)
				mapExit.putString("location", lastLocationId)
				sendEvent("exitLocation", mapExit)
			}
		}
		else if (lastLocationId == null) {
			Log.i(TAG, "Send enter $sphereId $locationId")
			val mapEnter = Arguments.createMap()
			mapEnter.putString("region", sphereId)
			mapEnter.putString("location", locationId)
			sendEvent("enterLocation", mapEnter)
		}
		else if (locationId != lastLocationId) {
			Log.i(TAG, "Send exit $lastSphereId $lastLocationId")
			val mapExit = Arguments.createMap()
			mapExit.putString("region", lastSphereId)
			mapExit.putString("location", lastLocationId)
			sendEvent("exitLocation", mapExit)

			Log.i(TAG, "Send enter $sphereId $locationId")
			val mapEnter = Arguments.createMap()
			mapEnter.putString("region", sphereId)
			mapEnter.putString("location", locationId)
			sendEvent("enterLocation", mapEnter)
		}
		if (locationId != null) {
			Log.d(TAG, "Send current $sphereId $locationId")
			val mapCurrent = Arguments.createMap()
			mapCurrent.putString("region", sphereId)
			mapCurrent.putString("location", locationId)
			sendEvent("currentLocation", mapCurrent)
		}
		lastLocationId = locationId
		lastSphereId = sphereId ?: ""
	}

	@ReactMethod
	@Synchronized
	fun startIndoorLocalization() {
		Log.i(TAG, "startIndoorLocalization")
		// Start using the classifier
		localization.startLocalization(localizationCallback)
		localization.subscribe(LocalizationEvent.CLASSIFIER_RESULT) { onClassifierResult(it as PredictionResult) }
		localization.subscribe(LocalizationEvent.CLASSIFIER_PREDICTION) { onClassifierPrediction(it as PredictionProbabilityLocation?) }
	}

	@Synchronized
	private fun onClassifierPrediction(prediction: PredictionProbabilityLocation?) {
		if (prediction == null) {
			return
		}
		val mapClassifierPrediction = Arguments.createMap().apply {
			putString("highestPredictionLabel", prediction.location.roomId)
			putDouble("highestPrediction", prediction.probability)
		}
		sendEvent("classifierResult", mapClassifierPrediction)
	}

	@Synchronized
	private fun onClassifierResult(result: PredictionResult) {
		val mapClassifierProbabilites = Arguments.createMap()
		for (prediction in result.allPredictions) {
			val mapData = Arguments.createMap().apply {
				putInt("sampleSize", prediction.sampleSize)
				putDouble("probability", prediction.probability)
			}
			mapClassifierProbabilites.putMap(prediction.location.roomId, mapData)
		}
		sendEvent("classifierProbabilities", mapClassifierProbabilites)
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
				fingerprint.samples = samples
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
	fun connect(address: String, referenceId: String?, callback: Callback) {
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

		val subId = bluenet.subscribe(BluenetEvent.SETUP_PROGRESS, { data: Any? -> onSetupProgress(data as Double) })

		// Maybe refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
		// Not sure if this is helpful, as it would've gone wrong already on connect (when session nonce is read in normal mode)
		bluenet.setup.setup(crownstoneId, sphereId, keySet, meshKeySet, meshAccessAddress, ibeaconData)
				.success {
					Log.i(TAG, "setup success")
					resolveCallback(callback)
				}
				.fail {
					sendEvent("setupProgress", 0) // TODO: is this required?
					rejectCallback(callback, it.message)
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
	fun setupPulse(callback: Callback) {
		Log.i(TAG, "setupPulse")
		// Crownstone is already connected
		// This call will turn the relay on, wait 1 second, turn it off, disconnect
		bluenet.control.setSwitch(100U)
				.then { bluenet.waitPromise(1000) }.unwrap()
				.then { bluenet.control.setSwitch(0U) }.unwrap()
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun bootloaderToNormalMode(address: String?, callback: Callback) {
		Log.i(TAG, "bootloaderToNormalMode $address")
		if (address == null) { return }
		// Connect, reset to normal mode, disconnect.
		// Also disconnect when reset fails!
		bluenet.connect(address)
				.then { bluenet.dfu.reset() }.unwrap()
				.success { resolveCallback(callback) }
				.fail {
					bluenet.disconnect(true)
							.always {
								rejectCallback(callback, it.message)
							}
				}
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
		bluenet.mesh.noop()
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
		val listPacket = parseMultiSwitchLegacy(switchItems)
		if (listPacket == null) {
			rejectCallback(callback, "Invalid multiSwitch data: $switchItems")
			return
		}
		bluenet.control.multiSwitch(listPacket)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun turnOnMesh(switchItems: ReadableArray, callback: Callback) {
		Log.i(TAG, "turnOnMesh $switchItems")
		val listPacket = parseMultiSwitchLegacy(switchItems)
		if (listPacket == null) {
			rejectCallback(callback, "Invalid multiSwitch data: $switchItems")
			return
		}
		bluenet.control.multiSwitchOn(listPacket)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	private fun parseMultiSwitchLegacy(switchItems: ReadableArray): MultiSwitchLegacyPacket? {
		// switchItems = [{crownstoneId: number(uint16), state: number(float) [ 0 .. 1 ]}, {}, ...]
		val listPacket = MultiSwitchLegacyPacket()
		var success = true
		for (i in 0 until switchItems.size()) {
			val itemMap = switchItems.getMap(i) ?: continue
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
		bluenet.config.setSwitchCraftEnabled(enable)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setMeshChannel(channel: Int, callback: Callback) {
		Log.i(TAG, "setMeshChannel $channel")
		bluenet.config.setMeshChannel(channel.toUint8())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}


	@ReactMethod
	@Synchronized
	fun setTime(timestampDouble: Double, callback: Callback) {
		Log.i(TAG, "setTime $timestampDouble")
		val timestamp = timestampDouble.toLong()
		bluenet.control.setTime(timestamp.toUint32())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun meshSetTime(timestampDouble: Double, callback: Callback) {
		Log.i(TAG, "meshSetTime $timestampDouble")
		val timestamp = timestampDouble.toLong()
		bluenet.mesh.setTime(timestamp.toUint32())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setSunTimesViaConnection(sunRiseAfterMidnight: Int, sunSetAfterMidnight: Int, callback: Callback) {
		Log.i(TAG, "setSunTimesViaConnection sunRiseAfterMidnight=$sunRiseAfterMidnight sunSetAfterMidnight=$sunSetAfterMidnight")
		bluenet.config.setSunTime(sunRiseAfterMidnight.toUint32(), sunSetAfterMidnight.toUint32())
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
		bluenet.control.removeSchedule(scheduleEntryIndex.toUint8())
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
			packet.timestamp = map.getDouble("nextTime").toLong().toUint32()
			packet.minutes = 0U
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
					packet.minutes = map.getInt("intervalInMinutes").toUint16()
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
			packet.fadeDuration = map.getInt("fadeDuration").toUint16()
			if (packet.fadeDuration > 0U) {
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
				map.putInt("intervalInMinutes", packet.minutes.toInt())
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
				map.putInt("fadeDuration", packet.fadeDuration.toInt())
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
		bluenet.control.keepAliveAction(action, switchVal, timeout.toUint16())
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
		val sameTimeoutPacket = KeepAliveSameTimeout(timeout.toUint16())
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
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun turnOnBroadcast(referenceId: String, stoneIdInt: Int, autoExecute: Boolean, callback: Callback) {
		Log.i(TAG, "turnOnBroadcast referenceId=$referenceId stoneId=$stoneIdInt, autoExecute=$autoExecute")
		val stoneId = Conversion.toUint8(stoneIdInt)
		bluenet.broadCast.switchOn(referenceId, stoneId, autoExecute)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setTimeViaBroadcast(timestampDouble: Double, sunRiseAfterMidnight: Int, sunSetAfterMidnight: Int, referenceId: String, callback: Callback) {
		Log.i(TAG, "setTimeViaBroadcast referenceId=$referenceId timestampDouble=$timestampDouble sunRiseAfterMidnight=$sunRiseAfterMidnight sunSetAfterMidnight=$sunSetAfterMidnight")
		bluenet.broadCast.setTime(referenceId, timestampDouble.toUint32(), sunRiseAfterMidnight.toUint32(), sunSetAfterMidnight.toUint32())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
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
				.fail { rejectCallback(callback, it.message) }
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
	fun addBehaviour(behaviour: ReadableMap, callback: Callback) {
		Log.i(TAG, "addBehaviour")
		val indexedBehaviourPacket = parseBehaviourTransfer(behaviour)
		if (indexedBehaviourPacket == null) {
			rejectCallback(callback, Errors.ValueWrong().message)
			return
		}
		Log.i(TAG, "hash = ${BehaviourHashGen.getHash(indexedBehaviourPacket.behaviour)}")
		bluenet.control.addBehaviour(indexedBehaviourPacket.behaviour)
				.success {
					val retVal = genBehaviourReply(it)
					if (retVal == null) {
						rejectCallback(callback, Errors.ValueWrong().message)
					}
					else {
						resolveCallback(callback, retVal)
					}
				}
				.fail {
					rejectCallback(callback, it.message)
				}
	}

	@ReactMethod
	@Synchronized
	fun updateBehaviour(behaviour: ReadableMap, callback: Callback) {
		Log.i(TAG, "updateBehaviour")
		val indexedBehaviourPacket = parseBehaviourTransfer(behaviour)
		if (indexedBehaviourPacket == null) {
			rejectCallback(callback, Errors.ValueWrong().message)
			return
		}
		bluenet.control.replaceBehaviour(indexedBehaviourPacket.index, indexedBehaviourPacket.behaviour)
				.success {
					val retVal = genBehaviourReply(it)
					if (retVal == null) {
						rejectCallback(callback, Errors.ValueWrong().message)
					}
					else {
						resolveCallback(callback, retVal)
					}
				}
				.fail {
					rejectCallback(callback, it.message)
				}
	}

	@ReactMethod
	@Synchronized
	fun removeBehaviour(index: Int, callback: Callback) {
		Log.i(TAG, "removeBehaviour")
		val behaviourIndex = Conversion.toUint8(index)
		bluenet.control.removeBehaviour(behaviourIndex)
				.success {
					val retVal = genBehaviourReply(it)
					if (retVal == null) {
						rejectCallback(callback, Errors.ValueWrong().message)
					}
					else {
						resolveCallback(callback, retVal)
					}
				}
				.fail {
					rejectCallback(callback, it.message)
				}
	}

	@ReactMethod
	@Synchronized
	fun getBehaviour(index: Int, callback: Callback) {
		Log.i(TAG, "getBehaviour")
		val behaviourIndex = Conversion.toUint8(index)
		bluenet.control.getBehaviour(behaviourIndex)
				.success {
					val retVal = genBehaviour(it)
					if (retVal == null) {
						rejectCallback(callback, Errors.ValueWrong().message)
					}
					else {
						resolveCallback(callback, retVal)
					}
				}
				.fail {
					rejectCallback(callback, it.message)
				}
	}

	@ReactMethod
	@Synchronized
	fun syncBehaviours(behaviours: ReadableArray, callback: Callback) {
		Log.i(TAG, "syncBehaviours")
		// Synchronize behaviours: the given behaviours is the local believe of what behaviours are on the Crownstone.
		// The sync will check which behaviours are on the Crownstone, and return those.
		val behaviourList = parseBehaviourTransferArray(behaviours)
		if (behaviourList == null) {
			rejectCallback(callback, "Invalid behaviour")
			return
		}
		behaviourSyncer.setBehaviours(behaviourList)
		behaviourSyncer.sync()
				.success {
					val behaviourArray = genBehaviourTransferArray(it)
					if (behaviourArray == null) {
						rejectCallback(callback, "Invalid behaviour")
						return@success
					}
					resolveCallback(callback, behaviourArray)
				}
				.fail {
					rejectCallback(callback, it.message)
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
	fun getBehaviourDebugInformation(callback: Callback) {
		Log.i(TAG, "getBehaviourDebugInformation")
		bluenet.control.getBehaviourDebug()
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
				.fail { rejectCallback(callback, it.message) }
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
			deviceId: Int,
			locationId: Int,
			profileId: Int,
			rssiOffset: Int,
			ignoreForPresence: Boolean,
			tapToToggle: Boolean,
			deviceToken: Double,
			ttlMinutes: Int,
			callback: Callback) {
		Log.i(TAG, "registerTrackedDevice")
		// Since android can broadcast any payload that can be changed at any time,
		// this function won't be needed.
		Log.w(TAG, "Not implemented")
		resolveCallback(callback)
	}

	@ReactMethod
	@Synchronized
	fun broadcastUpdateTrackedDevice(
			referenceId: String,
			deviceId: Int,
			locationId: Int,
			profileId: Int,
			rssiOffset: Int,
			ignoreForPresence: Boolean,
			tapToToggle: Boolean,
			deviceToken: Double,
			ttlMinutes: Int,
			callback: Callback) {
		Log.i(TAG, "broadcastUpdateTrackedDevice")
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
	fun setTapToToggle(value: Boolean, callback: Callback) {
		Log.i(TAG, "setTapToToggle $value")
		bluenet.config.setTapToToggleEnabled(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setTapToToggleThresholdOffset(value: Int, callback: Callback) {
		Log.i(TAG, "setTapToToggleThresholdOffset $value")
		bluenet.config.setTapToToggleRssiThresholdOffset(value.toByte())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getTapToToggleThresholdOffset(callback: Callback) {
		Log.i(TAG, "getTapToToggleThresholdOffset")
		bluenet.config.getTapToToggleRssiThresholdOffset()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setSoftOnSpeed(value: Int, callback: Callback) {
		Log.i(TAG, "setSoftOnSpeed $value")
		bluenet.config.setSoftOnSpeed(value.toUint8())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getSoftOnSpeed(callback: Callback) {
		Log.i(TAG, "getSoftOnSpeed")
		bluenet.config.getSoftOnSpeed()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

//endregion

//##################################################################################################
//region           Dev
//##################################################################################################

	@ReactMethod
	@Synchronized
	fun switchRelay(value: Boolean, callback: Callback) {
		Log.i(TAG, "switchRelay")
		bluenet.control.setRelay(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun switchDimmer(value: Double, callback: Callback) {
		Log.i(TAG, "switchDimmer")
		bluenet.control.setDimmer(convertSwitchVal(value))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setUartState(value: Int, callback: Callback) {
		Log.i(TAG, "setUartState")
		bluenet.config.setUartEnabled(UartMode.fromNum(Conversion.toUint8(value)))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getResetCounter(callback: Callback) {
		Log.i(TAG, "getResetCounter")
		bluenet.state.getResetCount()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getSwitchcraftThreshold(callback: Callback) {
		Log.i(TAG, "getSwitchcraftThreshold")
		bluenet.config.getSwitchCraftThreshold()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setSwitchcraftThreshold(value: Float, callback: Callback) {
		Log.i(TAG, "setSwitchcraftThreshold")
		bluenet.config.setSwitchCraftThreshold(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getMaxChipTemp(callback: Callback) {
		Log.i(TAG, "getMaxChipTemp")
		bluenet.config.getMaxChipTemp()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setMaxChipTemp(value: Int, callback: Callback) {
		Log.i(TAG, "setMaxChipTemp")
		bluenet.config.setMaxChipTemp(value.toByte())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getDimmerCurrentThreshold(callback: Callback) {
		Log.i(TAG, "getDimmerCurrentThreshold")
		bluenet.config.getCurrentThresholdDimmer()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setDimmerCurrentThreshold(value: Int, callback: Callback) {
		Log.i(TAG, "setDimmerCurrentThreshold")
		bluenet.config.setCurrentThresholdDimmer(Conversion.toUint16(value))
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getDimmerTempUpThreshold(callback: Callback) {
		Log.i(TAG, "getDimmerTempUpThreshold")
		bluenet.config.getDimmerTempUpThreshold()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setDimmerTempUpThreshold(value: Double, callback: Callback) {
		Log.i(TAG, "setDimmerTempUpThreshold")
		bluenet.config.setDimmerTempUpThreshold(value.toFloat())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getDimmerTempDownThreshold(callback: Callback) {
		Log.i(TAG, "getDimmerTempDownThreshold")
		bluenet.config.getDimmerTempDownThreshold()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setDimmerTempDownThreshold(value: Double, callback: Callback) {
		Log.i(TAG, "setDimmerTempDownThreshold")
		bluenet.config.setDimmerTempDownThreshold(value.toFloat())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getVoltageZero(callback: Callback) {
		Log.i(TAG, "getVoltageZero")
		bluenet.config.getVoltageZero()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setVoltageZero(value: Int, callback: Callback) {
		Log.i(TAG, "setVoltageZero")
		bluenet.config.setVoltageZero(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getCurrentZero(callback: Callback) {
		Log.i(TAG, "getCurrentZero")
		bluenet.config.getCurrentZero()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setCurrentZero(value: Int, callback: Callback) {
		Log.i(TAG, "setCurrentZero")
		bluenet.config.setCurrentZero(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getPowerZero(callback: Callback) {
		Log.i(TAG, "getPowerZero")
		bluenet.config.getPowerZero()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setPowerZero(value: Int, callback: Callback) {
		Log.i(TAG, "setPowerZero")
		bluenet.config.setPowerZero(value)
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getVoltageMultiplier(callback: Callback) {
		Log.i(TAG, "getVoltageMultiplier")
		bluenet.config.getVoltageMultiplier()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setVoltageMultiplier(value: Double, callback: Callback) {
		Log.i(TAG, "setVoltageMultiplier")
		bluenet.config.setVoltageMultiplier(value.toFloat())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getCurrentMultiplier(callback: Callback) {
		Log.i(TAG, "getCurrentMultiplier")
		bluenet.config.getCurrentMultiplier()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun setCurrentMultiplier(value: Int, callback: Callback) {
		Log.i(TAG, "setCurrentMultiplier")
		bluenet.config.setCurrentMultiplier(value.toFloat())
				.success { resolveCallback(callback) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getCrownstoneUptime(callback: Callback) {
		Log.i(TAG, "getCrownstoneUptime")
		bluenet.debugData.getUptime()
				.success { resolveCallback(callback, it.toDouble()) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getAdcRestarts(callback: Callback) {
		Log.i(TAG, "getAdcRestarts")
		bluenet.debugData.getAdcRestarts()
				.success {
					val retVal = Arguments.createMap()
					retVal.putDouble("restartCount", it.count.toDouble())
					retVal.putDouble("timestamp", it.lastTimestamp.toDouble())
					resolveCallback(callback, retVal) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getSwitchHistory(callback: Callback) {
		Log.i(TAG, "getSwitchHistory")
		bluenet.debugData.getSwitchHistory()
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
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getPowerSamples(typeStr: String, callback: Callback) {
		Log.i(TAG, "getPowerSamples $typeStr")
		val type: PowerSamplesType = when (typeStr) {
			"triggeredSwitchcraft" -> PowerSamplesType.SWITCHCRAFT
			"missedSwitchcraft" -> PowerSamplesType.SWITCHCRAFT_NON_TRIGGERED
			"filteredBuffer" -> PowerSamplesType.NOW_FILTERED
			"unfilteredBuffer" -> PowerSamplesType.NOW_UNFILTERED
			"softFuse" -> PowerSamplesType.SOFT_FUSE
			else -> PowerSamplesType.UNKNOWN
		}

		bluenet.debugData.getPowerSamples(type)
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
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getMinSchedulerFreeSpace(callback: Callback) {
		Log.i(TAG, "getMinSchedulerFreeSpace")
		bluenet.debugData.getSchedulerMinFree()
				.success { resolveCallback(callback, it) }
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getLastResetReason(callback: Callback) {
		Log.i(TAG, "getLastResetReason")
		bluenet.debugData.getResetReason()
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
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getGPREGRET(callback: Callback) {
		Log.i(TAG, "getGPREGRET")
		bluenet.debugData.getGpregret()
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
				.fail { rejectCallback(callback, it.message) }
	}

	@ReactMethod
	@Synchronized
	fun getAdcChannelSwaps(callback: Callback) {
		Log.i(TAG, "getAdcChannelSwaps")
		bluenet.debugData.getAdcChannelSwaps()
				.success {
					val retVal = Arguments.createMap()
					retVal.putDouble("swapCount", it.count.toDouble())
					retVal.putDouble("timestamp", it.lastTimestamp.toDouble())
					resolveCallback(callback, retVal) }
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
		for (region in eventData.list) {
			if (region.key == uuid) {
				val referenceId = region.value
				lastSphereId = referenceId
				Log.i(TAG, "enterSphere uuid=$uuid refId=$referenceId")
				sendEvent("enterSphere", referenceId)
			}
		}
	}

	@Synchronized
	private fun onRegionExit(eventData: IbeaconRegionEventData) {
		val uuid = eventData.changedRegion
		for (region in eventData.list) {
			if (region.key == uuid) {
				val referenceId = region.value
				lastSphereId = ""
				Log.i(TAG, "exitSphere uuid=$uuid refId=$referenceId")
				sendEvent("exitSphere", referenceId)
			}
		}
	}

	@Synchronized
	private fun onIbeaconScan(scanList: ScannedIbeaconList) {
		if (appLogLevel == AppLogLevel.BASIC || appLogLevel == AppLogLevel.EXTENDED) {
			Log.i("IbeaconScan", "onTimeout numBeacons=${scanList.size}")
			for (scan in scanList) {
				Log.d("IbeaconScan", "    ${scan.address} uuid=${scan.ibeaconData.uuid} major=${scan.ibeaconData.major} minor=${scan.ibeaconData.minor} rssi=${scan.rssi}")
			}

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

	@Synchronized
	private fun onScan(device: ScannedDevice) {
//		Log.d(TAG, "onScan: $device")
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
		serviceDataMap.putBoolean("alternativeState", serviceData.type == ServiceDataType.ALT_STATE)
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
		serviceDataMap.putInt("behaviourMasterHash", serviceData.behaviourHash.toInt())

		if (serviceData.version == ServiceDataVersion.V1 || serviceData.version == ServiceDataVersion.UNKNOWN) {
			serviceDataMap.putDouble("timestamp", -1.0)
		}
		else if (serviceData.flagTimeSet) {
			serviceDataMap.putDouble("timestamp", serviceData.timestamp.toDouble())
		}
		else {
			serviceDataMap.putInt("timestamp", serviceData.count.toInt())
		}

		serviceDataMap.putBoolean("dimmerReady", serviceData.flagDimmerReady)
		serviceDataMap.putBoolean("dimmingAllowed", serviceData.flagDimmable)
		serviceDataMap.putBoolean("switchLocked", serviceData.flagSwitchLocked)
		serviceDataMap.putBoolean("timeSet", serviceData.flagTimeSet)
		serviceDataMap.putBoolean("switchCraftEnabled", serviceData.flagSwitchCraft)
		serviceDataMap.putBoolean("tapToToggleEnabled", serviceData.flagTapToToggleEnabled)
		serviceDataMap.putBoolean("behaviourOverridden", serviceData.flagBehaviourOverridden)
		serviceDataMap.putBoolean("behaviourEnabled", serviceData.flagBehaviourEnabled)

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
				.setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
				// TODO: add action to close the app + service
				// TODO: add action to pause the app?
//				.addAction(android.R.drawable.ic_menu_close_clear_cancel, )
//				.setLargeIcon()
				.build()

		return notification
	}
}
//endregion
