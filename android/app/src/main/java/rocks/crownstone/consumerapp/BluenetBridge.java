package rocks.crownstone.consumerapp;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.bluetooth.le.ScanSettings;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.location.Criteria;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Process;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import nl.dobots.bluenet.ble.base.BleBaseEncryption;
import nl.dobots.bluenet.ble.base.callbacks.IDiscoveryCallback;
import nl.dobots.bluenet.ble.base.callbacks.IProgressCallback;
import nl.dobots.bluenet.ble.base.structs.ControlMsg;
import nl.dobots.bluenet.ble.base.structs.CrownstoneServiceData;
import nl.dobots.bluenet.ble.base.structs.EncryptionKeys;
import nl.dobots.bluenet.ble.cfg.BleErrors;
import nl.dobots.bluenet.ble.cfg.BluenetConfig;
import nl.dobots.bluenet.ble.core.BleCore;
import nl.dobots.bluenet.ble.core.callbacks.IStatusCallback;
import nl.dobots.bluenet.ble.extended.BleDeviceFilter;
import nl.dobots.bluenet.ble.extended.BleExt;
import nl.dobots.bluenet.ble.extended.callbacks.EventListener;
import nl.dobots.bluenet.ble.extended.CrownstoneSetup;
import nl.dobots.bluenet.ble.extended.structs.BleDevice;
import nl.dobots.bluenet.ble.extended.structs.BleDeviceList;
import nl.dobots.bluenet.ble.mesh.structs.MeshControlMsg;
import nl.dobots.bluenet.ble.mesh.structs.MeshKeepAlivePacket;
import nl.dobots.bluenet.ble.mesh.structs.MeshMultiSwitchPacket;
import nl.dobots.bluenet.ble.mesh.structs.cmd.MeshControlPacket;
import nl.dobots.bluenet.ibeacon.BleBeaconRangingListener;
import nl.dobots.bluenet.ibeacon.BleIbeaconFilter;
import nl.dobots.bluenet.ibeacon.BleIbeaconRanging;
import nl.dobots.bluenet.service.BleScanService;
import nl.dobots.bluenet.service.callbacks.IntervalScanListener;
import nl.dobots.bluenet.service.callbacks.ScanDeviceListener;
import nl.dobots.bluenet.utils.BleLog;
import nl.dobots.bluenet.utils.BleUtils;
import nl.dobots.bluenet.utils.FileLogger;
import rocks.crownstone.localization.Fingerprint;
import rocks.crownstone.localization.FingerprintLocalization;
import rocks.crownstone.localization.FingerprintSamplesMap;
import rocks.crownstone.localization.Localization;
import rocks.crownstone.localization.LocalizationCallback;

public class BluenetBridge extends ReactContextBaseJavaModule implements IntervalScanListener, EventListener, ScanDeviceListener, BleBeaconRangingListener, LocalizationCallback {
	private static final String TAG = BluenetBridge.class.getCanonicalName();
	public static final int ONGOING_NOTIFICATION_ID = 99115;

	private static final int LOG_LEVEL_DEFAULT =         Log.WARN;
	// only add classes where you want to change the default level from verbose to something else
	private static final Triplet[] LOG_LEVELS = new Triplet[]{
			                                             // log lvl   file log lvl
			new Triplet<>(BleScanService.class,          Log.WARN,    Log.DEBUG),
			new Triplet<>(CrownstoneServiceData.class,   Log.WARN,    Log.WARN),
			new Triplet<>(BluenetBridge.class,           Log.WARN,    Log.DEBUG),
			new Triplet<>(BleBaseEncryption.class,       Log.WARN,    Log.WARN),
			new Triplet<>(BleIbeaconRanging.class,       Log.WARN,    Log.WARN),
			new Triplet<>(BleDevice.class,               Log.WARN,    Log.WARN),
			new Triplet<>(BleCore.class,                 Log.WARN,    Log.WARN),
			new Triplet<>(BleExt.class,                  Log.WARN,    Log.WARN),
			new Triplet<>(CrownstoneSetup.class,         Log.WARN,    Log.WARN),
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

	public static final int IBEACON_RANGING_MIN_RSSI = -90;

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
	private boolean _isInitialized = false;
	private boolean _scanServiceIsBound = false;
	private BleScanService _scanService;
//	private BleScanService _trackService;
//	private BleBase _bleBase;
	private boolean _bleExtInitialized = false;
	private BleExt _bleExt;
	private BleIbeaconRanging _iBeaconRanger;


	private Callback _readyCallback = null;

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

	public BluenetBridge(ReactApplicationContext reactContext) {
		super(reactContext);
		_reactContext = reactContext;

		_reactContext.addLifecycleEventListener(new LifecycleEventListener() {
			// TODO: use this to determine how fast to scan.

			@Override
			public void onHostResume() {
				BleLog.getInstance().LOGi(TAG, "onHostResume");
			}

			@Override
			public void onHostPause() {
				BleLog.getInstance().LOGi(TAG, "onHostPause");
			}

			@Override
			public void onHostDestroy() {
				BleLog.getInstance().LOGi(TAG, "onHostDestroy");
			}
		});

		init();

		IntentFilter intentFilter = new IntentFilter(Intent.ACTION_SCREEN_ON);
		intentFilter.addAction(Intent.ACTION_SCREEN_OFF);
		_reactContext.registerReceiver(new BroadcastReceiver() {
			@Override
			public void onReceive(Context context, Intent intent) {
				if (intent.getAction().equals(Intent.ACTION_SCREEN_OFF)) {
					BleLog.getInstance().LOGi(TAG, "screen 0");
				} else if (intent.getAction().equals(Intent.ACTION_SCREEN_ON)) {
					BleLog.getInstance().LOGi(TAG, "screen 1");
				}
			}
		}, intentFilter);
	}

	private void init() {
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

//		_bleBase = new BleBase();
		_bleExt = new BleExt();
		_bleExt.setConnectTimeout(CONNECT_TIMEOUT_MS);
		_bleExt.setNumRetries(CONNECT_NUM_RETRIES);
		initBluetooth();

		// create and bind to the BleScanService
		BleLog.getInstance().LOGi(TAG, "binding to service..");
		Intent intent = new Intent(_reactContext, BleScanService.class);
		Pair logLevels = getLogLevel(BleScanService.class);
		intent.putExtra(BleScanService.EXTRA_LOG_LEVEL, (int)logLevels.first);
		intent.putExtra(BleScanService.EXTRA_FILE_LOG_LEVEL, (int)logLevels.second);
		boolean success = _reactContext.bindService(intent, _connection, Context.BIND_AUTO_CREATE);
		BleLog.getInstance().LOGi(TAG, "successfully bound to service: " + success);

		_localization = FingerprintLocalization.getInstance();
		_isResettingBluetooth = false;

		_isInitialized = true;
		checkReady();
	}

	private void setLogLevels() {
		BleLog.getInstance().setLogLevel(LOG_LEVEL_DEFAULT);
		for (Triplet triplet: LOG_LEVELS) {
			Class<?> cls = (Class<?>)triplet.first;
			int logLevel = (int)triplet.second;
			int fileLogLevel = (int)triplet.third;
			BleLog.getInstance().setLogLevelPerTag(cls.getCanonicalName(), logLevel, fileLogLevel);
		}
	}

	private boolean _bleTurnedOff = false;

	private void initBluetooth() {
		_bleExtInitialized = false;
		_bleExt.init(_reactContext, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "initialized bleExt");
				_bleExtInitialized = true;
				_bleExt.enableEncryption(true); // TODO: should be done by setSettings
				checkReady();
				if (_bleTurnedOff) {
					sendEvent("bleStatus", "poweredOn");

					_bleTurnedOff = false;

					if (_scannerState != ScannerState.DISABLED) {
						startScanningForCrownstones();
					}

				}
			}

			@Override
			public void onError(int error) {
//				switch(error) {
//					case BleErrors.ERROR_BLUETOOTH_TURNED_OFF: {
//						_bleTurnedOff = true;
//						sendEvent("bleStatus", "poweredOff");
//						break;
//					}
//				}
				BleLog.getInstance().LOGe(TAG, "error initializing bleExt: " + error);
			}
		});
	}

	@ReactMethod
	public void quitApp() {
		BleLog.getInstance().LOGw(TAG, "quit");
		if (_scanServiceIsBound) {
			_reactContext.unbindService(_connection);
			_scanServiceIsBound = false;
		}
		// Stop the service just to be sure?
//		_reactContext.stopService(new Intent(_reactContext, BleScanService.class));
		_bleExt.destroy();
		if (_reactContext.getCurrentActivity() != null) {
			_reactContext.getCurrentActivity().finish();
		}
		_handler.removeCallbacksAndMessages(null);
		_isInitialized = false;
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
	public void enableLoggingToFile(boolean enable) {
		BleLog.getInstance().LOGi(TAG, "enableLoggingToFile " + enable);
		_fileLogger.enable(enable);
	}

	@ReactMethod
	public void clearLogs() {
		BleLog.getInstance().LOGi(TAG, "clearLogs");
		_fileLogger.clearLogFiles();
	}

	@Override
	public String getName() {
		return "BluenetJS";
	}

	@ReactMethod
	public void setSettings(ReadableMap config, Callback callback) {
		BleLog.getInstance().LOGi(TAG, "setSettings");
		// keys can be either in plain string or hex string format, check length to determine which

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
		_scanService.getBleExt().getBleBase().setEncryptionKeys(new EncryptionKeys(adminKey, memberKey, guestKey));
		_bleExt.getBleBase().setEncryptionKeys(new EncryptionKeys(adminKey, memberKey, guestKey));

		if (config.hasKey("encryptionEnabled")) {
			boolean enableEncryption = config.getBoolean("encryptionEnabled");
			if (enableEncryption && guestKey == null && memberKey == null && adminKey == null) {
				retVal.putBoolean("error", true);
				retVal.putString("data", "no key supplied");
			}
			else {
				_scanService.getBleExt().enableEncryption(enableEncryption);
				_bleExt.enableEncryption(enableEncryption);
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
		} else {
			retVal.putBoolean("error", true);
			retVal.putString("data", "missing referenceId");
			_currentSphereId = "";
		}

		callback.invoke(retVal);
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
//		_isResettingBluetooth = true;
//		_bleExt.getBleBase().resetBle();
	}

	@ReactMethod
	public void isReady(Callback callback) {
		BleLog.getInstance().LOGi(TAG, "isReady: " + callback);
		// TODO: what if isReady gets called twice before ready?
		_readyCallback = callback;
		checkReady();
	}

	@ReactMethod
	public void rerouteEvents() {
//		WritableMap map = Arguments.createMap();
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
		BleLog.getInstance().LOGi(TAG, "rerouteEvents");
	}


	@ReactMethod
	public void requestLocationPermission() {
		BleLog.getInstance().LOGi(TAG, "requestLocationPermission");
	}

	@ReactMethod
	public void requestLocation(Callback callback) {
		// Should return data {"latitude": number, "longitude": number}
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


	//////////////////////////////////////////////////////////////////////////////////////////
	//                       Start / stop scanning
	//////////////////////////////////////////////////////////////////////////////////////////

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

	@ReactMethod
	public void forceClearActiveRegion() {
		// Forces not being in an ibeacon region (not needed for android as far as I know)
	}


	//////////////////////////////////////////////////////////////////////////////////////////
	//                       Connect / disconnect
	//////////////////////////////////////////////////////////////////////////////////////////

	@ReactMethod
	public void connect(final String uuid, final Callback callback) {
		int rssi = 0;
		BleDevice dev = _scanService.getBleExt().getDeviceMap().get(uuid);
		if (dev != null) {
			rssi = dev.getAverageRssi();
		}
		BleLog.getInstance().LOGd(TAG, "Connect to " + uuid + " rssi: " + rssi);
		if (_isTraingingLocalization) {
			BleLog.getInstance().LOGw(TAG, "Connecting while training localization is bad");
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
		_bleExt.connectAndDiscover(uuid, new IDiscoveryCallback() {
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
	public void disconnect(final Callback callback) {
		// Command the crownstone to disconnect the phone
		BleLog.getInstance().LOGd(TAG, "Disconnect command");
		// TODO maybe just use disconnectAndClose instead of the command
		// [12.11.16] Note: do not use writeDisconnectCommand, that will just lead to errors if the connection
		//  is closed before the command succeeds
//		_bleExt.writeDisconnectCommand(new IStatusCallback() {
//			@Override
//			public void onSuccess() {
//				BleLog.getInstance().LOGd(TAG, "disconnect command success");
//				WritableMap retVal = Arguments.createMap();
//				retVal.putBoolean("error", false);
//				callback.invoke(retVal);
//			}
//
//			@Override
//			public void onError(int error) {
//				switch (error) {
//					// Regard errors about being disconnected as success
//					case BleErrors.ERROR_NEVER_CONNECTED:
//					case BleErrors.ERROR_NOT_CONNECTED: {
//						BleLog.getInstance().LOGd(TAG, "disconnect command success");
//						WritableMap retVal = Arguments.createMap();
//						retVal.putBoolean("error", false);
//						callback.invoke(retVal);
//						return;
//					}
//				}
//				BleLog.getInstance().LOGd(TAG, "disconnect command error: " + error);
//				WritableMap retVal = Arguments.createMap();
//				retVal.putBoolean("error", true);
//				retVal.putString("data", "failed to disconnect: " + error);
//				callback.invoke(retVal);
//			}
//		});

		_bleExt.disconnectAndClose(false, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "disconnected");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGi(TAG, "failed to disconnect: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "failed to disconnect: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void phoneDisconnect(final Callback callback) {
		// Normal disconnect
		BleLog.getInstance().LOGd(TAG, "phoneDisconnect");
		_bleExt.disconnectAndClose(false, new IStatusCallback() {
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


	//////////////////////////////////////////////////////////////////////////////////////////
	//                       Commands
	//////////////////////////////////////////////////////////////////////////////////////////

	@ReactMethod
	public void setSwitchState(Float switchStateFloat, final Callback callback) {
		// For now: no dimming
		int switchState = 0;
		if (switchStateFloat > 0) {
			switchState = BluenetConfig.SWITCH_ON;
		}
		_bleExt.writeSwitch(switchState, new IStatusCallback() {
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
	public void commandFactoryReset(final Callback callback) {
		BleLog.getInstance().LOGi(TAG, "commandFactoryReset");
		_bleExt.writeFactoryReset(new IStatusCallback() {
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

	@ReactMethod
	public void recover(String crownstoneHandle, final Callback callback) {
		// If stone is not in recovery mode, then return string "NOT_IN_RECOVERY_MODE" as error data.
		String address = crownstoneHandle;
		BleLog.getInstance().LOGi(TAG, "Recover: " + address);
		_bleExt.recover(address, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "recover success");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.getInstance().LOGe(TAG, "recover error "+ error);
				BleLog.getInstance().LOGd(TAG, Log.getStackTraceString(new Exception()));
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
			retVal.putBoolean("error", true);
			retVal.putString("data", "wrong arguments: " + config.toString());
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
			BleLog.getInstance().LOGw(TAG, "Wrong setup data");
			retVal.putBoolean("error", true);
			callback.invoke(retVal);
			return;
		}

		CrownstoneSetup crownstoneSetup = new CrownstoneSetup(_bleExt);
		crownstoneSetup.executeSetup(crownstoneId, adminKey, memberKey, guestKey, meshAccessAddress, iBeaconUuid, iBeaconMajor, iBeaconMinor, new IProgressCallback() {
			@Override
			public void onProgress(double progress, @Nullable JSONObject statusJson) {
				sendEvent("setupProgress", (int)progress);
			}

			@Override
			public void onError(int error) {
				// Already fires status callback onError
			}
		}, new IStatusCallback() {
			@Override
			public void onSuccess() {
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				retVal.putBoolean("error", true);
				retVal.putString("data", "setup error: " + error);
				callback.invoke(retVal);
			}
		});

	}

	@ReactMethod
	public void getMACAddress(Callback callback) {
		WritableMap retVal = Arguments.createMap();
		if (_bleExt.isConnected(null)) {
			retVal.putBoolean("error", false);
			retVal.putString("data", _bleExt.getTargetAddress());
		}
		else {
			retVal.putBoolean("error", true);
			retVal.putString("data", "not connected");
		}
		callback.invoke(retVal);
	}

	@ReactMethod
	public void keepAliveState(boolean action, float state, int timeout, final Callback callback) {
		int actionInt = 0;
		if (action) {
			actionInt = 1;
		}
		// For now: no dimming
		int switchState = 0;
		if (state > 0) {
			switchState = BluenetConfig.SWITCH_ON;
		}
		_bleExt.writeKeepAliveState(actionInt, switchState, timeout, new IStatusCallback() {
				@Override
				public void onSuccess() {
					BleLog.getInstance().LOGi(TAG, "keepAliveState success");
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					callback.invoke(retVal);
				}

				@Override
				public void onError(int error) {
					BleLog.getInstance().LOGi(TAG, "keepAliveState error "+ error);
					BleLog.getInstance().LOGi(TAG, Log.getStackTraceString(new Exception()));
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "keepAliveState failed: " + error);
					callback.invoke(retVal);
				}
		});
	}

	@ReactMethod
	public void keepAlive(final Callback callback) {
		_bleExt.writeKeepAlive(new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.getInstance().LOGi(TAG, "keepAlive success");
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
	public void meshKeepAlive(final Callback callback) {
		// Write a message with no payload, as per protocol.
		MeshControlMsg msg = new MeshControlMsg(BluenetConfig.MESH_HANDLE_KEEP_ALIVE, 0, new byte[0]);
		_bleExt.writeMeshMessage(msg, new IStatusCallback() {
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

		// Create new packet, fill it with keep alive items.
		MeshKeepAlivePacket packet = new MeshKeepAlivePacket(timeout);
		boolean success = true;
		for (int i=0; i<keepAliveItems.size(); i++) {
			ReadableMap itemMap = keepAliveItems.getMap(i);
			int crownstoneId = itemMap.getInt("crownstoneId");
			int actionSwitchState = BluenetConfig.KEEP_ALIVE_NO_ACTION;
			if (itemMap.getBoolean("action")) {
				double switchStateDouble = itemMap.getDouble("state");
				// For now: no dimming
//				actionSwitchState = (int) Math.round(BluenetConfig.SWITCH_ON * switchStateDouble);
				if (switchStateDouble > 0) {
					actionSwitchState = BluenetConfig.SWITCH_ON;
				}
				else {
					actionSwitchState = 0;
				}
			}
			if (!packet.addKeepAlive(crownstoneId, actionSwitchState)) {
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

		// Write a mesh control msg with the packet as payload
		byte[] payload = packet.toArray();
		MeshControlMsg msg = new MeshControlMsg(BluenetConfig.MESH_HANDLE_KEEP_ALIVE, payload.length, payload);
		_bleExt.writeMeshMessage(msg, new IStatusCallback() {
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

	@ReactMethod
	public void meshCommandSetSwitchState(ReadableArray ids, Float switchStateFloat, int intent, final Callback callback) {
		// ids = [number(uint16), ..]

		// Create the control msg
		// For now: no dimming
//		int switchState = Math.round(switchStateFloat * BluenetConfig.SWITCH_ON);
		int switchState = 0;
		if (switchStateFloat > 0) {
			switchState = BluenetConfig.SWITCH_ON;
		}
		ControlMsg controlMsg = new ControlMsg(BluenetConfig.CMD_SWITCH, 1, new byte[]{(byte) switchState});

		// Copy crownstone ids to an int array
		int[] idsArr = new int[ids.size()];
		for (int i=0; i<ids.size(); i++) {
			idsArr[i] = ids.getInt(i);
		}

		// Create the mesh control packet: a control msg combined with target ids
		MeshControlPacket packet = new MeshControlPacket(controlMsg, idsArr);

		// Write a mesh control msg with the packet as payload
		byte[] payload = packet.toArray();
		MeshControlMsg msg = new MeshControlMsg(BluenetConfig.MESH_HANDLE_COMMAND, payload.length, payload);
		_bleExt.writeMeshMessage(msg, new IStatusCallback() {
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
				retVal.putString("data", "meshCommandSetSwitchState failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void multiSwitch(ReadableArray switchItems, final Callback callback) {
		// switchItems = [{crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }, {}, ...]

		// Create the multi switch packet
		MeshMultiSwitchPacket packet = new MeshMultiSwitchPacket();
		boolean success = true;
		for (int i=0; i<switchItems.size(); i++) {
			ReadableMap itemMap = switchItems.getMap(i);
			int crownstoneId =         itemMap.getInt("crownstoneId");
			int timeout =              itemMap.getInt("timeout");
			int intent =               itemMap.getInt("inent");
			double switchStateDouble = itemMap.getDouble("state");
//			int switchState = (int) Math.round(BluenetConfig.SWITCH_ON * switchStateDouble);
			int switchState = 0;
			if (switchStateDouble > 0) {
				switchState = BluenetConfig.SWITCH_ON;
			}
			if (!packet.addMultiSwitch(crownstoneId, switchState, timeout, intent)) {
				success = false;
				BleLog.getInstance().LOGe(TAG, "Unable to add multi switch item: " + itemMap);
				break;
			}
		}
		if (!success) {
			BleLog.getInstance().LOGe(TAG, "Failed to send mesh multi switch: " + switchItems);
			WritableMap retVal = Arguments.createMap();
			retVal.putBoolean("error", true);
			retVal.putString("data", "Invalid multiSwitch data");
			callback.invoke(retVal);
			return;
		}

		// Write a mesh control msg with the packet as payload
		byte[] payload = packet.toArray();
		MeshControlMsg msg = new MeshControlMsg(BluenetConfig.MESH_HANDLE_MULTI_SWITCH, payload.length, payload);
		_bleExt.writeMeshMessage(msg, new IStatusCallback() {
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


	//////////////////////////////////////////////////////////////////////////////////////////
	//                       iBeacon tracking
	//////////////////////////////////////////////////////////////////////////////////////////

	@ReactMethod
	public void trackIBeacon(String ibeaconUUID, String sphereId) {
		// Add the uuid to the list of tracked iBeacons, associate it with given sphereId
		// Also starts the tracking
		BleLog.getInstance().LOGi(TAG, "trackIBeacon: " + ibeaconUUID + " sphereId=" + sphereId);
		if (ibeaconUUID == null || sphereId == null) {
			BleLog.getInstance().LOGe(TAG, "invalid parameters");
			return;
		}
		UUID uuid = UUID.fromString(ibeaconUUID);
		_iBeaconSphereIds.put(uuid, sphereId);
		_iBeaconRanger.addIbeaconFilter(new BleIbeaconFilter(uuid, -1, -1));
		setTrackingState(true);
		_deviceFilter = BleDeviceFilter.anyStone;
		updateScanner();
	}

	@ReactMethod
	public void stopTrackingIBeacon(String ibeaconUUID) {
		// Remove the uuid from the list of tracked iBeacons
		BleLog.getInstance().LOGi(TAG, "stopTrackingIBeacon: " + ibeaconUUID);
		UUID uuid = UUID.fromString(ibeaconUUID);
		_iBeaconRanger.remIbeaconFilter(new BleIbeaconFilter(uuid, -1, -1));
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
		setTrackingState(false);
		_iBeaconRanger.clearIbeaconFilter();
		_iBeaconSphereIds.clear();
		updateScanner();

		WritableMap retVal = Arguments.createMap();
		retVal.putBoolean("error", false);
		callback.invoke(retVal);
	}


	//////////////////////////////////////////////////////////////////////////////////////////
	//                       Localization
	//////////////////////////////////////////////////////////////////////////////////////////

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
		_isTraingingLocalization = true;
		_isTraingingLocalizationPaused = false;
		_localization.startFingerprint();
	}

	@ReactMethod
	public void abortCollectingFingerprint() {
		_localization.abortFingerprint();
		_isTraingingLocalization = false;
	}

	@ReactMethod
	public void pauseCollectingFingerprint() {
		// Stop feeding scans to the localization class
		// TODO: implementation
//		_isTraingingLocalization = false;
		_isTraingingLocalizationPaused = true;
	}

	@ReactMethod
	public void resumeCollectingFingerprint() {
		// Start feeding scans to the localization class again
		// TODO: implementation
//		_isTraingingLocalization = true;
		_isTraingingLocalizationPaused = false;
	}

	@ReactMethod
	public void finalizeFingerprint(String sphereId, String locationId, Callback callback) {
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


	//////////////////////////////////////////////////////////////////////////////////////////
	//                       private
	//////////////////////////////////////////////////////////////////////////////////////////

	private void sendEvent(String eventName, @Nullable WritableMap params) {
		_reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
	}

	private void sendEvent(String eventName, @Nullable WritableArray params) {
		_reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
	}

	private void sendEvent(String eventName, @Nullable String params) {
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
		if (_scanServiceIsBound) {
			Notification notification = getScanServiceNotification(text);
			NotificationManager mNotificationManager = (NotificationManager) _reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
			mNotificationManager.notify(ONGOING_NOTIFICATION_ID, notification);
		}
	}

	// if the service was connected successfully, the service connection gives us access to the service
	private ServiceConnection _connection = new ServiceConnection() {
		@Override
		public void onServiceConnected(ComponentName name, IBinder service) {
			BleLog.getInstance().LOGi(TAG, "connected to ble scan service ...");
			// get the service from the binder
			BleScanService.BleScanBinder binder = (BleScanService.BleScanBinder) service;
			_scanService = binder.getService();

			// register as event listener. Events, like bluetooth initialized, and bluetooth turned
			// off events will be triggered by the service, so we know if the user turned bluetooth
			// on or off
			_scanService.registerEventListener(BluenetBridge.this);

			// register as a scan device listener. If you want to get an event every time a device
			// is scanned, then this is the choice for you.
			_scanService.registerScanDeviceListener(BluenetBridge.this);
			// register as an interval scan listener. If you only need to know the list of scanned
			// devices at every end of an interval, then this is better. additionally it also informs
			// about the start of an interval.
			_scanService.registerIntervalScanListener(BluenetBridge.this);

			// set the scan interval (for how many ms should the service scan for devices)
			_scanService.setScanInterval(SCAN_INTERVAL_IN_SPHERE);
			// set the scan pause (how many ms should the service wait before starting the next scan)
			_scanService.setScanPause(SCAN_PAUSE_IN_SPHERE);


			Notification notification = getScanServiceNotification("Crownstone is running in the background");
			_scanService.startForeground(ONGOING_NOTIFICATION_ID, notification);


			BleExt bleExt = _scanService.getBleExt();
			bleExt.enableEncryption(true); // TODO: should be done by setSettings
			_iBeaconRanger = bleExt.getIbeaconRanger();
			_iBeaconRanger.setRssiThreshold(IBEACON_RANGING_MIN_RSSI);

			_iBeaconRanger.registerListener(BluenetBridge.this);
			BleLog.getInstance().LOGd(TAG, "registered: " + BluenetBridge.this);

			_scanServiceIsBound = true;
			checkReady();
		}

		@Override
		public void onServiceDisconnected(ComponentName name) {
			// Only called when the service has crashed or has been killed, not when we unbind.
			BleLog.getInstance().LOGi(TAG, "disconnected from service");
			_scanService = null;
			_iBeaconRanger = null;
			_scanServiceIsBound = false;
		}
	};

	@Override
	public void onEvent(Event event) {
		switch (event) {
			case BLE_PERMISSIONS_GRANTED: {
				initBluetooth();
				break;
			}
			case BLUETOOTH_TURNED_ON:{
				// If bluetooth is turned on, the scanservice doesn't automatically restart.
				updateScanner();
				_isResettingBluetooth = false;
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
		}
		// TODO: send out event
	}

	@Override
	public void onScanStart() {
		// Don't care
	}

	@Override
	public void onScanEnd() {
		// TODO
	}

	@Override
	public void onDeviceScanned(BleDevice device) {
		BleLog.getInstance().LOGv(TAG, "event scanned device: " + device.toString());

		// TODO: should we send the nearest events before returning due to lacking of servicedata / uniqueness?

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
				if (prevServiceData.getRandomBytes() != null
						&& prevServiceData.getRandomBytes().equals(serviceData.getRandomBytes())
						&& prevServiceData.getPowerUsage() == serviceData.getPowerUsage()
						&& prevServiceData.getAccumulatedEnergy() == serviceData.getAccumulatedEnergy()
						&& prevServiceData.getSwitchState() == serviceData.getSwitchState()
						&& prevServiceData.getEventBitmask() == serviceData.getEventBitmask()
						) {
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
//		advertisementMap.putBoolean("setupPackage", device.isSetupMode());
		advertisementMap.putBoolean("isCrownstoneFamily", device.isStone());
		advertisementMap.putBoolean("isCrownstonePlug", device.isCrownstonePlug());
		advertisementMap.putBoolean("isCrownstoneBuiltin", device.isCrownstoneBuiltin());
		advertisementMap.putBoolean("isGuidestone", device.isGuidestone());
		advertisementMap.putBoolean("isValidated", device.isValidatedCrownstone()); // todo: not used anymore?

		advertisementMap.putBoolean("serviceDataAvailable", device.getServiceData() != null);


		WritableMap serviceDataMap = Arguments.createMap();
//		if (serviceData != null) {
			// ServiceUUID of the advertisementData

			advertisementMap.putString("serviceUUID", Integer.toHexString(serviceData.getServiceUuid())); // TODO: make sure it's zero padded

			byte eventBitmask = serviceData.getEventBitmask();
			int crownstoneId = serviceData.getCrownstoneId();

			serviceDataMap.putInt("firmwareVersion", serviceData.getFirmwareVersion());
			if (CrownstoneServiceData.isExternalData(eventBitmask)) {
				crownstoneId = serviceData.getCrownstoneStateId();
			}
			serviceDataMap.putInt("crownstoneId", crownstoneId);
			serviceDataMap.putInt("switchState", serviceData.getSwitchState());
			serviceDataMap.putInt("eventBitmask", eventBitmask);
			serviceDataMap.putInt("temperature", serviceData.getTemperature());
			serviceDataMap.putInt("powerUsage", serviceData.getPowerUsage());
			serviceDataMap.putInt("accumulatedEnergy", serviceData.getAccumulatedEnergy());
			serviceDataMap.putBoolean("newDataAvailable", CrownstoneServiceData.isNewData(eventBitmask));
			serviceDataMap.putBoolean("stateOfExternalCrownstone", CrownstoneServiceData.isExternalData(eventBitmask));
			serviceDataMap.putBoolean("setupMode", serviceData.isSetupMode());
			serviceDataMap.putBoolean("dfuMode", device.isDfuMode());
			serviceDataMap.putString("random", serviceData.getRandomBytes());
			advertisementMap.putMap("serviceData", serviceDataMap);
//		}

//		sendEvent("advertisementData", advertisementMap);
		if (device.isValidatedCrownstone()) {
			if (device.isDfuMode()) {
				BleLog.getInstance().LOGv(TAG, "sendEvent verifiedDFUAdvertisementData: " + advertisementMap);
				sendEvent("verifiedDFUAdvertisementData", advertisementMap);
			}
			else if(device.isSetupMode()) {
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
		BleDeviceList sortedList = _scanService.getBleExt().getDeviceMap().getDistanceSortedList();
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
		int numEnteredRegions = _iBeaconRanger.getEnteredRegions().size();
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
		int numEnteredRegions = _iBeaconRanger.getEnteredRegions().size();
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
		BleLog.getInstance().LOGd(TAG, "LocationUpdate: " + locationId);
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

	private void checkReady() {
		BleLog.getInstance().LOGd(TAG, "checkReady");
		if (_readyCallback == null) {
			return;
		}
		if (!_scanServiceIsBound) {
			return;
		}
		if (!_bleExtInitialized) {
			return;
		}

		if (!_isInitialized) {
			init();
			return;
		}

		// TODO: Check for permissions, bluetooth on, localization on, etc.
		BleLog.getInstance().LOGi(TAG, "ready!");
		WritableMap retVal = Arguments.createMap();
		retVal.putBoolean("error", false);
		_readyCallback.invoke(retVal);
		_readyCallback = null;
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
		if (isScannerIdle()) {
			_scanService.stopIntervalScan();
			return;
		}
		setScanMode();
		_scanService.startIntervalScan(getScanInterval(), getScanPause(), _deviceFilter);
	}
	private int getScanInterval() {
		if (getScannerState() == ScannerState.HIGH_POWER) {
			if (Build.VERSION.SDK_INT >= 24) {
				return SCAN_INTERVAL_FAST_ANDROID_N;
			}
			return SCAN_INTERVAL_FAST;
		}
		if (_iBeaconRanger.getEnteredRegions().isEmpty()) {
			if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
				return SCAN_INTERVAL_OUTSIDE_SPHERE_ANDROID_N;
			}
			return SCAN_INTERVAL_OUTSIDE_SPHERE;
		}
		if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
			return SCAN_INTERVAL_IN_SPHERE_ANDROID_N;
		}
		return SCAN_INTERVAL_IN_SPHERE;
	}
	private int getScanPause() {
		if (getScannerState() == ScannerState.HIGH_POWER) {
			if (Build.VERSION.SDK_INT >= 24) {
				return SCAN_PAUSE_FAST_ANDROID_N;
			}
			return SCAN_PAUSE_FAST;
		}
		if (_iBeaconRanger.getEnteredRegions().isEmpty()) {
			if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
//				return SCAN_PAUSE_OUTSIDE_SPHERE_ANDROID_N;
				return 0;
			}
			return SCAN_PAUSE_OUTSIDE_SPHERE;
		}
		if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
//			return SCAN_PAUSE_IN_SPHERE_ANDROID_N;
			return 0;
		}
		return SCAN_PAUSE_IN_SPHERE;
	}
	private void setScanMode() {
		if (Build.VERSION.SDK_INT >= 24) { // doze is actually since 23
 			// Starting from Android 6.0 (API level 23), Android has doze and app standby.
			// This means that the interval scanner breaks, due to postDelayed() getting deferred.
			// Balanced has an interval of 5s and a scan window of 2s.
			_scanService.setScanMode(ScanSettings.SCAN_MODE_BALANCED);
		}
		else if (Build.VERSION.SDK_INT >= 21) {
				_scanService.setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY);
		}
	}

	private Pair getLogLevel(Class<?> cls) {
		for (Triplet triplet : LOG_LEVELS) {
			if (triplet.first.equals(cls)) {
				return new Pair<>((int)triplet.second, (int)triplet.third);
			}
		}
		return new Pair<>(LOG_LEVEL_DEFAULT, LOG_LEVEL_DEFAULT);
	}

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