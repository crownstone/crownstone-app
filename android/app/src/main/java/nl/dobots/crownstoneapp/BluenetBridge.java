package nl.dobots.crownstoneapp;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.NoSuchKeyException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UnexpectedNativeTypeException;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;

import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import nl.dobots.bluenet.ble.base.BleBaseEncryption;
import nl.dobots.bluenet.ble.base.callbacks.IDiscoveryCallback;
import nl.dobots.bluenet.ble.base.callbacks.IProgressCallback;
import nl.dobots.bluenet.ble.base.callbacks.IStatusCallback;
import nl.dobots.bluenet.ble.base.structs.CrownstoneServiceData;
import nl.dobots.bluenet.ble.base.structs.EncryptionKeys;
import nl.dobots.bluenet.ble.extended.BleDeviceFilter;
import nl.dobots.bluenet.ble.extended.BleExt;
import nl.dobots.bluenet.ble.extended.CrownstoneSetup;
import nl.dobots.bluenet.ibeacon.BleBeaconRangingListener;
import nl.dobots.bluenet.ibeacon.BleIbeaconFilter;
import nl.dobots.bluenet.ble.extended.structs.BleDevice;
import nl.dobots.bluenet.ble.extended.structs.BleDeviceList;
import nl.dobots.bluenet.ibeacon.BleIbeaconRanging;
import nl.dobots.bluenet.service.BleScanService;
import nl.dobots.bluenet.service.callbacks.EventListener;
import nl.dobots.bluenet.service.callbacks.IntervalScanListener;
import nl.dobots.bluenet.service.callbacks.ScanDeviceListener;
import nl.dobots.bluenet.utils.BleLog;
import nl.dobots.bluenet.utils.BleUtils;

public class BluenetBridge extends ReactContextBaseJavaModule implements IntervalScanListener, EventListener, ScanDeviceListener, BleBeaconRangingListener {
	private static final String TAG = BluenetBridge.class.getCanonicalName();


	public static final int FAST_SCAN_INTERVAL = 20000; // ms scanning
	public static final int FAST_SCAN_PAUSE = 100; // ms pause
	public static final int SLOW_SCAN_INTERVAL = 10000; // ms scanning
	public static final int SLOW_SCAN_PAUSE = 1000; // ms pause
	public static final int IBEACON_TICK_INTERVAL = 1000; // ms interval
	private boolean _bound;

	private ReactApplicationContext _reactContext;
	private BleScanService _scanService;
//	private BleScanService _trackService;
//	private BleBase _bleBase;
	private boolean _bleExtInitialized = false;
	private BleExt _bleExt;
	private BleIbeaconRanging _iBeaconRanger;

//	private Map<UUID, String> _trackedIBeacons = new HashMap<>();

	private Callback _readyCallback = null;

	private boolean _isScanning;
	private boolean _isTracking;
//	private BleDeviceFilter _scanFilter;

	private boolean _connectCallbackInvoked;

	private Map<UUID, String> _iBeaconSphereIds = new HashMap<>();

	// handler used for delayed execution and timeouts
	private Handler _handler;

//	WritableArray _ibeaconAdvertisements = Arguments.createArray();
	List<WritableMap> _ibeaconAdvertisements = new ArrayList<>();

	public BluenetBridge(ReactApplicationContext reactContext) {
		super(reactContext);
		_reactContext = reactContext;

		// create handler with its own thread
		HandlerThread handlerThread = new HandlerThread("BluenetBridge");
		handlerThread.start();
		_handler = new Handler(handlerThread.getLooper());

		_handler.postDelayed(iBeaconTick, IBEACON_TICK_INTERVAL);

//		_bleBase = new BleBase();
		_bleExt = new BleExt();
		_bleExt.init(_reactContext, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.LOGi(TAG, "initialized bleExt");
				_bleExtInitialized = true;
				_bleExt.enableEncryption(true); // TODO: should be done by setSettings
				checkReady();
			}

			@Override
			public void onError(int error) {
				BleLog.LOGe(TAG, "error initializing bleExt: " + error);
			}
		});

		_isScanning = false;
		_isTracking = false;
//		_scanFilter = BleDeviceFilter.all;

		// create and bind to the BleScanService
		BleLog.LOGd(TAG, "binding to service..");
		Intent intent = new Intent(_reactContext, BleScanService.class);
		boolean success = _reactContext.bindService(intent, _connection, Context.BIND_AUTO_CREATE);
		BleLog.LOGd(TAG, "success: " + success);

//		_scanService
	}

	@Override
	public String getName() {
		return "BluenetJS";
	}

	@ReactMethod
	public void setSettings(ReadableMap config, Callback callback) {
		BleLog.LOGd(TAG, "setSettings");
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
		callback.invoke(retVal);
	}

	@ReactMethod
	public void isReady(Callback callback) {
		BleLog.LOGd(TAG, "isReady: " + callback);
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
		BleLog.LOGd(TAG, "rerouteEvents");
	}


	@ReactMethod
	public void startScanning() {
		BleLog.LOGd(TAG, "startScanning");
		setScanningState(true);
		_scanService.startIntervalScan(getScanInterval(), getScanPause(), BleDeviceFilter.all);
	}

	@ReactMethod
	public void startScanningForCrownstones() {
		BleLog.LOGd(TAG, "startScanningForCrownstones");
		setScanningState(true);
		_scanService.startIntervalScan(getScanInterval(), getScanPause(), BleDeviceFilter.anyStone);
	}

	@ReactMethod
	public void startScanningForCrownstonesUniqueOnly() {
		// Only emit an event when the data changed
		// TODO: only make it send an event when data changed
		BleLog.LOGd(TAG, "startScanningForCrownstonesUniqueOnly");
		setScanningState(true);
		_scanService.startIntervalScan(getScanInterval(), getScanPause(), BleDeviceFilter.anyStone);
	}

	@ReactMethod
	public void stopScanning() {
		setScanningState(false);
		if (isScannerIdle()) {
			_scanService.stopIntervalScan();
		}
	}

	@ReactMethod
	public void forceClearActiveRegion() {
		// Forces not being in an ibeacon region (not needed for android)
	}

	@ReactMethod
	public void startIndoorLocalization() {
		// Start using the classifier
	}

	@ReactMethod
	public void stopIndoorLocalization() {
		// Stop using the classifier
	}

	@ReactMethod
	public void connect(String uuid, final Callback callback) {
		BleLog.LOGd(TAG, "Connect to " + uuid);
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
				BleLog.LOGi(TAG, "connected");
				if (!_connectCallbackInvoked) {
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					_connectCallbackInvoked = true;
					callback.invoke(retVal);
				}
			}

			@Override
			public void onError(int error) {
				BleLog.LOGi(TAG, "connection error: " + error);
				BleLog.LOGi(TAG, Log.getStackTraceString(new Exception()));
				if (!_connectCallbackInvoked) {
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "failed to connect: " + error);
					_connectCallbackInvoked = true;
					callback.invoke(retVal);
				}
			}
		});
	}

	@ReactMethod
	public void disconnect(final Callback callback) {
		// Command the crownstone to disconnect the phone
		BleLog.LOGd(TAG, "Disconnect");
		// TODO
	}

	@ReactMethod
	public void phoneDisconnect(final Callback callback) {
		// Normal disconnect
		BleLog.LOGd(TAG, "phoneDisconnect");
		_bleExt.disconnectAndClose(false, new IStatusCallback() {
			@Override
			public void onSuccess() {
				BleLog.LOGi(TAG, "disconnected");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				BleLog.LOGi(TAG, "failed to connect: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "failed to disconnect: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void setSwitchState(Float switchState, final Callback callback) {
		if (switchState > 0) {
			_bleExt.relayOn(new IStatusCallback() {
				@Override
				public void onSuccess() {
					BleLog.LOGi(TAG, "relay on success");
					// power was switch off successfully, update the light bulb
//						updateLightBulb(false);
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					callback.invoke(retVal);
				}

				@Override
				public void onError(int error) {
					BleLog.LOGi(TAG, "power on failed: " + error);
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "power on failed: " + error);
					callback.invoke(retVal);
				}
			});
		} else {
			_bleExt.relayOff(new IStatusCallback() {
				@Override
				public void onSuccess() {
					BleLog.LOGi(TAG, "relay off success");
					// power was switch off successfully, update the light bulb
//						updateLightBulb(false);
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					callback.invoke(retVal);
				}

				@Override
				public void onError(int error) {
					BleLog.LOGi(TAG, "power off failed: " + error);
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "power off failed: " + error);
					callback.invoke(retVal);
				}
			});
		}
	}

	@ReactMethod
	public void commandFactoryReset(final Callback callback) {
		_bleExt.writeFactoryReset(new IStatusCallback() {
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
				retVal.putString("data", "factory reset failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void recover(String crownstoneHandle, final Callback callback) {
		String address = crownstoneHandle;
		BleLog.LOGd(TAG, "Recover: " + address);
		_bleExt.recover(address, new IStatusCallback() {
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
				retVal.putString("data", "recover failed: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void setupCrownstone(ReadableMap config, final Callback callback) {
		BleLog.LOGd(TAG, "setup crownstone");
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

		BleLog.LOGd(TAG, "cs id=%d, keys=[%s %s %s], meshaddr=%d, ibeacon=[%s %d %d]", crownstoneId, adminKey, memberKey, guestKey, meshAccessAddress, iBeaconUuid, iBeaconMajor, iBeaconMinor);

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
			BleLog.LOGd(TAG, "Wrong setup data");
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
	public void trackIBeacon(String ibeaconUUID, String sphereId) {
		// Add the uuid to the list of tracked iBeacons, associate it with given sphereId
		// Also starts the tracking
		BleLog.LOGd(TAG, "trackIBeacon: " + ibeaconUUID + " sphereId=" + sphereId);
		UUID uuid = UUID.fromString(ibeaconUUID);
		_iBeaconSphereIds.put(uuid, sphereId);
//		_trackedIBeacons.put(uuid, sphereId);
		_iBeaconRanger.addIbeaconFilter(new BleIbeaconFilter(uuid));
		setTrackingState(true);
		_scanService.startIntervalScan(getScanInterval(), getScanInterval(), BleDeviceFilter.anyStone);
	}

	@ReactMethod
	public void stopTrackingIBeacon(String ibeaconUUID) {
		// Remove the uuid from the list of tracked iBeacons
		BleLog.LOGd(TAG, "stopTrackingIBeacon: " + ibeaconUUID);
		UUID uuid = UUID.fromString(ibeaconUUID);
		_iBeaconRanger.remIbeaconFilter(new BleIbeaconFilter(uuid));
		_iBeaconSphereIds.remove(uuid);
//		_trackedIBeacons.remove(uuid);
	}

	@ReactMethod
	public void pauseTracking() {
		// Pause/stop tracking, but keeps the list of tracked iBeacons.
		BleLog.LOGd(TAG, "pauseTracking");
		setTrackingState(false);
		if (isScannerIdle()) {
			_scanService.stopIntervalScan();
		}
	}

	@ReactMethod
	public void resumeTracking() {
		// Resume/start tracking, with the stored list of tracked iBeacons.
		BleLog.LOGd(TAG, "resumeTracking");
		setTrackingState(true);
		_scanService.startIntervalScan(getScanInterval(), getScanInterval(), BleDeviceFilter.anyStone);
	}

	@ReactMethod
	public void clearTrackedBeacons(Callback callback) {
		// Clear the list of tracked iBeacons and stop tracking.
		Log.d(TAG, "clearTrackedBeacons");
		setTrackingState(false);
		_iBeaconRanger.clearIbeaconFilter();
		_iBeaconSphereIds.clear();
//		_trackedIBeacons.clear();
		if (isScannerIdle()) {
			_scanService.stopIntervalScan();
		}

//		// TODO: remove test
//		// Test
//		UUID uuid = UUID.fromString("b643423e-e175-4af0-a2e4-31e32f729a8a");
//		_iBeaconRanger.addIbeaconFilter(new BleIbeaconFilter(uuid));
//		// End test

		// TODO: what should this return?
		WritableMap retVal = Arguments.createMap();
		retVal.putBoolean("error", false);
		callback.invoke(retVal);
	}



	@ReactMethod
	public void startCollectingFingerprint() {

	}

	@ReactMethod
	public void abortCollectingFingerprint() {

	}

	@ReactMethod
	public void pauseCollectingFingerprint() {

	}

	@ReactMethod
	public void resumeCollectingFingerprint() {

	}

	@ReactMethod
	public void finalizeFingerprint(String sphereId, String locationId) {

	}

	@ReactMethod
	public void getFingerprint(String sphereId, String locationId, Callback callback) {

	}

	@ReactMethod
	public void loadFingerprint(String sphereId, String locationId, String fingerPrint) {

	}



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


	// if the service was connected successfully, the service connection gives us access to the service
	private ServiceConnection _connection = new ServiceConnection() {
		@Override
		public void onServiceConnected(ComponentName name, IBinder service) {
			BleLog.LOGi(TAG, "connected to ble scan service ...");
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
			_scanService.setScanInterval(SLOW_SCAN_INTERVAL);
			// set the scan pause (how many ms should the service wait before starting the next scan)
			_scanService.setScanPause(SLOW_SCAN_PAUSE);

//			_bleExt = _scanService.getBleExt();

			_iBeaconRanger = _scanService.getBleExt().getIbeaconRanger();

			_iBeaconRanger.registerListener(BluenetBridge.this);
			BleLog.LOGd(TAG, "registered: " + BluenetBridge.this);

			_bound = true;
			checkReady();
		}

		@Override
		public void onServiceDisconnected(ComponentName name) {
			BleLog.LOGi(TAG, "disconnected from service");
			_bound = false;
		}
	};

	@Override
	public void onEvent(Event event) {
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
		BleLog.LOGv(TAG, "event scanned device: " + device.getAddress());
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
		CrownstoneServiceData serviceData = device.getServiceData();
		if (serviceData != null) {
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
		}
//		sendEvent("advertisementData", advertisementMap);
		if (device.isValidatedCrownstone()) {
			if (device.isDfuMode()) {
				sendEvent("verifiedDFUAdvertisementData", advertisementMap);
			}
			else if(device.isSetupMode()) {
				sendEvent("verifiedSetupAdvertisementData", advertisementMap);
			}
			else {
				sendEvent("verifiedAdvertisementData", advertisementMap);
			}
			// Clone, to avoid the "already consumed" error
			Bundle advertisementBundle = Arguments.toBundle(advertisementMap);
			WritableMap advertisementMapCopy = Arguments.fromBundle(advertisementBundle);
			sendEvent("anyVerifiedAdvertisementData", advertisementMapCopy);
		}
//		if (device.isIBeacon()) {
//			advertisementMap.putInt("rssi", device.getAverageRssi());
//			sendEvent("iBeaconAdvertisement", advertisementMap);
//		}

		// Check for nearest stone and nearest stone in setup mode
		// TODO: some more intelligent way than looping over the whole sorted list every time.
		BleDeviceList sortedList = _scanService.getBleExt().getDeviceMap().getDistanceSortedList();
		for (BleDevice dev : sortedList) {
			if (dev.isStone() && dev.isSetupMode()) {
				WritableMap nearestMap = Arguments.createMap();
				nearestMap.putString("name", dev.getName());
				nearestMap.putString("handle", dev.getAddress());
				nearestMap.putInt("rssi", dev.getRssi());
				nearestMap.putBoolean("setupMode", dev.isSetupMode());
				sendEvent("nearestSetupCrownstone", nearestMap);
				BleLog.LOGv(TAG, "nearestSetupCrownstone: " + dev);
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
				sendEvent("nearestCrownstone", nearestMap);
				BleLog.LOGv(TAG, "nearestCrownstone: " + dev);
				break;
			}
		}


	}

	@Override
	public void onBeaconScanned(BleDevice device) {
		BleLog.LOGd(TAG, "event scanned beacon: " + device.getAddress());
		WritableMap advertisementMap = Arguments.createMap();
		advertisementMap.putString("id", device.getProximityUuid().toString() + ".Maj:" + device.getMajor() + ".Min:" + device.getMinor());
		advertisementMap.putString("uuid", device.getProximityUuid().toString());
		advertisementMap.putInt("major", device.getMajor());
		advertisementMap.putInt("minor", device.getMinor());
		advertisementMap.putString("referenceId", _iBeaconSphereIds.get(device.getProximityUuid()));
		// TODO: should be once per second with averaged rssi
//		advertisementMap.putInt("rssi", device.getRssi());
		advertisementMap.putInt("rssi", device.getAverageRssi());
//		synchronized (this) {
//			BleLog.LOGv(TAG, "data: " + advertisementMap.toString());
//			_ibeaconAdvertisements.pushMap(advertisementMap);
			_ibeaconAdvertisements.add(advertisementMap);
//		}
//		sendEvent("iBeaconAdvertisement", advertisementMap);
	}

	private Runnable iBeaconTick = new Runnable() {
		@Override
		public void run() {
//			synchronized (this) {
				if (_ibeaconAdvertisements.size() > 0) {
//					BleLog.LOGd(TAG, "sendEvent iBeaconAdvertisement: " + _ibeaconAdvertisements.toString());
//					sendEvent("iBeaconAdvertisement", _ibeaconAdvertisements);
//					_ibeaconAdvertisements = Arguments.createArray();
					BleLog.LOGd(TAG, "sendEvent iBeaconAdvertisement");
					WritableArray array = Arguments.createArray();
					for (WritableMap m : _ibeaconAdvertisements) {
						array.pushMap(m);
					}
					sendEvent("iBeaconAdvertisement", array);
					_ibeaconAdvertisements.clear();
				}
//			}
			_handler.postDelayed(this, IBEACON_TICK_INTERVAL);
		}
	};

	@Override
	public void onRegionEnter(UUID uuid) {
		String referenceId = _iBeaconSphereIds.get(uuid);
		if (referenceId != null) {
			sendEvent("enterSphere", referenceId);
		}
	}

	@Override
	public void onRegionExit(UUID uuid) {
		String referenceId = _iBeaconSphereIds.get(uuid);
		if (referenceId != null) {
			sendEvent("exitSphere", referenceId);
		}
	}

	private void checkReady() {
		BleLog.LOGd(TAG, "checkReady");
		if (_readyCallback == null) {
			return;
		}
		if (!_bound) {
			return;
		}
		if (!_bleExtInitialized) {
			return;
		}

		// TODO: Check for permissions, bluetooth on, localization on, etc.
		BleLog.LOGd(TAG, "ready!");
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

	private boolean isScanning() { return _isScanning; }
	private void setScanningState(boolean enabled) { _isScanning = enabled; }
	private boolean isTracking() { return _isTracking; }
	private void setTrackingState(boolean enabled) { _isTracking = enabled; }
	private boolean isScannerIdle() { return !_isScanning && !_isTracking; }
	private int getScanInterval() {
		if (isScanning()) {
			return FAST_SCAN_INTERVAL;
		}
		return SLOW_SCAN_INTERVAL;
	}
	private int getScanPause() {
		if (isScanning()) {
			return FAST_SCAN_PAUSE;
		}
		return SLOW_SCAN_PAUSE;
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