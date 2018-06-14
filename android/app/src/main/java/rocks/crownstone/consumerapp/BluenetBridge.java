package rocks.crownstone.consumerapp;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.bluetooth.le.ScanSettings;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.Criteria;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Process;
import android.support.annotation.Nullable;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.util.Pair;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NoSuchKeyException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UnexpectedNativeTypeException;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import nl.dobots.bluenet.ble.base.BleBase;
import nl.dobots.bluenet.ble.base.BleBaseEncryption;
import nl.dobots.bluenet.ble.base.callbacks.IBooleanCallback;
import nl.dobots.bluenet.ble.base.callbacks.IByteArrayCallback;
import nl.dobots.bluenet.ble.base.callbacks.IDiscoveryCallback;
import nl.dobots.bluenet.ble.base.callbacks.IIntegerCallback;
import nl.dobots.bluenet.ble.base.callbacks.IProgressCallback;
import nl.dobots.bluenet.ble.base.structs.ControlMsg;
import nl.dobots.bluenet.ble.base.structs.CrownstoneServiceData;
import nl.dobots.bluenet.ble.base.structs.EncryptionKeys;
import nl.dobots.bluenet.ble.base.structs.ScheduleCommandPacket;
import nl.dobots.bluenet.ble.base.structs.ScheduleEntryPacket;
import nl.dobots.bluenet.ble.base.structs.ScheduleListPacket;
import nl.dobots.bluenet.ble.cfg.BleErrors;
import nl.dobots.bluenet.ble.cfg.BluenetConfig;
import nl.dobots.bluenet.ble.core.BleCore;
import nl.dobots.bluenet.ble.core.LocationRequest;
import nl.dobots.bluenet.ble.core.callbacks.IStatusCallback;
import nl.dobots.bluenet.ble.extended.BleDeviceFilter;
import nl.dobots.bluenet.ble.extended.BleExt;
import nl.dobots.bluenet.ble.extended.BleExtState;
import nl.dobots.bluenet.ble.extended.callbacks.EventListener;
import nl.dobots.bluenet.ble.extended.CrownstoneSetup;
import nl.dobots.bluenet.ble.extended.structs.BleDevice;
import nl.dobots.bluenet.ble.extended.structs.BleDeviceList;
import nl.dobots.bluenet.ble.mesh.structs.MeshControlMsg;
import nl.dobots.bluenet.ble.mesh.structs.cmd.MeshConfigPacket;
import nl.dobots.bluenet.ble.mesh.structs.cmd.MeshControlPacket;
import nl.dobots.bluenet.ble.mesh.structs.keepalive.MeshKeepAlivePacket;
import nl.dobots.bluenet.ble.mesh.structs.keepalive.MeshKeepAliveSameTimeoutPacket;
import nl.dobots.bluenet.ble.mesh.structs.multiswitch.MeshMultiSwitchListPacket;
import nl.dobots.bluenet.ble.mesh.structs.multiswitch.MeshMultiSwitchPacket;
import nl.dobots.bluenet.ibeacon.BleBeaconRangingListener;
import nl.dobots.bluenet.ibeacon.BleIbeaconFilter;
import nl.dobots.bluenet.ibeacon.BleIbeaconRanging;
import nl.dobots.bluenet.scanner.BleIntervalScanner;
import nl.dobots.bluenet.scanner.BleScanner;
import nl.dobots.bluenet.service.BleScanService;
import nl.dobots.bluenet.service.BluetoothPermissionRequest;
import nl.dobots.bluenet.scanner.callbacks.ScanDeviceListener;
import nl.dobots.bluenet.utils.BleLog;
import nl.dobots.bluenet.utils.BleUtils;
import nl.dobots.bluenet.utils.FileLogger;
import no.nordicsemi.android.dfu.DfuProgressListener;
import no.nordicsemi.android.dfu.DfuProgressListenerAdapter;
import no.nordicsemi.android.dfu.DfuServiceController;
import no.nordicsemi.android.dfu.DfuServiceInitiator;
import no.nordicsemi.android.dfu.DfuServiceListenerHelper;
import rocks.crownstone.localization.Fingerprint;
import rocks.crownstone.localization.FingerprintLocalization;
import rocks.crownstone.localization.FingerprintSamplesMap;
import rocks.crownstone.localization.Localization;
import rocks.crownstone.localization.LocalizationCallback;

import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;
import static android.os.Parcelable.PARCELABLE_WRITE_RETURN_VALUE;

public class BluenetBridge extends ReactContextBaseJavaModule implements EventListener, ScanDeviceListener, BleBeaconRangingListener, LocalizationCallback {
	private static final String TAG = BluenetBridge.class.getCanonicalName();
	public static final int ONGOING_NOTIFICATION_ID = 99115;

	private static final int LOG_LEVEL_DEFAULT =         Log.WARN;
	// only add classes where you want to change the default level from verbose to something else
	private static final Triplet[] LOG_LEVELS = new Triplet[]{
			                                             // log lvl   file log lvl
			new Triplet<>(BleCore.class,                 Log.DEBUG,    Log.INFO),
			new Triplet<>(BleBase.class,                 Log.DEBUG,    Log.DEBUG),
			new Triplet<>(BleExt.class,                  Log.DEBUG,    Log.INFO),
			new Triplet<>(BleScanner.class,              Log.DEBUG,    Log.WARN),
			new Triplet<>(BleIntervalScanner.class,      Log.DEBUG,    Log.WARN),
			new Triplet<>(BleScanService.class,          Log.WARN,     Log.WARN),
			new Triplet<>(CrownstoneServiceData.class,   Log.WARN,     Log.WARN),
			new Triplet<>(BleBaseEncryption.class,       Log.WARN,     Log.WARN),
			new Triplet<>(BleIbeaconRanging.class,       Log.WARN,     Log.WARN),
			new Triplet<>(BleDevice.class,               Log.WARN,     Log.WARN),
			new Triplet<>(CrownstoneSetup.class,         Log.INFO,     Log.INFO),
			new Triplet<>(BluenetBridge.class,           Log.DEBUG,    Log.DEBUG),
	};

	private static final Triplet[] LOG_LEVELS_EXTENDED = new Triplet[]{
			// log lvl   file log lvl
			new Triplet<>(BleScanService.class,          Log.DEBUG,    Log.DEBUG),
			new Triplet<>(CrownstoneServiceData.class,   Log.WARN,     Log.WARN),
			new Triplet<>(BluenetBridge.class,           Log.DEBUG,    Log.DEBUG),
			new Triplet<>(BleBaseEncryption.class,       Log.INFO,     Log.INFO),
			new Triplet<>(BleIbeaconRanging.class,       Log.INFO,     Log.INFO),
			new Triplet<>(BleDevice.class,               Log.INFO,     Log.INFO),
			new Triplet<>(BleCore.class,                 Log.DEBUG,    Log.DEBUG),
			new Triplet<>(BleBase.class,                 Log.DEBUG,    Log.DEBUG),
			new Triplet<>(BleExt.class,                  Log.DEBUG,    Log.DEBUG),
			new Triplet<>(CrownstoneSetup.class,         Log.DEBUG,    Log.DEBUG),
	};


	public static final int SCAN_INTERVAL_FAST = 20000; // ms scanning
	public static final int SCAN_PAUSE_FAST =    500;   // ms pause
	public static final int SCAN_INTERVAL_IN_SPHERE = 500; // ms scanning
	public static final int SCAN_PAUSE_IN_SPHERE =    500; // ms pause
	public static final int SCAN_INTERVAL_OUTSIDE_SPHERE = 500;  // ms scanning
	public static final int SCAN_PAUSE_OUTSIDE_SPHERE =    2500; // ms pause

	public static final int SCAN_INTERVAL_FAST_ANDROID_N = 20000; // ms scanning
	public static final int SCAN_PAUSE_FAST_ANDROID_N =    500;   // ms pause
	public static final int SCAN_INTERVAL_IN_SPHERE_ANDROID_N = 3000; // ms scanning
	public static final int SCAN_PAUSE_IN_SPHERE_ANDROID_N =    3000; // ms pause
	public static final int SCAN_INTERVAL_OUTSIDE_SPHERE_ANDROID_N = 1000; // ms scanning
	public static final int SCAN_PAUSE_OUTSIDE_SPHERE_ANDROID_N =    5000; // ms pause

	public static final int IBEACON_RANGING_MIN_RSSI = -110;

	public static final int IBEACON_TICK_INTERVAL = 1000; // ms interval
	public static final int CONNECT_TIMEOUT_MS = 5000;
	public static final int CONNECT_NUM_RETRIES = 3;
	public static final int NUM_CONNECT_FAILS_FOR_RESET_BLE = 20; // After this number of consecutive connect failures, bluetooth will be reset.

	private enum ScannerState {
		DISABLED,
		LOW_POWER,
		UNIQUE_ONLY,
		HIGH_POWER,
	}

	private static class Triplet<T, U, V> {
		public final T first;
		public final U second;
		public final V third;

		public Triplet(T first, U second, V third) {
			this.first = first;
			this.second = second;
			this.third = third;
		}
	}

	private ReactApplicationContext _reactContext;
	private boolean _isAppOnForeground = true;
	private boolean _isInitialized = false;

	private BleScanner _scanner;
	private boolean _scannerInitialized = false;
	private boolean _initScannerInBackground = true;

//	private boolean _scanServiceIsBound = false;
//	private BleScanService _scanService;
//	private BleScanService _trackService;
//	private BleBase _bleBase;
//	private boolean _bleExtInitialized = false;
//	private BleExt _bleExt;
//	private BleIbeaconRanging _iBeaconRanger;


//	private Callback _readyCallback = null;
	private List<Callback> _readyCallbacks = new ArrayList<>();

	private Map<String, BleDevice> _scannedDeviceMap = new HashMap<>(); // Used to determine if scans are unique

	private ScannerState _scannerState = ScannerState.DISABLED;
	private BleDeviceFilter _deviceFilter = BleDeviceFilter.anyStone;
	private boolean _isTrackingIbeacon = false;

	private boolean _connectCallbackInvoked;

	private Map<UUID, String> _iBeaconSphereIds = new HashMap<>();
	private String _currentSphereId;

	private Localization _localization;
	private boolean _isTraingingLocalization = false;
	private boolean _isTraingingLocalizationPaused = false;
	private String _lastLocationId = null;

	private boolean _isResettingBluetooth = false;

	private int _numConsecutiveConnectFailures = 0;

	private FileLogger _fileLogger = null;

	// handler used for delayed execution and timeouts
	private Handler _handler;

	private Map<String, WritableMap> _ibeaconAdvertisements = new HashMap<>();

	private DfuServiceInitiator _dfuServiceInitiator = null;
	private DfuServiceController _dfuServiceController = null;
	private Callback _dfuCallback = null;

	private boolean _bleTurnedOff = false;
	private boolean _locationServiceTurnedOff = false;
	private boolean _locationPermissionMissing = false;

	public BluenetBridge(ReactApplicationContext reactContext) {
		super(reactContext);
		_reactContext = reactContext;

		_reactContext.addLifecycleEventListener(new LifecycleEventListener() {
			// TODO: use this to determine how fast to scan.

			@Override
			public void onHostResume() {
				BleLog.getInstance().LOGi(TAG, "onHostResume");
				_isAppOnForeground = true;
				BleLog.getInstance().LOGd(TAG, "_bleTurnedOff=" + _bleTurnedOff
						+ " _locationServiceTurnedOff=" + _locationServiceTurnedOff
						+ " _locationPermissionMissing=" + _locationPermissionMissing);

				if (_bleTurnedOff) {
					BleLog.getInstance().LOGd(TAG, "bluetooth is turned off");
					sendEvent("bleStatus", "poweredOff");
				}
				if (_locationServiceTurnedOff) {
					BleLog.getInstance().LOGd(TAG, "location service is turned off");
					sendEvent("locationStatus", "off");
				}
				if (_locationPermissionMissing) {
					BleLog.getInstance().LOGd(TAG, "location permission not granted");
					sendEvent("locationStatus", "noPermission");
				}
				updateScanner();
//				if (!_initScannerInBackground) {
//					updateScanner();
//				}
			}

			@Override
			public void onHostPause() {
				BleLog.getInstance().LOGi(TAG, "onHostPause");
				_isAppOnForeground = false;
				updateScanner();
			}

			@Override
			public void onHostDestroy() {
				BleLog.getInstance().LOGi(TAG, "onHostDestroy");
				_isAppOnForeground = false;
				updateScanner();
			}
		});

		IntentFilter intentFilter = new IntentFilter(Intent.ACTION_SCREEN_ON);
		intentFilter.addAction(Intent.ACTION_SCREEN_OFF);
		_reactContext.registerReceiver(new BroadcastReceiver() {
			@Override
			public void onReceive(Context context, Intent intent) {
				if (intent.getAction() == null) {
					return;
				}
				if (intent.getAction().equals(Intent.ACTION_SCREEN_OFF)) {
					BleLog.getInstance().LOGi(TAG, "screen 0");
				}
				else if (intent.getAction().equals(Intent.ACTION_SCREEN_ON)) {
					BleLog.getInstance().LOGi(TAG, "screen 1");
				}
			}
		}, intentFilter);

		init();
	}

	private void init() {
		BleLog.getInstance().LOGw(TAG, "init");
		_isInitialized = false;

		// create handler with its own thread
		HandlerThread handlerThread = new HandlerThread("BluenetBridge");
		handlerThread.start();
		_handler = new Handler(handlerThread.getLooper());
		_handler.postDelayed(iBeaconTick, IBEACON_TICK_INTERVAL);

		setLogLevels();
		_fileLogger = new FileLogger(_reactContext);
		_fileLogger.enable(false);
//		if (_reactContext.getCurrentActivity() != null) {
//			_fileLogger.requestPermissions(_reactContext.getCurrentActivity());
//		}
//		_reactContext.checkPermission()
		BleLog.addFileLogger(_fileLogger);

		_scanner = new BleScanner();
		initBluetooth(false);

		_localization = FingerprintLocalization.getInstance();
		_isResettingBluetooth = false;

		DfuServiceListenerHelper.registerProgressListener(_reactContext, _dfuProgressListener);

		_isInitialized = true;
	}

	private void setLogLevels(Triplet[] logLevels) {
		if (BuildConfig.DEBUG) {
			BleLog.getInstance().setLogLevel(LOG_LEVEL_DEFAULT);
		}
		else {
			BleLog.getInstance().setLogLevel(Log.ERROR);
		}
		for (Triplet triplet: logLevels) {
			Class<?> cls = (Class<?>)triplet.first;
			int logLevel = (int)triplet.second;
			int fileLogLevel = (int)triplet.third;
			if (BuildConfig.DEBUG) {
				BleLog.getInstance().setLogLevelPerTag(cls.getCanonicalName(), logLevel, fileLogLevel);
			}
			else {
				BleLog.getInstance().setLogLevelPerTag(cls.getCanonicalName(), Log.ERROR, fileLogLevel);
			}
		}
	}

	private void setLogLevels() {
		setLogLevels(LOG_LEVELS);
	}

	private void initBluetooth(final boolean makeReady) {
		BleLog.getInstance().LOGi(TAG, "initBluetooth");

		Activity activity = _reactContext.getCurrentActivity();
		Notification notification = getScanServiceNotification("Crownstone is running in the background");
		final boolean scannerInBackground = _initScannerInBackground;
		_scanner.init(makeReady, scannerInBackground, activity, notification, ONGOING_NOTIFICATION_ID, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "Initialized bluetooth");
				checkReady(false); // Call checkReady for ready callbacks.
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGe(TAG, "Bluetooth init error: " + error);
				switch (error) {
					case BleErrors.ERROR_BLUETOOTH_NOT_ENABLED: {
						_bleTurnedOff = true;
						sendEvent("bleStatus", "poweredOff");
						break;
					}
					case BleErrors.ERROR_LOCATION_SERVICES_NOT_ENABLED: {
						_locationServiceTurnedOff = true;
						sendEvent("locationStatus", "off");
						break;
					}
					case BleErrors.ERROR_LOCATION_PERMISSION_MISSING: {
						_locationPermissionMissing = true;
						sendEvent("locationStatus", "noPermission");
						break;
					}
				}
			}
		});
	}

	private void onScannerInitialized() {
		BleLog.getInstance().LOGi(TAG, "onScannerInitialized");
//		_scanner.setScanInterval(SCAN_INTERVAL_IN_SPHERE, SCAN_PAUSE_IN_SPHERE);
		getBleExt().setConnectTimeout(CONNECT_TIMEOUT_MS);
		getBleExt().setNumRetries(CONNECT_NUM_RETRIES);
		getIBeaconRanger().setRssiThreshold(IBEACON_RANGING_MIN_RSSI);
		getIBeaconRanger().registerListener(this);
		_bleTurnedOff = false;
		sendEvent("bleStatus", "poweredOn");
		_locationPermissionMissing = false;
		_locationServiceTurnedOff = false;
		sendEvent("locationStatus", "on");
	}

    @Override
    public String getName() {
        return "BluenetJS";
    }




	//########################################################################################
	//                       INIT FUNCTIONS
	//########################################################################################

	@ReactMethod
	public void rerouteEvents() {
		// Start sending events to RN.
		// Can be called before user is logged in.
		// Called before isReady().
		// Subscribe this class as listener for:
		// - Scanned devices
		// - Events
		// - Location
		// - Beacon
		// - etc.
		BleLog.getInstance().LOGi(TAG, "rerouteEvents");
		_scanner.registerEventListener(this);
		_scanner.registerScanDeviceListener(this);


//		init();
//		sendEvent("advertisementData", map);
//		sendEvent("iBeaconAdvertisement", map);
//		sendEvent("verifiedAdvertisementData", map);
//		sendEvent("nearestCrownstone", map);
//		sendEvent("nearestSetupCrownstone", map);
//		sendEvent("enterGroup", map);
//		sendEvent("exitGroup", map);
//		sendEvent("enterLocation", map);
//		sendEvent("exitLocation", map);
//		sendEvent("currentLocation", map);
	}

	@ReactMethod
	public synchronized void isReady(final Callback callback) {
		// Check if bluenet lib is ready (scanner and bluetooth).
		// Only invoke callback once lib is ready, do not invoke on error.
		// Only called at start of app.
		// Can be called multiple times, and should all be invoked once ready.
		BleLog.getInstance().LOGi(TAG, "isReady: " + callback);
		_readyCallbacks.add(callback);
		checkReady(true);
	}

	@ReactMethod
	public void viewsInitialized() {
		// All views have been initialized
		// This means the missing bluetooth functions can now be shown.
		if (_bleTurnedOff) {
			BleLog.getInstance().LOGd(TAG, "bluetooth off");
			sendEvent("bleStatus", "poweredOff");
		}
		if (_locationServiceTurnedOff) {
			BleLog.getInstance().LOGd(TAG, "location service off");
			sendEvent("locationStatus", "off");
		}
		if (_locationPermissionMissing) {
			BleLog.getInstance().LOGd(TAG, "location permission missing");
			sendEvent("locationStatus", "noPermission");
		}
	}

	@ReactMethod
	public void setSettings(ReadableMap config, Callback callback) {
		BleLog.getInstance().LOGi(TAG, "setSettings");
		// keys can be either in plain string or hex string format, check length to determine which

		if (!checkBleExt(callback)) {
			return;
		}
		WritableMap retVal = Arguments.createMap();
		String adminKey = null;
		String memberKey = null;
		String guestKey = null;
		if (config.hasKey("adminKey")) {
			adminKey = config.getString("adminKey");
		}
		if (config.hasKey("memberKey")) {
			memberKey = config.getString("memberKey");
		}
		if (config.hasKey("guestKey")) {
			guestKey = config.getString("guestKey");
		}

		adminKey = getKeyFromString(adminKey);
		memberKey = getKeyFromString(memberKey);
		guestKey = getKeyFromString(guestKey);
		getBleExt().getBleBase().setEncryptionKeys(new EncryptionKeys(adminKey, memberKey, guestKey));

		if (config.hasKey("encryptionEnabled")) {
			boolean enableEncryption = config.getBoolean("encryptionEnabled");
			if (enableEncryption && guestKey == null && memberKey == null && adminKey == null) {
				retVal.putBoolean("error", true);
				retVal.putString("data", "no key supplied");
			}
			else {
				getBleExt().getBleBase().enableEncryption(enableEncryption);
				retVal.putBoolean("error", false);
			}
		}
		else {
			retVal.putBoolean("error", true);
			retVal.putString("data", "missing parameter");
		}

		// This is also provided, it's the same as used for the iBeacon UUID:
		if (config.hasKey("referenceId")) {
			_currentSphereId = config.getString("referenceId");
		}
		else {
			retVal.putBoolean("error", true);
			retVal.putString("data", "missing referenceId");
			_currentSphereId = "";
		}

		callback.invoke(retVal);
	}


    //########################################################################################
    //                       MISC REACT FUNCTIONS
    //########################################################################################

	@ReactMethod
	public void quitApp() {
		BleLog.getInstance().LOGw(TAG, "quitApp");
		_scanner.destroy();

		if (_reactContext.getCurrentActivity() != null) {
			_reactContext.getCurrentActivity().finish();
		}
		_handler.removeCallbacksAndMessages(null);
//		_isInitialized = false;
		_reactContext.runOnUiQueueThread(new Runnable() {
			@Override
			public void run() {
				_reactContext.destroy();
			}
		});

		// See: http://stackoverflow.com/questions/2033914/is-quitting-an-application-frowned-upon
//		System.exit(0); // Not recommended, seems to restart app
		Process.killProcess(Process.myPid()); // Not recommended either
	}

	@ReactMethod
	public void resetBle() {
		BleLog.getInstance().LOGw(TAG, "resetBle");
		resetBluetooth();
	}

	private synchronized void resetBluetooth() {
		BleLog.getInstance().LOGw(TAG, "resetBluetooth");
		if (_isResettingBluetooth) {
			BleLog.getInstance().LOGw(TAG, "Already resetting bluetooth");
			return;
		}
		BleLog.getInstance().LOGw(TAG, "Don't reset bluetooth");
//		_isResettingBluetooth = true;
//		_bleExt.getBleBase().resetBle();
	}

	private BleExt getBleExt() {
		if (_scanner == null || _scanner.getIntervalScanner() == null) {
			return null;
		}
		return _scanner.getIntervalScanner().getBleExt();
	}

	private BleIbeaconRanging getIBeaconRanger() {
		if (getBleExt() == null) {
			return null;
		}
		return getBleExt().getIbeaconRanger();
	}

	private boolean checkBleExt(@Nullable Callback callback) {
		if (getBleExt() == null) {
			BleLog.getInstance().LOGw(TAG, "not ready");
			if (callback != null) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "not ready");
				callback.invoke(retVal);
			}
			return false;
		}
		return true;
	}

	@ReactMethod
	public void requestBleState() {
		BleLog.getInstance().LOGi(TAG, "requestBleState ble=" + !_bleTurnedOff + " location=" + !_locationServiceTurnedOff + " locationPermission=" + !_locationPermissionMissing);

		if (_bleTurnedOff) {
			sendEvent("bleStatus", "poweredOff");
		}
		else {
			sendEvent("bleStatus", "poweredOn");
		}

		if (_locationServiceTurnedOff) {
			sendEvent("locationStatus", "off");
		}
		else if (_locationPermissionMissing) {
			sendEvent("locationStatus", "noPermission");
		}
		else {
			sendEvent("locationStatus", "on");
		}
	}

	@ReactMethod
	public void requestLocationPermission() {
		// Request for location permission and for location to be turned on, but only if that's not granted yet.
		BleLog.getInstance().LOGi(TAG, "requestLocationPermission");

		// This already has all the checks?
//		initBluetooth();

		// if api newer than 23, need to check for location permission
		if (Build.VERSION.SDK_INT >= 23) {
			int permissionCheck = ContextCompat.checkSelfPermission(_reactContext, android.Manifest.permission.ACCESS_COARSE_LOCATION);
			BleLog.getInstance().LOGd(TAG, "permissionCheck = " + permissionCheck + " _locationServiceTurnedOff=" + _locationServiceTurnedOff);
//			if (permissionCheck == PackageManager.PERMISSION_GRANTED && _locationServiceTurnedOff == false) {
//				BleLog.getInstance().LOGd(TAG, "return");
//				return;
//			}
			if (permissionCheck != PackageManager.PERMISSION_GRANTED) {
				Intent intent = new Intent(_reactContext, BluetoothPermissionRequest.class);
				intent.setFlags(FLAG_ACTIVITY_NEW_TASK);
				_reactContext.startActivity(intent);
			}
		}

		// Ask for location to be turned on.
		if (_locationServiceTurnedOff) {
			Intent intent = new Intent(_reactContext, LocationRequest.class);
			intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
			_reactContext.startActivity(intent);
		}
	}

	@ReactMethod
	public void requestLocation(Callback callback) {
		// Should return data {"latitude": number, "longitude": number}
		BleLog.getInstance().LOGi(TAG, "requestLocation");
		WritableMap retVal = Arguments.createMap();

		if (ContextCompat.checkSelfPermission(_reactContext, "android.permission.ACCESS_COARSE_LOCATION") != PackageManager.PERMISSION_GRANTED) {
//			ActivityCompat.requestPermissions( this, new String[] { android.Manifest.permission.ACCESS_COARSE_LOCATION }, MY_PERMISSIONS_REQUEST_COURSE_LOCATION);
			retVal.putBoolean("error", true);
			retVal.putString("data", "no permission to get location");
			callback.invoke(retVal);
			return;
		}

		LocationManager locationManager = (LocationManager) _reactContext.getSystemService(Context.LOCATION_SERVICE);
		if (locationManager == null) {
			retVal.putBoolean("error", true);
			retVal.putString("data", "no location manager");
			callback.invoke(retVal);
			return;
		}

		Criteria criteria = new Criteria();
		criteria.setAccuracy(Criteria.ACCURACY_COARSE);
		criteria.setAltitudeRequired(false);
		criteria.setBearingRequired(false);
		criteria.setSpeedRequired(false);
		String provider = locationManager.getBestProvider(criteria, true);
		if (provider == null) {
			retVal.putBoolean("error", true);
			retVal.putString("data", "no location provider available");
			callback.invoke(retVal);
			return;
		}

		android.location.Location location = locationManager.getLastKnownLocation(provider);
		if (location == null) {
			retVal.putBoolean("error", true);
			retVal.putString("data", "no location available");
			callback.invoke(retVal);
			return;
		}

		WritableMap dataVal = Arguments.createMap();
		dataVal.putDouble("latitude", location.getLatitude());
		dataVal.putDouble("longitude", location.getLongitude());
		retVal.putBoolean("error", false);
		retVal.putMap("data", dataVal);
		callback.invoke(retVal);
	}

	@ReactMethod
	public void forceClearActiveRegion() {
		// Forces not being in an ibeacon region (not needed for android as far as I know)
        BleLog.getInstance().LOGi(TAG, "forceClearActiveRegion");
	}


    //########################################################################################
    //                       LOGGING FUNCTIONS
    //########################################################################################

	@ReactMethod
	public void enableLoggingToFile(boolean enable) {
		BleLog.getInstance().LOGi(TAG, "enableLoggingToFile " + enable);
		_fileLogger.enable(enable);
	}

	@ReactMethod
	public void enableExtendedLogging(boolean enable) {
		BleLog.getInstance().LOGi(TAG, "enableExtendedLogging " + enable);
		if (enable) {
			setLogLevels(LOG_LEVELS_EXTENDED);
		}
		else {
			setLogLevels(LOG_LEVELS);
		}
	}

	@ReactMethod
	public void clearLogs() {
		BleLog.getInstance().LOGi(TAG, "clearLogs");
		_fileLogger.enable(false);
		_fileLogger.clearLogFiles();
	}


	//########################################################################################
	//                       START / STOP SCANNING
	//########################################################################################

	@ReactMethod
	public void startScanning() {
		BleLog.getInstance().LOGi(TAG, "startScanning");
		setScannerState(ScannerState.HIGH_POWER);
		_deviceFilter = BleDeviceFilter.all;
		updateScanner();
	}

	@ReactMethod
	public void startScanningForCrownstones() {
		BleLog.getInstance().LOGi(TAG, "startScanningForCrownstones");
		setScannerState(ScannerState.HIGH_POWER);
		_deviceFilter = BleDeviceFilter.anyStone;
		updateScanner();
	}

	@ReactMethod
	public void startScanningForCrownstonesUniqueOnly() {
		// Low power scanning!
		// Only emit an event when the data changed
		BleLog.getInstance().LOGi(TAG, "startScanningForCrownstonesUniqueOnly");
		_scannedDeviceMap.clear();
		setScannerState(ScannerState.UNIQUE_ONLY);
		_deviceFilter = BleDeviceFilter.anyStone;
		updateScanner();
	}

	@ReactMethod
	public void stopScanning() {
		BleLog.getInstance().LOGi(TAG, "stopScanning");
		setScannerState(ScannerState.DISABLED);
		updateScanner();
	}


	//########################################################################################
	//                       CONNECT / DISCONNECT
	//########################################################################################

	@ReactMethod
	public void connect(final String uuid, final Callback callback) {
		int rssi = 0;
		if (getBleExt() != null) {
			BleDevice dev = getBleExt().getDeviceMap().get(uuid);
			if (dev != null) {
				rssi = dev.getAverageRssi();
			}
		}
		BleLog.getInstance().LOGd(TAG, "Connect to " + uuid + " rssi: " + rssi);
		if (_isTraingingLocalization) {
			BleLog.getInstance().LOGw(TAG, "Connecting while training localization is bad");
		}
		if (!checkBleExt(callback)) {
			return;
		}
		_connectCallbackInvoked = false;
//		_bleExt.connectDevice(uuid, 3, new IDataCallback() {
//			@Override
//			public void onData(JSONObject json) {
//
//			}
//
//			@Override
//			public void onError(int error) {
//
//			}
//		});
		getBleExt().connectAndDiscover(uuid, new IDiscoveryCallback() {
			@Override
			public void onDiscovery(String serviceUuid, String characteristicUuid) {

			}

			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "connected to " + uuid);
				_numConsecutiveConnectFailures = 0;
				if (!_connectCallbackInvoked) {
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					_connectCallbackInvoked = true;
					callback.invoke(retVal);
				}
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGe(TAG, "connection error to " + uuid + " error: " + error);
				if (!_isResettingBluetooth) {
					_numConsecutiveConnectFailures += 1;
				}
				if (!_connectCallbackInvoked) {
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "failed to connect: " + error);
					_connectCallbackInvoked = true;
					callback.invoke(retVal);

					switch (error) {
//						case 8: // Connection timeout
						case 257:
							resetBluetooth();
							break;
					}
				}
				if (_numConsecutiveConnectFailures > NUM_CONNECT_FAILS_FOR_RESET_BLE) {
					_numConsecutiveConnectFailures = 0;
					resetBluetooth();
				}
			}
		});
	}

	@ReactMethod
	public void disconnectCommand(final Callback callback) {
		// Command the crownstone to disconnect the phone
		BleLog.getInstance().LOGd(TAG, "Disconnect command");

/*
		// [12.11.16] Note: do not use writeDisconnectCommand, that will just lead to errors if the connection
		//  is closed before the command succeeds
		// [04.05.2017] On some phones, the connection stays open for some reason... (even though disconnect and connect events come in)
		// [09.05.2017] A bug in the firmware (up to 1.3.1) makes the device crash with this command, so for now, just use disconnect.
		_bleExt.writeDisconnectCommand(new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "disconnect command success");
//				WritableMap retVal = Arguments.createMap();
//				retVal.putBoolean("error", false);
//				callback.invoke(retVal);
				// Also disconnect, to be extra sure?
//				// With small delay, otherwise the crownstone may get confused?
//				_handler.postDelayed(new Runnable() {
//					@Override
//					public void run() {
						phoneDisconnect(callback);
//					}
//				}, 200);
			}

			@Override
			public void onError(int error) {
				switch (error) {
					// Regard errors about being disconnected as success
					case BleErrors.ERROR_NEVER_CONNECTED:
					case BleErrors.ERROR_NOT_CONNECTED: {
						BleLog.getInstance().LOGd(TAG, "disconnect command success (already disconnected)");
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", false);
						callback.invoke(retVal);
						return;
					}
				}
				BleLog.getInstance().LOGd(TAG, "disconnect command error: " + error);
//				WritableMap retVal = Arguments.createMap();
//				retVal.putBoolean("error", true);
//				retVal.putString("data", "failed to disconnect: " + error);
//				callback.invoke(retVal);
				// Try to disconnect from our side instead.
				phoneDisconnect(callback);
			}
		});
*/

		// Just use disconnectAndClose instead of the command
		phoneDisconnect(callback);
	}

	@ReactMethod
	public void phoneDisconnect(final Callback callback) {
		// Normal disconnect
		BleLog.getInstance().LOGd(TAG, "phoneDisconnect");
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().disconnectAndClose(false, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "disconnected");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGw(TAG, "failed to disconnect: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "failed to disconnect: " + error);
				callback.invoke(retVal);
			}
		});
	}


	//########################################################################################
	//                       SETUP / RESET / RECOVER
	//########################################################################################

	@ReactMethod
	public void commandFactoryReset(final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "commandFactoryReset");
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().refreshServices(new IStatusCallback() {
			@Override
			public void onSuccess() {
				getBleExt().writeFactoryReset(new IStatusCallback() {
					@Override
					public void onSuccess() {
						BleLog.getInstance().LOGi(TAG, "commandFactoryReset success");
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", false);
						callback.invoke(retVal);
					}

					@Override
					public void onError(int error) {
						BleLog.getInstance().LOGe(TAG, "commandFactoryReset error: " + error);
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", true);
						retVal.putString("data", "factory reset failed: " + error);
						callback.invoke(retVal);
					}
				});
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGe(TAG, "commandFactoryReset error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "factory reset failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void setupFactoryReset(Callback callback) {
		BleLog.getInstance().LOGi(TAG, "setupFactoryReset");
		commandFactoryReset(callback);
	}

	@ReactMethod
	public void recover(String address, final Callback callback) {
		// If stone is not in recovery mode, then return string "NOT_IN_RECOVERY_MODE" as error data.
		BleLog.getInstance().LOGi(TAG, "Recover: " + address);
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().recover(address, new IStatusCallback() {
			@Override
			public void onSuccess() {
				getBleExt().disconnectAndClose(true, new IStatusCallback() {
					@Override
					public void onSuccess() {
						BleLog.getInstance().LOGi(TAG, "recover success");
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", false);
						callback.invoke(retVal);
					}

					@Override
					public void onError(int error) {
						BleLog.getInstance().LOGi(TAG, "recover success");
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", false);
						callback.invoke(retVal);
					}
				});
			}

			@Override
			public void onError(final int error) {
				BleLog.getInstance().LOGe(TAG, "recover error "+ error);
//				BleLog.getInstance().LOGd(TAG, Log.getStackTraceString(new Exception()));

				final IStatusCallback disconnectCallBack = new IStatusCallback() {
					@Override
					public void onSuccess() {
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", true);
						if (error == BleErrors.ERROR_NOT_IN_RECOVERY_MODE) {
							retVal.putString("data", "NOT_IN_RECOVERY_MODE");
						}
						else {
							retVal.putString("data", "recover failed: " + error);
						}
						callback.invoke(retVal);
					}

					@Override
					public void onError(int error) {
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", true);
						if (error == BleErrors.ERROR_NOT_IN_RECOVERY_MODE) {
							retVal.putString("data", "NOT_IN_RECOVERY_MODE");
						}
						else {
							retVal.putString("data", "recover failed: " + error);
						}
						callback.invoke(retVal);
					}
				};

				getBleExt().disconnectAndClose(true, disconnectCallBack);
			}
		});
	}

	@ReactMethod
	public void setupCrownstone(ReadableMap config, final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "setup crownstone");
		// Emit events "setupProgress" to show the progress
		// keys can be either in plain string or hex string format, check length to determine which

		// Data:
		// int crownstoneId
		// string adminKey
		// string  memberKey
		// string  guestKey
		// int or hexString  meshAccessAddress
		// string ibeaconUUID
		// int ibeaconMajor
		// int ibeaconMinor

		if (!checkBleExt(callback)) {
			return;
		}
		final WritableMap retVal = Arguments.createMap();

		int crownstoneId;
		String adminKey;
		String memberKey;
		String guestKey;
		String iBeaconUuid;
		int iBeaconMajor;
		int iBeaconMinor;
		int meshAccessAddress = 0;

		try {
			crownstoneId = config.getInt("crownstoneId");
			adminKey = config.getString("adminKey");
			memberKey = config.getString("memberKey");
			guestKey = config.getString("guestKey");
			iBeaconUuid = config.getString("ibeaconUUID");
			iBeaconMajor = config.getInt("ibeaconMajor");
			iBeaconMinor = config.getInt("ibeaconMinor");
			String meshAccessAddressStr = config.getString("meshAccessAddress");
			byte[] meshAccessAddressBytes = BleUtils.hexStringToBytes(meshAccessAddressStr);
			if (meshAccessAddressBytes.length != 4) {
				retVal.putString("data", "invalid meshAccessAddress");
			}
			else {
				meshAccessAddress = BleUtils.byteArrayToInt(meshAccessAddressBytes);
			}
		} catch (NoSuchKeyException | UnexpectedNativeTypeException e) {
			String errStr = "wrong setup arguments: " + config.toString();
			BleLog.getInstance().LOGw(TAG, errStr);
			retVal.putBoolean("error", true);
			retVal.putString("data", errStr);
			callback.invoke(retVal);
			return;
		}

//		long meshAccessAddress = -1;
//		try {
//			String meshAccessAddressStr = config.getString("meshAccessAddress");
//			byte[] meshAccessAddressBytes = BleUtils.hexStringToBytes(meshAccessAddressStr);
//			if (meshAccessAddressBytes.length == 4) {
//				meshAccessAddress = BleUtils.byteArrayToInt(meshAccessAddressBytes);
//			}
//		} catch (UnexpectedNativeTypeException eStr) {
//			try {
//				meshAccessAddress = config.getInt("meshAccessAddress");
//			} catch (UnexpectedNativeTypeException eInt) {
//			}
//		}

		BleLog.getInstance().LOGv(TAG, "cs id=%d, keys=[%s %s %s], meshaddr=%d, ibeacon=[%s %d %d]", crownstoneId, adminKey, memberKey, guestKey, meshAccessAddress, iBeaconUuid, iBeaconMajor, iBeaconMinor);

		// Verify the values
		if (crownstoneId < 0 || crownstoneId > 0xFFFF) {
			retVal.putString("data", "invalid crownstoneId");
		}

		adminKey = getKeyFromString(adminKey);
		if (adminKey == null) {
			retVal.putString("data", "invalid adminKey");
		}
		memberKey = getKeyFromString(memberKey);
		if (memberKey == null) {
			retVal.putString("data", "invalid memberKey");
		}
		guestKey = getKeyFromString(guestKey);
		if (guestKey == null) {
			retVal.putString("data", "invalid guestKey");
		}

		// TODO: use a better check? maybe turn it into a UUID?
		if (iBeaconUuid.length() != 36) {
			retVal.putString("data", "invalid iBeaconUuid");
		}

		if (iBeaconMajor < 0 || iBeaconMajor > 0xFFFF) {
			retVal.putString("data", "invalid iBeaconMajor");
		}

		if (iBeaconMinor < 0 || iBeaconMinor > 0xFFFF) {
			retVal.putString("data", "invalid iBeaconMinor");
		}

		if (retVal.hasKey("data")) {
			BleLog.getInstance().LOGw(TAG, "Wrong setup data: " + config.toString());
			retVal.putBoolean("error", true);
			callback.invoke(retVal);
			return;
		}

		final int crownstoneIdFinal = crownstoneId;
		final String adminKeyFinal = adminKey;
		final String memberKeyFinal = memberKey;
		final String guestKeyFinal = guestKey;
		final String iBeaconUuidFinal = iBeaconUuid;
		final int iBeaconMajorFinal = iBeaconMajor;
		final int iBeaconMinorFinal = iBeaconMinor;
		final int meshAccessAddressFinal = meshAccessAddress;
		// Refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
		// Not sure if this is helpful, as it would've gone wrong already on connect (when session nonce is read in normal mode)
		getBleExt().refreshServices(new IStatusCallback() {
			@Override
			public void onSuccess() {
				CrownstoneSetup crownstoneSetup = new CrownstoneSetup(getBleExt());
				crownstoneSetup.executeSetup(crownstoneIdFinal, adminKeyFinal, memberKeyFinal, guestKeyFinal, meshAccessAddressFinal, iBeaconUuidFinal, iBeaconMajorFinal, iBeaconMinorFinal, new IProgressCallback() {
					@Override
					public void onProgress(double progress, @Nullable JSONObject statusJson) {
						sendEvent("setupProgress", (int) progress);
					}

					@Override
					public void onError(int error) {
						// Already fires status callback onError
						BleLog.getInstance().LOGd(TAG, "Setup progress error: " + error);
					}
				}, new IStatusCallback() {
					@Override
					public void onSuccess() {
						BleLog.getInstance().LOGd(TAG, "Setup success");
						retVal.putBoolean("error", false);
						callback.invoke(retVal);
					}

					@Override
					public void onError(int error) {
						BleLog.getInstance().LOGw(TAG, "Setup error: " + error);
						retVal.putBoolean("error", true);
						retVal.putString("data", "setup error: " + error);
						callback.invoke(retVal);
					}
				});
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGw(TAG, "Refresh services: " + error);
				retVal.putBoolean("error", true);
				retVal.putString("data", "refresh services error: " + error);
				callback.invoke(retVal);
			}
		});

	}

	@ReactMethod
	public void bootloaderToNormalMode(final String address, final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "bootloaderToNormalMode: " + address);
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().resetBootloader(address, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "Error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void restartCrownstone(final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "restartCrownstone");
		// Reboots the crownstone, already connected
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().resetDevice(new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "Error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void putInDFU(final Callback callback) {
		// Puts the crownstone in DFU mode
		BleLog.getInstance().LOGi(TAG, "putInDFU");
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().resetToBootloader(new IStatusCallback() {
			@Override
			public void onSuccess() {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void setupPutInDFU(Callback callback) {
		// Puts the crownstone in DFU mode, while it's in setup mode.
		putInDFU(callback);
	}

	//########################################################################################
	//                       DFU
	//########################################################################################

	@ReactMethod
	public void performDFU(String address, String fileString, final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "performDfu: " + address + " file: " + fileString);
		if (!checkBleExt(callback)) {
			return;
		}
		if (_dfuCallback != null) {
			BleLog.getInstance().LOGw(TAG, "previous callback was not called");
		}
		_dfuCallback = callback;

		String name = "unknown";
		BleDevice dev = getBleExt().getDeviceMap().get(address);
		if (dev != null) {
			name = dev.getName();
		}
		startDfu(address, name, fileString);
//		WritableMap retVal = Arguments.createMap();
//		retVal.putBoolean("error", true);
//		retVal.putString("data", "error: test");
//		_dfuCallback.invoke(retVal);
//		_dfuCallback = null;
	}


	//########################################################################################
	//                       MISC COMMANDS
	//########################################################################################

	@ReactMethod
	public void getMACAddress(final Callback callback) {
		BleLog.getInstance().LOGd(TAG, "getMacAddress");
		if (!checkBleExt(callback)) {
			return;
		}
		if (getBleExt().isConnected(null)) {
			// Refresh services, because there is a good chance that this crownstone was just factory reset / recovered.
			getBleExt().refreshServices(new IStatusCallback() {
				@Override
				public void onSuccess() {
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					retVal.putString("data", getBleExt().getTargetAddress());
					callback.invoke(retVal);
				}
				@Override
				public void onError(int error) {
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "not connected");
					callback.invoke(retVal);
				}
			});
		}
		else {
			WritableMap retVal = Arguments.createMap();
			retVal.putBoolean("error", true);
			retVal.putString("data", "not connected");
			callback.invoke(retVal);
		}
	}

	@ReactMethod
	public void sendNoOp(final Callback callback) {
		BleLog.getInstance().LOGd(TAG, "sendNoOp");
		if (!checkBleExt(callback)) {
			return;
		}
		byte[] arr = {};
		ControlMsg controlMsg = new ControlMsg(BluenetConfig.CMD_NOP, arr.length, arr);
		getBleExt().writeControl(controlMsg, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void sendMeshNoOp(final Callback callback) {
		BleLog.getInstance().LOGd(TAG, "sendMeshNoOp");
		if (!checkBleExt(callback)) {
			return;
		}
		byte[] arr = {};
		ControlMsg controlMsgPayload = new ControlMsg(BluenetConfig.CMD_NOP, arr.length, arr);
		MeshControlPacket meshControlPacket = new MeshControlPacket(controlMsgPayload, 0);
		byte[] payload = meshControlPacket.toArray();
		ControlMsg controlMsg = new ControlMsg(BluenetConfig.CMD_MESH_COMMAND, payload.length, payload);
		getBleExt().writeControl(controlMsg, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	//########################################################################################
	//                       SWITCH COMMANDS
	//########################################################################################

	@ReactMethod
	public void getSwitchState(final Callback callback) {
		BleLog.getInstance().LOGd(TAG, "getSwitchState");
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().readSwitch(new IIntegerCallback() {
			@Override
			public void onSuccess(int result) {
				BleLog.getInstance().LOGi(TAG, "get switch success: " + result);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				retVal.putDouble("data", convertSwitchVal(result));
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "get switch failed: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "get switch failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void setSwitchState(Float switchStateFloat, final Callback callback) {
		BleLog.getInstance().LOGd(TAG, "set switch to: " + switchStateFloat);
		if (!checkBleExt(callback)) {
			return;
		}
		int switchState = convertSwitchVal(switchStateFloat);
		getBleExt().writeSwitch(switchState, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "set switch success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "set switch failed: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "set switch failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void toggleSwitchState(final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "toggleSwitchState");
		if (!checkBleExt(callback)) {
			return;
		}
		// For now: just toggle relay
		getBleExt().toggleRelay(new IBooleanCallback() {
			@Override
			public void onSuccess(boolean value) {
				String switchRes = value ? "on" : "off";
				BleLog.getInstance().LOGi(TAG, "toggled switch " + switchRes);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "toggle switch failed: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "toggle switch failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void multiSwitch(final ReadableArray switchItems, final Callback callback) {
		// switchItems = [{crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }, {}, ...]
		BleLog.getInstance().LOGi(TAG, "multiSwitch " + switchItems.toString());
		if (!checkBleExt(callback)) {
			return;
		}

		// Create the multi switch packet
		MeshMultiSwitchListPacket listPacket = new MeshMultiSwitchListPacket();

		boolean success = true;
		for (int i=0; i<switchItems.size(); i++) {
			ReadableMap itemMap = switchItems.getMap(i);
			int crownstoneId =         itemMap.getInt("crownstoneId");
			int timeout =              itemMap.getInt("timeout");
			int intent =               itemMap.getInt("intent");
			double switchStateDouble = itemMap.getDouble("state");
			int switchState = convertSwitchVal(switchStateDouble);
			if (!listPacket.addItem(crownstoneId, switchState, timeout, intent)) {
				success = false;
				BleLog.getInstance().LOGe(TAG, "Unable to add multiSwitch item: " + itemMap);
				break;
			}
		}
		if (!success) {
			BleLog.getInstance().LOGe(TAG, "Failed to send multiSwitch: " + switchItems);
			WritableMap retVal = Arguments.createMap();
			retVal.putBoolean("error", true);
			retVal.putString("data", "Invalid multiSwitch data");
			callback.invoke(retVal);
			return;
		}

		MeshMultiSwitchPacket packet = new MeshMultiSwitchPacket();
		packet.setPayload(listPacket);
		byte[] payload = packet.toArray();
		getBleExt().writeControl(new ControlMsg(BluenetConfig.CMD_MULTI_SWITCH, payload.length, payload), new IStatusCallback() {
			@Override
			public void onSuccess() {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "multiSwitch failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	private int convertSwitchVal(double switchVal) {
		int switchValInt = 0;
		if (switchVal >= 1.0) {
			switchValInt = BluenetConfig.SWITCH_ON;
		}
		else if (switchVal > 0) {
			switchValInt = (int) Math.round(switchVal * BluenetConfig.SWITCH_ON);
		}

		return switchValInt;
	}

	/** Convert switch value to 0.0 .. 1.0 value.
	 *
	 * @param switchVal      Integer value.
	 * @return               Converted value.
	 */
	private double convertSwitchVal(int switchVal) {
		return (double)switchVal / BluenetConfig.SWITCH_ON;
	}

	/** Converts switch state to 0.0 .. 1.0 value.
	 *
	 * @param switchState    Combined dimmer and relay state.
	 * @return               Converted value.
	 */
	private double convertSwitchState(int switchState) {
		if (switchState > BluenetConfig.SWITCH_ON) {
			switchState = BluenetConfig.SWITCH_ON;
		}
		return (double)switchState / BluenetConfig.SWITCH_ON;

	}


	//########################################################################################
	//                       VERSION COMMANDS
	//########################################################################################

	@ReactMethod
	public void getFirmwareVersion(final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "getFirmwareVersion");
		// Returns firmware version string as data
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().readFirmwareRevision(new IByteArrayCallback() {
			@Override
			public void onSuccess(byte[] result) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				String firmwareString = new String(result);
				retVal.putString("data", firmwareString);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void getHardwareVersion(final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "getHardwareVersion");
		// Returns hardware version string as data
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().readHardwareRevision(new IByteArrayCallback() {
			@Override
			public void onSuccess(byte[] result) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				String hardwareString = new String(result);
				retVal.putString("data", hardwareString);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void getBootloaderVersion(final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "getBootloaderVersion");
		// Returns bootloader version string as data
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().readBootloaderRevision(new IByteArrayCallback() {
			@Override
			public void onSuccess(byte[] result) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				String bootloaderString = new String(result);
				retVal.putString("data", bootloaderString);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}


	//########################################################################################
	//                       ERROR COMMANDS
	//########################################################################################

	@ReactMethod
	public void getErrors(final Callback callback) {
		// Gets the state errors of the crownstone
		// Assume already connected
		// returns as data field, a map: { overCurrent: boolean, overCurrentDimmer: boolean, temperatureChip: boolean, temperatureDimmer: boolean, bitMask: uint32 }
		BleLog.getInstance().LOGi(TAG, "getErrors");
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().getBleExtState().getErrorState(new IIntegerCallback() {
			@Override
			public void onSuccess(int result) {
				BleLog.getInstance().LOGd(TAG, "Success: " + Integer.toBinaryString(result));
				WritableMap stateErrorMap = Arguments.createMap();
				stateErrorMap.putBoolean("overCurrent",       BleExtState.isErrorOvercurrent(result));
                stateErrorMap.putBoolean("overCurrentDimmer", BleExtState.isErrorOvercurrentDimmer(result));
                stateErrorMap.putBoolean("temperatureChip",   BleExtState.isErrorChipTemperature(result));
                stateErrorMap.putBoolean("temperatureDimmer", BleExtState.isErrorDimmberTemperature(result));
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				retVal.putMap("data", stateErrorMap);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void clearErrors(ReadableMap clearErrorsMap, final Callback callback) {
		// Clears given state errors
		// Assume already connected
		BleLog.getInstance().LOGi(TAG, "clearErrors: " + clearErrorsMap.toString());
		if (!checkBleExt(callback)) {
			return;
		}
        int stateErrorBitmask = 0;
		if (clearErrorsMap.getBoolean("overCurrent"))       { stateErrorBitmask = BleExtState.setStateErrorBit(BluenetConfig.STATE_ERROR_POS_OVERCURRENT, stateErrorBitmask); }
		if (clearErrorsMap.getBoolean("overCurrentDimmer")) { stateErrorBitmask = BleExtState.setStateErrorBit(BluenetConfig.STATE_ERROR_POS_OVERCURRENT_DIMMER, stateErrorBitmask); }
		if (clearErrorsMap.getBoolean("temperatureChip"))   { stateErrorBitmask = BleExtState.setStateErrorBit(BluenetConfig.STATE_ERROR_POS_TEMP_CHIP, stateErrorBitmask); }
		if (clearErrorsMap.getBoolean("temperatureDimmer")) { stateErrorBitmask = BleExtState.setStateErrorBit(BluenetConfig.STATE_ERROR_POS_TEMP_DIMMER, stateErrorBitmask); }
		if (clearErrorsMap.getBoolean("dimmerOnFailure"))   { stateErrorBitmask = BleExtState.setStateErrorBit(BluenetConfig.STATE_ERROR_POS_DIMMER_ON_FAILURE, stateErrorBitmask); }
		if (clearErrorsMap.getBoolean("dimmerOffFailure"))  { stateErrorBitmask = BleExtState.setStateErrorBit(BluenetConfig.STATE_ERROR_POS_DIMMER_OFF_FAILURE, stateErrorBitmask); }
		getBleExt().writeResetStateErrors(stateErrorBitmask, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}


	//########################################################################################
	//                       CONFIG COMMANDS
	//########################################################################################

	@ReactMethod
	public void lockSwitch(boolean enable, final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "lockSwitch: " + enable);
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().writeSwitchLock(enable, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void allowDimming(boolean enable, final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "allowDimming: " + enable);
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().writeAllowDimming(enable, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void setSwitchCraft(boolean enable, final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "setSwitchCraft: " + enable);
		if (!checkBleExt(callback)) {
			return;
		}
		byte[] arr = {(byte)(enable?1:0)};
		ControlMsg controlMsg = new ControlMsg(BluenetConfig.CMD_ENABLE_SWITCHCRAFT, arr.length, arr);
		getBleExt().writeControl(controlMsg, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}


	//########################################################################################
	//                       TIME COMMANDS
	//########################################################################################

	@ReactMethod
	public void setTime(double timestampDouble, final Callback callback) {
		// Sets the unix time on the crownstone
		// Assume already connected
		BleLog.getInstance().LOGi(TAG, "setTime: " + timestampDouble);
		if (!checkBleExt(callback)) {
			return;
		}
		long timestamp = (long)timestampDouble;
		getBleExt().writeSetTime(timestamp, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void meshSetTime(double timestampDouble, final Callback callback) {
		// Sets the unix time on the crownstone
		// Assume already connected
		BleLog.getInstance().LOGi(TAG, "meshSetTime: " + timestampDouble);
		if (!checkBleExt(callback)) {
			return;
		}
		long timestamp = (long)timestampDouble;
		byte[] arr = BleUtils.uint32ToByteArray(timestamp);
		ControlMsg controlMsgPayload = new ControlMsg(BluenetConfig.CMD_SET_TIME, arr.length, arr);
		MeshControlPacket meshControlPacket = new MeshControlPacket(controlMsgPayload);
		byte[] payload = meshControlPacket.toArray();
		ControlMsg controlMsg = new ControlMsg(BluenetConfig.CMD_MESH_COMMAND, payload.length, payload);
		getBleExt().writeControl(controlMsg, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "Success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void getTime(final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "getTime");
		// Gets the current unix time from the crownstone
		// Assume already connected
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().getBleExtState().getTime(new IIntegerCallback() {
			@Override
			public void onSuccess(int result) {
				BleLog.getInstance().LOGd(TAG, "Success");
				long unixTime = BleUtils.toUint32(result);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				retVal.putDouble("data", unixTime); // TODO: is double our best option here?
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGd(TAG, "error: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "error: " + error);
				callback.invoke(retVal);
			}
		});
	}


	//########################################################################################
	//                       SCHEDULE COMMANDS
	//########################################################################################

	@ReactMethod
	public void addSchedule(final ReadableMap scheduleEntryMap, final Callback callback) {
		// Adds a new entry to the schedule on an empty spot.
		// If no empty spots: fails
        BleLog.getInstance().LOGi(TAG, "addSchedule: " + scheduleEntryMap.toString());
		if (!checkBleExt(callback)) {
			return;
		}
		final ScheduleEntryPacket entryPacket = parseScheduleEntryMap(scheduleEntryMap);
		if (entryPacket == null) {
			WritableMap retVal = Arguments.createMap();
			retVal.putBoolean("error", true);
			retVal.putString("data", "failed to parse schedule entry");
			callback.invoke(retVal);
			return;
		}

		getAvailableScheduleEntryIndex(new IIntegerCallback() {
			@Override
			public void onSuccess(final int result) {
				ScheduleCommandPacket packet = new ScheduleCommandPacket();
				packet._index = result;
				packet._entry = entryPacket;
				setScheduleEntry(packet, new IStatusCallback() {
					@Override
					public void onSuccess() {
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", false);
						retVal.putInt("data", result);
						callback.invoke(retVal);
					}

					@Override
					public void onError(int error) {
						WritableMap retVal = Arguments.createMap();
						retVal.putBoolean("error", true);
						retVal.putString("data", "failed to set schedule: " + error);
						callback.invoke(retVal);
					}
				});
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "getAvailableScheduleEntryIndex failed: " + error);
				callback.invoke(retVal);
			}
		});

	}

	@ReactMethod
	public void setSchedule(ReadableMap scheduleEntryMap, final Callback callback) {
		// Overwrites a schedule entry at given index.
        BleLog.getInstance().LOGi(TAG, "setSchedule: " + scheduleEntryMap.toString());
		if (!checkBleExt(callback)) {
			return;
		}
		ScheduleEntryPacket entryPacket = parseScheduleEntryMap(scheduleEntryMap);
		if (entryPacket == null || !scheduleEntryMap.hasKey("scheduleEntryIndex")) {
			WritableMap retVal = Arguments.createMap();
			retVal.putBoolean("error", true);
			retVal.putString("data", "failed to parse schedule entry");
			callback.invoke(retVal);
			return;
		}
		ScheduleCommandPacket packet = new ScheduleCommandPacket();
		packet._index = scheduleEntryMap.getInt("scheduleEntryIndex");
		packet._entry = entryPacket;
		setScheduleEntry(packet, new IStatusCallback() {
			@Override
			public void onSuccess() {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "failed to set schedule: " + error);
				callback.invoke(retVal);
			}
		});

	}

	@ReactMethod
	public void clearSchedule(int scheduleEntryIndex, final Callback callback) {
		// Clears the schedule entry at given index.
        BleLog.getInstance().LOGi(TAG, "clearSchedule: " + scheduleEntryIndex);
		if (!checkBleExt(callback)) {
			return;
		}
		clearScheduleEntry(scheduleEntryIndex, new IStatusCallback() {
			@Override
			public void onSuccess() {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "failed to clear schedule: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void getAvailableScheduleEntryIndex(final Callback callback) {
		// Returns an empty spot in the schedule list.
        BleLog.getInstance().LOGi(TAG, "getAvailableScheduleEntryIndex");
		if (!checkBleExt(callback)) {
			return;
		}
		getAvailableScheduleEntryIndex(new IIntegerCallback() {
			@Override
			public void onSuccess(int result) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				retVal.putInt("data", result);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "getAvailableScheduleEntryIndex failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void getSchedules(final Callback callback) {
        // Returns an array of schedule entry maps.
        BleLog.getInstance().LOGi(TAG, "getSchedules");
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().getBleExtState().getSchedule(new IByteArrayCallback() {
			@Override
			public void onSuccess(byte[] result) {
				ScheduleListPacket schedule = new ScheduleListPacket();
				if (!schedule.fromArray(result)) {
					BleLog.getInstance().LOGw(TAG, "getSchedules parse error");
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "getSchedules parse error");
					callback.invoke(retVal);
					return;
				}
				WritableArray scheduleArray = Arguments.createArray();
				int size = schedule.getSize();
				for (int i=0; i<size; ++i) {
					if (!schedule.getEntry(i).isActive()) {
						continue;
					}
					WritableMap entryMap = exportScheduleEntryMap(schedule.getEntry(i));
					if (entryMap == null) {
						continue;
					}
					entryMap.putInt("scheduleEntryIndex", i);
					scheduleArray.pushMap(entryMap);
				}
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				retVal.putArray("data", scheduleArray);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "getSchedules error "+ error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "getSchedules failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	private void getAvailableScheduleEntryIndex(final IIntegerCallback callback) {
		getBleExt().getBleExtState().getSchedule(new IByteArrayCallback() {
			@Override
			public void onSuccess(byte[] result) {
				ScheduleListPacket schedule = new ScheduleListPacket();
				if (!schedule.fromArray(result)) {
					BleLog.getInstance().LOGw(TAG, "getAvailableScheduleEntryIndex parse error: " + BleUtils.bytesToString(result));
					callback.onError(BleErrors.ERROR_MSG_PARSING);
					return;
				}
				int size = schedule.getSize();
				for (int i=0; i<size; ++i) {
					if (!schedule.getEntry(i).isActive()) {
						BleLog.getInstance().LOGi(TAG, "getAvailableScheduleEntryIndex success");
						BleLog.getInstance().LOGd(TAG, "found: " + schedule.getEntry(i).toString());
						callback.onSuccess(i);
						return;
					}
				}
				BleLog.getInstance().LOGi(TAG, "getAvailableScheduleEntryIndex no empty spot found: ");
				BleLog.getInstance().LOGi(TAG, "bytes: " + BleUtils.bytesToString(result));
				BleLog.getInstance().LOGi(TAG, schedule.toString());
				callback.onError(BleErrors.ERROR_FULL);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "getAvailableScheduleEntryIndex error "+ error);
				callback.onError(error);
			}
		});
	}

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

	/**
	 * Parses a schedule entry map and returns it as schedule entry packet.
	 * @param map the map.
	 * @return the packet, or null when parsing failed.
	 */
	private ScheduleEntryPacket parseScheduleEntryMap(ReadableMap map) {
		ScheduleEntryPacket packet = new ScheduleEntryPacket();
		try {
			packet._overrideMask = 0;
			boolean ignoreLocationTriggers     = map.getBoolean("ignoreLocationTriggers");
			if (ignoreLocationTriggers) {
				packet._overrideMask |= (1 << ScheduleEntryPacket.OVERRIDE_BIT_POS_LOCATION);
			}

			packet._timestamp    = (long)map.getDouble("nextTime");

			packet._dayOfWeekMask = 0;
			packet._minutes = 0;
			String repeatType                   = map.getString("repeatMode");
			switch (repeatType) {
			case "24h": {
				packet._repeatType = ScheduleEntryPacket.REPEAT_DAY;
				if (map.getBoolean("activeSunday")) {
					packet.setWeekdayBit(ScheduleEntryPacket.WEEKDAY_BIT_POS_SUNDAY);
				}
				if (map.getBoolean("activeMonday")) {
					packet.setWeekdayBit(ScheduleEntryPacket.WEEKDAY_BIT_POS_MONDAY);
				}
				if (map.getBoolean("activeTuesday")) {
					packet.setWeekdayBit(ScheduleEntryPacket.WEEKDAY_BIT_POS_TUESDAY);
				}
				if (map.getBoolean("activeWednesday")) {
					packet.setWeekdayBit(ScheduleEntryPacket.WEEKDAY_BIT_POS_WEDNESDAY);
				}
				if (map.getBoolean("activeThursday")) {
					packet.setWeekdayBit(ScheduleEntryPacket.WEEKDAY_BIT_POS_THURSDAY);
				}
				if (map.getBoolean("activeFriday")) {
					packet.setWeekdayBit(ScheduleEntryPacket.WEEKDAY_BIT_POS_FRIDAY);
				}
				if (map.getBoolean("activeSaturday")) {
					packet.setWeekdayBit(ScheduleEntryPacket.WEEKDAY_BIT_POS_SATURDAY);
				}
				break;
			}
			case "minute": {
				packet._repeatType = ScheduleEntryPacket.REPEAT_MINUTES;
				packet._minutes    = map.getInt("intervalInMinutes");
				break;
			}
			case "none": {
				packet._repeatType = ScheduleEntryPacket.REPEAT_ONCE;
				break;
			}
			default:
				BleLog.getInstance().LOGw(TAG, "Unknown repeat type");
				return null;
			}

			double switchStateFloat = map.getDouble("switchState");
			int switchState = convertSwitchVal(switchStateFloat);
			packet._switchVal    = switchState;
			packet._fadeDuration = map.getInt("fadeDuration");
			if (packet._fadeDuration > 0) {
				packet._actionType = ScheduleEntryPacket.ACTION_FADE;
			}
			else {
				packet._actionType = ScheduleEntryPacket.ACTION_SWITCH;
			}
		}
		catch (NoSuchKeyException | UnexpectedNativeTypeException e) {
			BleLog.getInstance().LOGw(TAG, "Wrong schedule entry: " + map.toString());
			return null;
		}
		if (!packet.isValidPacketToSet()) {
			return null;
		}
		return packet;
	}

	/**
	 * Exports a ScheduleEntryPacket to a schedule entry map.
	 * @param packet the packet.
	 * @return the map, or null when inactive or when parsing failed.
	 */
	private WritableMap exportScheduleEntryMap(ScheduleEntryPacket packet) {
		if (!packet.isActive()) {
			return null;
		}
		WritableMap map = Arguments.createMap();
		map.putBoolean("active", true);
		map.putDouble("nextTime", packet._timestamp);
		map.putBoolean("ignoreLocationTriggers",  packet.isIgnoreBitSet(ScheduleEntryPacket.OVERRIDE_BIT_POS_LOCATION));

		// Repeat type
		// Always fill all values with something.
		map.putInt("intervalInMinutes", 0);
		map.putBoolean("activeSunday",    false);
		map.putBoolean("activeMonday",    false);
		map.putBoolean("activeTuesday",   false);
		map.putBoolean("activeWednesday", false);
		map.putBoolean("activeThursday",  false);
		map.putBoolean("activeFriday",    false);
		map.putBoolean("activeSaturday",  false);
		switch (packet._repeatType) {
			case ScheduleEntryPacket.REPEAT_MINUTES: {
				map.putString("repeatMode", "minute");
				map.putInt("intervalInMinutes", packet._minutes);
				break;
			}
			case ScheduleEntryPacket.REPEAT_DAY: {
				map.putString("repeatMode", "24h");
				map.putBoolean("activeSunday",    packet.isWeekdayActive(ScheduleEntryPacket.WEEKDAY_BIT_POS_SUNDAY));
				map.putBoolean("activeMonday",    packet.isWeekdayActive(ScheduleEntryPacket.WEEKDAY_BIT_POS_MONDAY));
				map.putBoolean("activeTuesday",   packet.isWeekdayActive(ScheduleEntryPacket.WEEKDAY_BIT_POS_TUESDAY));
				map.putBoolean("activeWednesday", packet.isWeekdayActive(ScheduleEntryPacket.WEEKDAY_BIT_POS_WEDNESDAY));
				map.putBoolean("activeThursday",  packet.isWeekdayActive(ScheduleEntryPacket.WEEKDAY_BIT_POS_THURSDAY));
				map.putBoolean("activeFriday",    packet.isWeekdayActive(ScheduleEntryPacket.WEEKDAY_BIT_POS_FRIDAY));
				map.putBoolean("activeSaturday",  packet.isWeekdayActive(ScheduleEntryPacket.WEEKDAY_BIT_POS_SATURDAY));
				break;
			}
			case ScheduleEntryPacket.REPEAT_ONCE: {
				map.putString("repeatMode", "none");
				break;
			}
			default: {
				BleLog.getInstance().LOGe(TAG, "wrong schedule entry: " + packet.toString());
				return null;
			}
		}

		// Action type
		// Always fill all values with something invalid.
		map.putDouble("switchState", 0.0);
		map.putInt("fadeDuration", 0);
		switch (packet._actionType) {
			case ScheduleEntryPacket.ACTION_SWITCH: {
				map.putDouble("switchState", convertSwitchVal(packet._switchVal));
				break;
			}
			case ScheduleEntryPacket.ACTION_FADE: {
				map.putDouble("switchState", convertSwitchVal(packet._switchVal));
				map.putInt("fadeDuration", packet._fadeDuration);
				break;
			}
			case ScheduleEntryPacket.ACTION_TOGGLE: {
				break;
			}
			default: {
				return null;
			}
		}
		return map;
	}

	private void setScheduleEntry(ScheduleCommandPacket entry, final IStatusCallback callback) {
		byte[] bytes = entry.toArray();
		ControlMsg msg = new ControlMsg(BluenetConfig.CMD_SCHEDULE_ENTRY_SET, bytes.length, bytes);
		getBleExt().writeControl(msg, callback);
	}

	private void clearScheduleEntry(int index, final IStatusCallback callback) {
		byte[] bytes = new byte[] {(byte)index};
		ControlMsg msg = new ControlMsg(BluenetConfig.CMD_SCHEDULE_ENTRY_CLEAR, bytes.length, bytes);
		getBleExt().writeControl(msg, callback);
	}

	//########################################################################################
	//                       KEEPALIVE COMMANDS
	//########################################################################################

	@ReactMethod
	public void keepAlive(final Callback callback) {
		BleLog.getInstance().LOGd(TAG, "keepAlive");
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().writeKeepAlive(new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "keepAlive success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "keepAlive error "+ error);
				BleLog.getInstance().LOGi(TAG, Log.getStackTraceString(new Exception()));
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "keepAlive failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void keepAliveState(boolean action, float state, int timeout, final Callback callback) {
		BleLog.getInstance().LOGd(TAG, "keepAliveState: action=" + action + " state=" + state + " timeout=" + timeout);
		if (!checkBleExt(callback)) {
			return;
		}
		int actionInt = 0;
		if (action) {
			actionInt = 1;
		}
		int switchVal = convertSwitchVal(state);
		getBleExt().writeKeepAliveState(actionInt, switchVal, timeout, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGd(TAG, "keepAliveState success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "keepAliveState error "+ error);
//					BleLog.getInstance().LOGi(TAG, Log.getStackTraceString(new Exception()));
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "keepAliveState failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void meshKeepAlive(final Callback callback) {
		BleLog.getInstance().LOGd(TAG, "meshKeepAlive");
		if (!checkBleExt(callback)) {
			return;
		}
		getBleExt().writeControl(new ControlMsg(BluenetConfig.CMD_KEEP_ALIVE_MESH), new IStatusCallback() {
			@Override
			public void onSuccess() {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "meshKeepAlive failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void meshKeepAliveState(int timeout, ReadableArray keepAliveItems, final Callback callback) {
		// keepAliveItems = [{crownstoneId: number(uint16), action: Boolean, state: number(float) [ 0 .. 1 ]}, {}, ...]
		BleLog.getInstance().LOGd(TAG, "keepAliveState: " + keepAliveItems.toString());
		if (!checkBleExt(callback)) {
			return;
		}
		// Create new packet, fill it with keep alive items.
		MeshKeepAliveSameTimeoutPacket sameTimeoutPacket = new MeshKeepAliveSameTimeoutPacket();
		sameTimeoutPacket.setTimeout(timeout);

		boolean success = true;
		for (int i=0; i<keepAliveItems.size(); i++) {
			ReadableMap itemMap = keepAliveItems.getMap(i);
			int crownstoneId = itemMap.getInt("crownstoneId");
			int actionSwitchState = BluenetConfig.KEEP_ALIVE_NO_ACTION;
			if (itemMap.getBoolean("action")) {
				double switchValDouble = itemMap.getDouble("state");
				actionSwitchState = convertSwitchVal(switchValDouble);
			}
			if (!sameTimeoutPacket.addItem(crownstoneId, actionSwitchState)) {
				success = false;
				BleLog.getInstance().LOGe(TAG, "Unable to add keep alive item: " + itemMap);
				break;
			}
		}
		if (!success) {
			BleLog.getInstance().LOGe(TAG, "Failed to send mesh keep alive: " + keepAliveItems);
			WritableMap retVal = Arguments.createMap();
			retVal.putBoolean("error", true);
			retVal.putString("data", "Invalid meshKeepAliveState data");
			callback.invoke(retVal);
			return;
		}

		// Write a control msg with the packet as payload
		MeshKeepAlivePacket packet = new MeshKeepAlivePacket();
		packet.setPayload(sameTimeoutPacket);

		byte[] payload = packet.toArray();
		getBleExt().writeControl(new ControlMsg(BluenetConfig.CMD_KEEP_ALIVE_MESH, payload.length, payload), new IStatusCallback() {
			@Override
			public void onSuccess() {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "meshKeepAliveState failed: " + error);
				callback.invoke(retVal);
			}
		});
	}


	//########################################################################################
	//                       IBEACON TRACKING
	//########################################################################################

	@ReactMethod
	public void trackIBeacon(String ibeaconUUID, String sphereId) {
		// Add the uuid to the list of tracked iBeacons, associate it with given sphereId
		// Also starts the tracking
		BleLog.getInstance().LOGi(TAG, "trackIBeacon: " + ibeaconUUID + " sphereId=" + sphereId);
		if (!checkBleExt(null)) {
			return;
		}
		if (ibeaconUUID == null || sphereId == null) {
			BleLog.getInstance().LOGe(TAG, "invalid parameters");
			return;
		}
		UUID uuid = UUID.fromString(ibeaconUUID);
		_iBeaconSphereIds.put(uuid, sphereId);
		getIBeaconRanger().addIbeaconFilter(new BleIbeaconFilter(uuid, -1, -1));
		setTrackingState(true);
		_deviceFilter = BleDeviceFilter.anyStone;
		updateScanner();

		//TODO: send event?

	}

	@ReactMethod
	public void stopTrackingIBeacon(String ibeaconUUID) {
		// Remove the uuid from the list of tracked iBeacons
		BleLog.getInstance().LOGi(TAG, "stopTrackingIBeacon: " + ibeaconUUID);
		if (!checkBleExt(null)) {
			return;
		}
		UUID uuid = UUID.fromString(ibeaconUUID);
		getIBeaconRanger().remIbeaconFilter(new BleIbeaconFilter(uuid, -1, -1));
		_iBeaconSphereIds.remove(uuid);
	}

	@ReactMethod
	public void pauseTracking() {
		// Same as stopTracking, but keeps the list of tracked iBeacons.
		BleLog.getInstance().LOGi(TAG, "pauseTracking");
		setTrackingState(false);
		updateScanner();
	}

	@ReactMethod
	public void resumeTracking() {
		// Same as startTracking, but restore the stored list of tracked iBeacons.
		BleLog.getInstance().LOGi(TAG, "resumeTracking");
		setTrackingState(true);
		_deviceFilter = BleDeviceFilter.anyStone;
	}

	@ReactMethod
	public void clearTrackedBeacons(Callback callback) {
		// Clear the list of tracked iBeacons and stop tracking.
		BleLog.getInstance().LOGi(TAG, "clearTrackedBeacons");
		if (!checkBleExt(callback)) {
			return;
		}
		setTrackingState(false);
		getIBeaconRanger().clearIbeaconFilter();
		_iBeaconSphereIds.clear();
		updateScanner();

		WritableMap retVal = Arguments.createMap();
		retVal.putBoolean("error", false);
		callback.invoke(retVal);
	}

	@ReactMethod
	public void batterySaving(boolean enable) {
		// Called when app goes to foreground with enable=true
		// Called when app goes to background with enable=false
		// When enabled, beacon ranging should still continue.
		BleLog.getInstance().LOGi(TAG, "batterySaving: " + enable);
		// TODO
	}

	@ReactMethod
	public void setBackgroundScanning(final boolean enable) {
		// Called after used logged in, and when change.
		// When disabled, no scanning has to happen in background.
		BleLog.getInstance().LOGi(TAG, "setBackgroundScanning: " + enable);
		_initScannerInBackground = enable;
		if (_scanner.isInitialized()) {
			Notification notification = getScanServiceNotification("Crownstone is running in the background");
			_scanner.runInBackground(true, enable, notification, ONGOING_NOTIFICATION_ID, new IStatusCallback() {
				@Override
				public void onSuccess() {
					BleLog.getInstance().LOGi(TAG, "success");
					// Scanner may have stopped when background changed.
					onScannerInitialized();
					for (UUID uuid : _iBeaconSphereIds.keySet()) {
						getIBeaconRanger().addIbeaconFilter(new BleIbeaconFilter(uuid, -1, -1));
					}
					if (!_iBeaconSphereIds.isEmpty()) {
						setTrackingState(true);
//						_deviceFilter = BleDeviceFilter.anyStone;
					}
					updateScanner();

					if (!enable) {
						cancelScanServiceNotification();
					}
				}

				@Override
				public void onError(int error) {
					BleLog.getInstance().LOGi(TAG, "error: " + error);
				}
			});
		}
		else {
			checkBackgroundScanning();
		}
	}

	private void checkBackgroundScanning() {
		BleLog.getInstance().LOGi(TAG, "checkBackgroundScanning");
		_handler.postDelayed(new Runnable() {
			@Override
			public void run() {
				BleLog.getInstance().LOGi(TAG, "_initScannerInBackground=" + _initScannerInBackground + " isRunningInBackground=" + _scanner.isRunningInBackground());
				if (_scanner.isRunningInBackground() != _initScannerInBackground) {
					setBackgroundScanning(_initScannerInBackground);
				}
			}
		}, 100);
	}

//	private Runnable checkBackgroundScanning() {
//
//	}


	//########################################################################################
	//                       LOCALIZATION
	//########################################################################################

	@ReactMethod
	public void startIndoorLocalization() {
		// Start using the classifier
		BleLog.getInstance().LOGi(TAG, "startIndoorLocalization");
		_localization.startLocalization(this);
	}

	@ReactMethod
	public void stopIndoorLocalization() {
		// Stop using the classifier
		BleLog.getInstance().LOGi(TAG, "stopIndoorLocalization");
		_localization.stopLocalization();
	}

	@ReactMethod
	public void startCollectingFingerprint() {
		BleLog.getInstance().LOGi(TAG, "startCollectingFingerprint");
		_isTraingingLocalization = true;
		_isTraingingLocalizationPaused = false;
		_localization.startFingerprint();
	}

	@ReactMethod
	public void abortCollectingFingerprint() {
		BleLog.getInstance().LOGi(TAG, "abortCollectingFingerprint");
		_localization.abortFingerprint();
		_isTraingingLocalization = false;
	}

	@ReactMethod
	public void pauseCollectingFingerprint() {
		// Stop feeding scans to the localization class
		BleLog.getInstance().LOGi(TAG, "pauseCollectingFingerprint");
		// TODO: implementation
//		_isTraingingLocalization = false;
		_isTraingingLocalizationPaused = true;
	}

	@ReactMethod
	public void resumeCollectingFingerprint() {
		// Start feeding scans to the localization class again
		BleLog.getInstance().LOGi(TAG, "resumeCollectingFingerprint");
		// TODO: implementation
//		_isTraingingLocalization = true;
		_isTraingingLocalizationPaused = false;
	}

	@ReactMethod
	public void finalizeFingerprint(String sphereId, String locationId, Callback callback) {
		BleLog.getInstance().LOGi(TAG, "finalizeFingerprint: [%s] [%s]", sphereId, locationId);
		_localization.finalizeFingerprint(sphereId, locationId, null);
		_isTraingingLocalization = false;
		Fingerprint fingerprint = _localization.getFingerprint(sphereId, locationId);
		WritableMap retVal = Arguments.createMap();
		if (fingerprint != null) {
			String samplesStr = fingerprint.getSamples().toString();
			retVal.putBoolean("error", false);
			retVal.putString("data", samplesStr);
		}
		else {
			retVal.putBoolean("error", true);
			retVal.putString("data", "");
		}
		callback.invoke(retVal);
	}

	@ReactMethod
	public void loadFingerprint(String sphereId, String locationId, String samplesStr) {
		BleLog.getInstance().LOGi(TAG, "loadFingerprint: [%s] [%s] %s", sphereId, locationId, samplesStr);
		Fingerprint fingerprint = new Fingerprint();
		fingerprint.setSphereId(sphereId);
		fingerprint.setLocationId(locationId);

		try {
			FingerprintSamplesMap samples = new FingerprintSamplesMap(samplesStr);
			if (!samples.isEmpty()) {
				fingerprint.setSamples(samples);
				_localization.importFingerprint(sphereId, locationId, fingerprint);
			}
			else {
				BleLog.getInstance().LOGe(TAG, "fingerprint samples empty?!: " + samplesStr);
			}
		} catch (JSONException e) {
			BleLog.getInstance().LOGe(TAG, "Failed to load fingerprint samples: " + samplesStr);
			e.printStackTrace();
		}
	}

	@ReactMethod
	public void clearFingerprints() {
		BleLog.getInstance().LOGi(TAG, "clearFingerprints");
		_localization.clear();
	}

	@ReactMethod
	public void clearFingerprintsPromise(Callback callback) {
		BleLog.getInstance().LOGi(TAG, "clearFingerprintsPromise");
		_localization.clear();
		WritableMap retVal = Arguments.createMap();
		retVal.putBoolean("error", false);
		callback.invoke(retVal);
	}


	//########################################################################################
	//                       private
	//########################################################################################

	private void sendEvent(String eventName, @Nullable WritableMap params) {
//		BleLog.getInstance().LOGd(TAG, "sendEvent " + eventName + ": " + params);
		_reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
	}

	private void sendEvent(String eventName, @Nullable WritableArray params) {
		_reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
	}

	private void sendEvent(String eventName, @Nullable String params) {
		BleLog.getInstance().LOGd(TAG, "sendEvent " + eventName + ": " + params);
		_reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
	}

	private void sendEvent(String eventName, @Nullable Integer params) {
		_reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
	}

	private Notification getScanServiceNotification(String text) {
		Intent notificationIntent = new Intent(_reactContext, MainActivity.class);
//		notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
//		notificationIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
		notificationIntent.setAction(Intent.ACTION_MAIN);
		notificationIntent.addCategory(Intent.CATEGORY_LAUNCHER);
		notificationIntent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);


//			notificationIntent.setClassName("rocks.crownstone.consumerapp", "MainActivity");
//			notificationIntent.setAction("ACTION_MAIN");
//		PendingIntent pendingIntent = PendingIntent.getActivity(_reactContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_ONE_SHOT);
		PendingIntent pendingIntent = PendingIntent.getActivity(_reactContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);
//		PendingIntent pendingIntent = PendingIntent.getActivity(_reactContext, 0, notificationIntent, 0);

		Notification notification = new Notification.Builder(_reactContext)
				.setContentTitle("Crownstone is running")
				.setContentText(text)
				.setContentIntent(pendingIntent)
				.setSmallIcon(R.drawable.icon_notification)
				// TODO: add action to close the app + service
				// TODO: add action to pause the app?
//					.addAction(android.R.drawable.ic_menu_close_clear_cancel, )
//					.setLargeIcon()
				.build();

		if (Build.VERSION.SDK_INT >= 21) {
			notification.visibility = Notification.VISIBILITY_PUBLIC;
		}
		return notification;
	}

	private void updateScanServiceNotification(String text) {
		if (_scanner.isRunningInBackground()) {
			Notification notification = getScanServiceNotification(text);
			NotificationManager notificationManager = (NotificationManager) _reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
			notificationManager.notify(ONGOING_NOTIFICATION_ID, notification);
		}
	}

	private void cancelScanServiceNotification() {
		NotificationManager notificationManager = (NotificationManager) _reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
		notificationManager.cancel(ONGOING_NOTIFICATION_ID);
	}







	@Override
	public void onEvent(Event event) {
		BleLog.getInstance().LOGi(TAG, "event: " + event);
		switch (event) {
			case BLE_PERMISSIONS_GRANTED: {
				_locationPermissionMissing = false;
				_scanner.checkReady(false, _initScannerInBackground, _reactContext.getCurrentActivity(), null);
				checkReady(false);
				if (_locationServiceTurnedOff) {
					sendEvent("locationStatus", "off");
				}
				else {
					sendEvent("locationStatus", "on");
				}
				break;
			}
			case BLE_PERMISSIONS_MISSING: {
				_locationPermissionMissing = true;
				sendEvent("locationStatus", "noPermission");
				break;
			}
			case BLUETOOTH_TURNED_ON:{
				_bleTurnedOff = false;
				_scanner.checkReady(false, _initScannerInBackground, _reactContext.getCurrentActivity(), null);
				checkReady(false);
				sendEvent("bleStatus", "poweredOn");
				break;
			}
			case BLUETOOTH_TURNED_OFF: {
				_bleTurnedOff = true;
				sendEvent("bleStatus", "poweredOff");
				break;
			}
			case BLUETOOTH_START_SCAN_ERROR:
				// TODO: deal with this better, need more specific events
				resetBluetooth();
				break;
			case LOCATION_SERVICES_TURNED_OFF:
				_locationServiceTurnedOff = true;
				sendEvent("locationStatus", "off");
				break;
			case LOCATION_SERVICES_TURNED_ON:
				_locationServiceTurnedOff = false;
				_scanner.checkReady(false, _initScannerInBackground, _reactContext.getCurrentActivity(), null);
				checkReady(false);
				if (_locationPermissionMissing) {
					sendEvent("locationStatus", "noPermission");
				}
				else {
					sendEvent("locationStatus", "on");
				}
				break;
		}
		// TODO: send out event
	}

	@Override
	public void onDeviceScanned(BleDevice device) {
		BleLog.getInstance().LOGv(TAG, "event scanned device: " + device.toString());

		// TODO: should we send the nearest events before returning due to lacking of servicedata / uniqueness?

		if (device.isDfuMode()) {
			WritableMap dfuAdvertisementMap = Arguments.createMap();
			dfuAdvertisementMap.putString("handle", device.getAddress());
			dfuAdvertisementMap.putString("name", device.getName());
			dfuAdvertisementMap.putInt("rssi", device.getRssi());
			dfuAdvertisementMap.putBoolean("isCrownstoneFamily", device.isStone());
			dfuAdvertisementMap.putBoolean("isCrownstonePlug", device.isCrownstonePlug());
			dfuAdvertisementMap.putBoolean("isCrownstoneBuiltin", device.isCrownstoneBuiltin());
			dfuAdvertisementMap.putBoolean("isGuidestone", device.isGuidestone());
			dfuAdvertisementMap.putBoolean("isInDFUMode", device.isDfuMode());
			dfuAdvertisementMap.putString("serviceUUID", BluenetConfig.DFU_SERVICE_UUID); // not really used

			sendEvent("verifiedDFUAdvertisementData", dfuAdvertisementMap);
		}

		CrownstoneServiceData serviceData = device.getServiceData();
		if (serviceData == null) {
			// Don't send events of devices without service data
			return;
		}

		if (_scannerState == ScannerState.UNIQUE_ONLY) {
			String address = device.getAddress();
			BleDevice prevDev = _scannedDeviceMap.get(address);
			if (prevDev != null) {
				CrownstoneServiceData prevServiceData = prevDev.getServiceData();
				if (prevServiceData.getChangingBytes() != null && prevServiceData.getChangingBytes().equals(serviceData.getChangingBytes())) {
					// This advertisement is similar to the previous one
					BleLog.getInstance().LOGv(TAG, "Advertisement of device " + address + " is not unique");
					return;
				}
				else {
					// Update the device
					_scannedDeviceMap.put(device.getAddress(), device);
				}
			}
			else {
				// Init the device
				_scannedDeviceMap.put(device.getAddress(), device);
			}
		}

		WritableMap advertisementMap = Arguments.createMap();
		advertisementMap.putString("handle", device.getAddress());
		advertisementMap.putString("name", device.getName());
		advertisementMap.putInt("rssi", device.getRssi());

		advertisementMap.putBoolean("isCrownstoneFamily", device.isStone());
		advertisementMap.putBoolean("isInDFUMode", device.isDfuMode());
		advertisementMap.putString("serviceUUID", Integer.toHexString(serviceData.getServiceUuid())); // TODO: make sure it's zero padded

		WritableMap serviceDataMap = Arguments.createMap();
//		if (serviceData != null) {

		serviceDataMap.putString("deviceType", "undefined");
		if (device.isCrownstonePlug()) {
			serviceDataMap.putString("deviceType", "plug");
		}
		else if (device.isCrownstoneBuiltin()) {
			serviceDataMap.putString("deviceType", "builtin");
		}
		else if (device.isCrownstoneDongle()) {
			serviceDataMap.putString("deviceType", "crownstoneUSB");
		}
		else if (device.isGuidestone()) {
			serviceDataMap.putString("deviceType", "guidestone");
		}

		serviceDataMap.putInt("opCode", serviceData.getOpCode());
//		serviceDataMap.putInt("dataType", 255); // Not stored in ServiceData
		serviceDataMap.putBoolean("stateOfExternalCrownstone", serviceData.getFlagExternalData());
		serviceDataMap.putInt("rssiOfExternalCrownstone", serviceData.getExternalRssi());
		serviceDataMap.putBoolean("hasError", serviceData.getFlagError());
		serviceDataMap.putBoolean("setupMode", serviceData.isSetupMode());

		int crownstoneId = serviceData.getCrownstoneId();
		if (serviceData.getFlagExternalData()) {
			crownstoneId = serviceData.getCrownstoneExternalId();
		}
		serviceDataMap.putInt("crownstoneId", crownstoneId);

		serviceDataMap.putInt("switchState", serviceData.getSwitchState());
//		serviceDataMap.putInt("flagsBitmask", flagsBitmask); // Not stored in ServiceData
		serviceDataMap.putInt("temperature", serviceData.getTemperature());
		serviceDataMap.putDouble("powerFactor", 1);
		serviceDataMap.putDouble("powerUsageReal", serviceData.getPowerUsageReal());
		serviceDataMap.putDouble("powerUsageApparent", serviceData.getPowerUsageApparent());
		serviceDataMap.putDouble("accumulatedEnergy", serviceData.getAccumulatedEnergy());

		if (serviceData.getType() == CrownstoneServiceData.TYPE_V1 || serviceData.getType() == CrownstoneServiceData.TYPE_UNKNOWN) {
			serviceDataMap.putDouble("timestamp", -1);
		}
		else if (serviceData.getFlagTimeSet()) {
			serviceDataMap.putDouble("timestamp", serviceData.getReconstructedTimestamp());
		}
		else {
			serviceDataMap.putDouble("timestamp", serviceData.getPartialTimestamp());
		}

		serviceDataMap.putBoolean("dimmingAvailable", serviceData.getFlagDimmingAvailable());
		serviceDataMap.putBoolean("dimmingAllowed", serviceData.getFlagDimmingAllowed());
		serviceDataMap.putBoolean("switchLocked", serviceData.getFlagSwitchLocked());
		serviceDataMap.putBoolean("timeSet", serviceData.getFlagTimeSet());
		serviceDataMap.putBoolean("switchCraftEnabled", serviceData.getFlagSwitchcraftEnabled());

		boolean errorMode = false;
		if (serviceData.getType() == CrownstoneServiceData.TYPE_ERROR || serviceData.getType() == CrownstoneServiceData.TYPE_EXT_ERROR) {
			errorMode = true;
		}
		serviceDataMap.putBoolean("errorMode", errorMode);

		WritableMap errorMap = Arguments.createMap();
		errorMap.putBoolean("overCurrent", serviceData.getErrorOverCurrent());
		errorMap.putBoolean("overCurrentDimmer", serviceData.getErrorOverCurrentDimmer());
		errorMap.putBoolean("temperatureChip", serviceData.getErrorChipTemperature());
		errorMap.putBoolean("temperatureDimmer", serviceData.getErrorDimmerTemperature());
		errorMap.putBoolean("dimmerOnFailure", serviceData.getErrorDimmerFailureOn());
		errorMap.putBoolean("dimmerOffFailure", serviceData.getErrorDimmerFailureOff());
		errorMap.putInt("bitMask", 0); // Not stored in ServiceData
		serviceDataMap.putMap("errors", errorMap);

		serviceDataMap.putString("uniqueElement", serviceData.getChangingBytes());
		advertisementMap.putMap("serviceData", serviceDataMap);
//		}

//		sendEvent("advertisementData", advertisementMap);
		if (device.isValidatedCrownstone()) {
//			if (device.isDfuMode()) {
//				BleLog.getInstance().LOGv(TAG, "sendEvent verifiedDFUAdvertisementData: " + advertisementMap);
//				sendEvent("verifiedDFUAdvertisementData", advertisementMap);
//			}
//			else
			if(device.isSetupMode()) {
				BleLog.getInstance().LOGv(TAG, "sendEvent verifiedSetupAdvertisementData: " + advertisementMap);
				sendEvent("verifiedSetupAdvertisementData", advertisementMap);
			}
			else {
				advertisementMap.putString("referenceId", _currentSphereId);
				BleLog.getInstance().LOGv(TAG, "sendEvent verifiedAdvertisementData: " + advertisementMap);
				sendEvent("verifiedAdvertisementData", advertisementMap);
			}
			// Clone, to avoid the "already consumed" error
			Bundle advertisementBundle = Arguments.toBundle(advertisementMap);
			WritableMap advertisementMapCopy = Arguments.fromBundle(advertisementBundle);
			BleLog.getInstance().LOGv(TAG, "sendEvent anyVerifiedAdvertisementData: " + advertisementMapCopy);
			sendEvent("anyVerifiedAdvertisementData", advertisementMapCopy);
		}
//		if (device.isIBeacon()) {
//			advertisementMap.putInt("rssi", device.getAverageRssi());
//			sendEvent("iBeaconAdvertisement", advertisementMap);
//		}

		// Check for nearest stone and nearest stone in setup mode
		// TODO: some more intelligent way than looping over the whole sorted list every time.
		BleDeviceList sortedList = getBleExt().getDeviceMap().getDistanceSortedList();
//		BleDeviceList sortedBeaconList = _iBeaconRanger.getDeviceMap().getDistanceSortedList();
		for (BleDevice dev : sortedList) {
			if (dev.isStone() && dev.isSetupMode()) {
				WritableMap nearestMap = Arguments.createMap();
				nearestMap.putString("name", dev.getName());
				nearestMap.putString("handle", dev.getAddress());
				nearestMap.putInt("rssi", dev.getAverageRssi());
				nearestMap.putBoolean("setupMode", dev.isSetupMode());
				sendEvent("nearestSetupCrownstone", nearestMap);
				BleLog.getInstance().LOGv(TAG, "nearestSetupCrownstone: " + dev);
				break;
			}
		}
		for (BleDevice dev : sortedList) {
			if (dev.isStone() && !dev.isSetupMode() && dev.isValidatedCrownstone()) {
				WritableMap nearestMap = Arguments.createMap();
				nearestMap.putString("name", dev.getName());
				nearestMap.putString("handle", dev.getAddress());
				nearestMap.putInt("rssi", dev.getRssi());
				nearestMap.putBoolean("setupMode", dev.isSetupMode());
				//todo: ask alex what happened to the nearestVerifiedCrownstone event
				sendEvent("nearestVerifiedCrownstone", nearestMap);
				BleLog.getInstance().LOGv(TAG, "nearestVerifiedCrownstone: " + dev);
				break;
			}
		}
		for (BleDevice dev : sortedList) {
			if (dev.isStone() && !dev.isSetupMode()) {
				WritableMap nearestMap = Arguments.createMap();
				nearestMap.putString("name", dev.getName());
				nearestMap.putString("handle", dev.getAddress());
				nearestMap.putInt("rssi", dev.getRssi());
				nearestMap.putBoolean("setupMode", dev.isSetupMode());
				sendEvent("nearestCrownstone", nearestMap);
				BleLog.getInstance().LOGv(TAG, "nearestCrownstone: " + dev);
				break;
			}
		}
	}

	@Override
	public void onBeaconScanned(BleDevice device) {
		String beaconId = device.getProximityUuid().toString() + ".Maj:" + device.getMajor() + ".Min:" + device.getMinor();
		BleLog.getInstance().LOGv(TAG, "event scanned beacon: " + device.getAddress());
		if (_isTraingingLocalization && !_isTraingingLocalizationPaused) {
			_localization.feedMeasurement(device.getRssi(), beaconId, null, null);
		}
		_localization.track(device.getRssi(), beaconId, null);
		WritableMap advertisementMap = Arguments.createMap();
		advertisementMap.putString("id", beaconId);
		advertisementMap.putString("uuid", device.getProximityUuid().toString());
		advertisementMap.putInt("major", device.getMajor());
		advertisementMap.putInt("minor", device.getMinor());
		advertisementMap.putString("referenceId", _iBeaconSphereIds.get(device.getProximityUuid()));
		// TODO: should be once per second with averaged rssi
//		advertisementMap.putInt("rssi", device.getRssi());
		advertisementMap.putInt("rssi", device.getAverageRssi());
		synchronized (BluenetBridge.this) {
//			BleLog.getInstance().LOGv(TAG, "data: " + advertisementMap.toString());
			_ibeaconAdvertisements.put(beaconId, advertisementMap); // Overwrite previous value
		}
	}

	private Runnable iBeaconTick = new Runnable() {
		@Override
		public void run() {
			synchronized (BluenetBridge.this) {
				if (_ibeaconAdvertisements.size() > 0) {
					BleLog.getInstance().LOGv(TAG, "sendEvent iBeaconAdvertisement");
					WritableArray array = Arguments.createArray();
					for (WritableMap m : _ibeaconAdvertisements.values()) {
						array.pushMap(m);
					}
					sendEvent("iBeaconAdvertisement", array);
					_ibeaconAdvertisements.clear();
				}
			}
			_handler.postDelayed(this, IBEACON_TICK_INTERVAL);
		}
	};

	@Override
	public void onRegionEnter(UUID uuid) {
		int numEnteredRegions = getIBeaconRanger().getEnteredRegions().size();
		String referenceId = _iBeaconSphereIds.get(uuid);
		BleLog.getInstance().LOGi(TAG, "onRegionEnter: uuid=" + uuid + ", referenceId=" + referenceId + " currently in " + numEnteredRegions + " regions");
		updateScanner();
		if (referenceId != null) {
			sendEvent("enterSphere", referenceId);
		}
		updateScanServiceNotification("Currently in a sphere");
	}

	@Override
	public void onRegionExit(UUID uuid) {
		int numEnteredRegions = getIBeaconRanger().getEnteredRegions().size();
		String referenceId = _iBeaconSphereIds.get(uuid);
		BleLog.getInstance().LOGi(TAG, "onRegionExit: uuid=" + uuid + ", referenceId=" + referenceId + " currently in " + numEnteredRegions + " regions");
		updateScanner();
		if (referenceId != null) {
			sendEvent("exitSphere", referenceId);
		}
		if (numEnteredRegions > 0) {
			updateScanServiceNotification("Currently in a sphere");
		}
		else {
			updateScanServiceNotification("Not in any sphere");
		}
	}

	@Override
	public void onLocationUpdate(String locationId) {
		BleLog.getInstance().LOGi(TAG, "LocationUpdate: " + locationId);
		if (locationId == null) {
			if (_lastLocationId != null) {
				BleLog.getInstance().LOGd(TAG, "Send exit " + _currentSphereId + " " + _lastLocationId);
				WritableMap mapExit = Arguments.createMap();
				mapExit.putString("region", _currentSphereId);
				mapExit.putString("location", _lastLocationId);
				sendEvent("exitLocation", mapExit);
			}
		}
		else if (_lastLocationId == null) {
			BleLog.getInstance().LOGd(TAG, "Send enter " + _currentSphereId + " " + locationId);
			WritableMap mapEnter = Arguments.createMap();
			mapEnter.putString("region", _currentSphereId);
			mapEnter.putString("location", locationId);
			sendEvent("enterLocation", mapEnter);
		}
		else if (!locationId.equals(_lastLocationId)) {
			BleLog.getInstance().LOGd(TAG, "Send exit " + _currentSphereId + " " + _lastLocationId);
			WritableMap mapExit = Arguments.createMap();
			mapExit.putString("region", _currentSphereId);
			mapExit.putString("location", _lastLocationId);
			sendEvent("exitLocation", mapExit);

			BleLog.getInstance().LOGd(TAG, "Send enter " + _currentSphereId + " " + locationId);
			WritableMap mapEnter = Arguments.createMap();
			mapEnter.putString("region", _currentSphereId);
			mapEnter.putString("location", locationId);
			sendEvent("enterLocation", mapEnter);
		}
		//todo: ask alex what the currentLocation event is for
		_lastLocationId = locationId;
	}

	// Checks if scanner and bluetooth are ready.
	// If so, invoke ready callbacks.
	private synchronized void checkReady(boolean makeReady) {
		BleLog.getInstance().LOGd(TAG, "checkReady");

		if (_readyCallbacks.isEmpty()) {
			BleLog.getInstance().LOGd(TAG, "no ready callbacks");
			return;
		}

		if (!_isInitialized) {
			BleLog.getInstance().LOGw(TAG, "not initialized");
			return;
		}

		_scanner.checkReady(makeReady, _initScannerInBackground, _reactContext.getCurrentActivity(), new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "Ready!");
				if (!_scannerInitialized) {
					onScannerInitialized();
					_scannerInitialized = true;
				}

				List<Callback> readyCallbacks = new ArrayList<>(_readyCallbacks);
				_readyCallbacks.clear();
				for (Callback callback: readyCallbacks) {
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					callback.invoke(retVal);
				}
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "Not ready: " + error);

				switch (error) {
					case BleErrors.ERROR_BLUETOOTH_NOT_ENABLED: {
						_bleTurnedOff = true;
						sendEvent("bleStatus", "poweredOff");
						break;
					}
					case BleErrors.ERROR_LOCATION_SERVICES_NOT_ENABLED: {
						_locationServiceTurnedOff = true;
						sendEvent("locationStatus", "off");
						break;
					}
					case BleErrors.ERROR_LOCATION_PERMISSION_MISSING: {
						_locationPermissionMissing = true;
						sendEvent("locationStatus", "noPermission");
						break;
					}
				}

				// TODO: Check again later?
			}
		});
	}

	private String getKeyFromString(String key) {
		if (key == null) { return null; }
		String retKey = null;
		if (key.length() == BleBaseEncryption.AES_BLOCK_SIZE * 2) {
//			byte[] keyBytes = BleUtils.hexStringToBytes(key);
//			retKey = BleUtils.bytesToString(keyBytes);
			retKey = key;
		}
		if (key.length() == BleBaseEncryption.AES_BLOCK_SIZE) {
			byte[] keyBytes = key.getBytes(Charset.forName("UTF-8"));
			retKey = BleUtils.bytesToHexString(keyBytes);
//			retKey = key;
		}
		return retKey;
	}

	private boolean isScanning() { return _scannerState != ScannerState.DISABLED; }
	private ScannerState getScannerState() { return _scannerState; }
	private void setScannerState(ScannerState newState) { _scannerState = newState; }
	private boolean isTrackingIbeacon() { return _isTrackingIbeacon; }
	private void setTrackingState(boolean enabled) { _isTrackingIbeacon = enabled; }
	private boolean isScannerIdle() { return !isScanning() && !isTrackingIbeacon(); }
	private void updateScanner() {
//		if (_scanner == null) {
		if (!_scannerInitialized) {
			return;
		}
		if (!_isAppOnForeground && !_initScannerInBackground) {
			_scanner.stopScanning();
			return;
		}

		if (isScannerIdle()) {
			_scanner.stopScanning();
			return;
		}
		setScanMode();
//		_scanner.setScanInterval(getScanDuration(), getScanPause());
		_scanner.setScanFilter(_deviceFilter);
		_scanner.startScanning(null);
	}
	private void restartScanner() {
		_scanner.stopScanning();
		if (!isScannerIdle()) {
			setScanMode();
//			_scanner.setScanInterval(getScanDuration(), getScanPause());
			_scanner.setScanFilter(_deviceFilter);
			_scanner.startScanning(null);
		}
	}
//	private int getScanDuration() {
//		if (getScannerState() == ScannerState.HIGH_POWER) {
//			if (Build.VERSION.SDK_INT >= 24) {
//				return SCAN_INTERVAL_FAST_ANDROID_N;
//			}
//			return SCAN_INTERVAL_FAST;
//		}
//		if (getIBeaconRanger().getEnteredRegions().isEmpty()) {
//			if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
//				return SCAN_INTERVAL_OUTSIDE_SPHERE_ANDROID_N;
//			}
//			return SCAN_INTERVAL_OUTSIDE_SPHERE;
//		}
//		if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
//			return SCAN_INTERVAL_IN_SPHERE_ANDROID_N;
//		}
//		return SCAN_INTERVAL_IN_SPHERE;
//	}
//	private int getScanPause() {
//		if (getScannerState() == ScannerState.HIGH_POWER) {
//			if (Build.VERSION.SDK_INT >= 24) {
////				return SCAN_PAUSE_FAST_ANDROID_N;
//				return 0;
//			}
//			return SCAN_PAUSE_FAST;
//		}
//		if (getIBeaconRanger().getEnteredRegions().isEmpty()) {
//			if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
////				return SCAN_PAUSE_OUTSIDE_SPHERE_ANDROID_N;
//				return 0;
//			}
//			return SCAN_PAUSE_OUTSIDE_SPHERE;
//		}
//		if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
////			return SCAN_PAUSE_IN_SPHERE_ANDROID_N;
//			return 0;
//		}
//		return SCAN_PAUSE_IN_SPHERE;
//	}
	private void setScanMode() {
//		if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
// 			// Starting from Android 6.0 (API level 23), Android has doze and app standby.
//			// This means that the interval scanner breaks, due to postDelayed() getting deferred.
//			// Also, starting from Android 7, you are not allowed to turn on scanning very often.
			if (_scannerState == ScannerState.HIGH_POWER) {
				_scanner.setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY);
			}
			else {
				// Balanced has an interval of 5s and a scan window of 2s.
				_scanner.setScanMode(ScanSettings.SCAN_MODE_BALANCED);
			}
//		}
//		else if (Build.VERSION.SDK_INT >= 21) {
//			// Use interval scanner
//			_scanner.setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY);
//		}
	}

	private Pair getLogLevel(Class<?> cls) {
		for (Triplet triplet : LOG_LEVELS) {
			if (triplet.first.equals(cls)) {
				return new Pair<>((int)triplet.second, (int)triplet.third);
			}
		}
		return new Pair<>(LOG_LEVEL_DEFAULT, LOG_LEVEL_DEFAULT);
	}



	private boolean startDfu(String address, String name, String fileString) {
		_dfuServiceInitiator = new DfuServiceInitiator(address);
		_dfuServiceInitiator.setDeviceName(name);
		_dfuServiceInitiator.setKeepBond(false);

		// Enable experimental buttonless DFU feature.
		// But be aware of this: https://devzone.nordicsemi.com/question/100609/sdk-12-bootloader-erased-after-programming/
		// and other issues related to this experimental service.
		_dfuServiceInitiator.setUnsafeExperimentalButtonlessServiceInSecureDfuEnabled(false);
//		Uri fileUri = Uri.parse(fileUriString);
//		_dfuServiceInitiator.setZip(fileUri, null);
		_dfuServiceInitiator.setZip(null, fileString);
		_dfuServiceInitiator.setDisableNotification(true);

		// Can be used to pause/resume, or abort the dfu process.
		_dfuServiceController = _dfuServiceInitiator.start(_reactContext, DfuService.class);

		return true;
	}

	private final DfuProgressListener _dfuProgressListener = new DfuProgressListenerAdapter() {
		@Override
		public void onDeviceConnecting(final String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: connecting");
		}

		@Override
		public void onDeviceConnected(String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: connected");
		}

		@Override
		public void onDfuProcessStarting(final String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: start dfu process");
		}

		@Override
		public void onDfuProcessStarted(String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: started dfu process");
		}

		@Override
		public void onEnablingDfuMode(String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: enabling dfu mode");
		}

		@Override
		public void onProgressChanged(String deviceAddress, int percent, float speed, float avgSpeed, int currentPart, int partsTotal) {
			BleLog.getInstance().LOGd(TAG, "dfu: progress=%d (%d / %d) speed=%f (%f avg)", percent, currentPart, partsTotal, speed, avgSpeed);
			WritableMap progressMap = Arguments.createMap();
			progressMap.putInt("part", currentPart);
			progressMap.putInt("totalParts", partsTotal);
			progressMap.putInt("progress", percent);
			progressMap.putDouble("currentSpeedBytesPerSecond", speed);
			progressMap.putDouble("avgSpeedBytesPerSecond", avgSpeed);
			sendEvent("dfuProgress", progressMap);
		}

		@Override
		public void onFirmwareValidating(String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: validating firmware");
		}

		@Override
		public void onDeviceDisconnecting(String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: disconnecting");
		}

		@Override
		public void onDeviceDisconnected(String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: disconnected");
		}

		@Override
		public void onDfuCompleted(String deviceAddress) {
			BleLog.getInstance().LOGd(TAG, "dfu: completed");
			if (_dfuCallback != null) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				_dfuCallback.invoke(retVal);
				_dfuCallback = null;
			}

		}

		@Override
		public void onDfuAborted(String deviceAddress) {
			BleLog.getInstance().LOGw(TAG, "dfu: aborted");
			if (_dfuCallback != null) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "dfu aborted");
				_dfuCallback.invoke(retVal);
				_dfuCallback = null;
			}
		}

		@Override
		public void onError(String deviceAddress, int error, int errorType, String message) {
			BleLog.getInstance().LOGe(TAG, "dfu: error %d (%d): %s", error, errorType, message);
			if (_dfuCallback != null) {
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "dfu error:" + message);
				_dfuCallback.invoke(retVal);
				_dfuCallback = null;
			}
		}
	};



	//@ReactMethod
	//public void bla() { }
//	Boolean -> Bool
//	Integer -> Number
//	Double -> Number
//	Float -> Number
//	String -> String
//	Callback -> function
//	ReadableMap -> Object
//	ReadableArray -> Array
}