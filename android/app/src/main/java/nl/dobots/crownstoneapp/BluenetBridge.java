package nl.dobots.crownstoneapp;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import nl.dobots.bluenet.ble.base.callbacks.IDiscoveryCallback;
import nl.dobots.bluenet.ble.base.callbacks.IStatusCallback;
import nl.dobots.bluenet.ble.base.structs.CrownstoneServiceData;
import nl.dobots.bluenet.ble.base.structs.EncryptionKeys;
import nl.dobots.bluenet.ble.cfg.BluenetConfig;
import nl.dobots.bluenet.ble.extended.BleDeviceFilter;
import nl.dobots.bluenet.ble.extended.BleExt;
import nl.dobots.bluenet.ibeacon.BleBeaconRangingListener;
import nl.dobots.bluenet.ibeacon.BleIbeaconFilter;
import nl.dobots.bluenet.ble.extended.structs.BleDevice;
import nl.dobots.bluenet.ble.extended.structs.BleDeviceList;
import nl.dobots.bluenet.ibeacon.BleIbeaconRanging;
import nl.dobots.bluenet.service.BleScanService;
import nl.dobots.bluenet.service.callbacks.EventListener;
import nl.dobots.bluenet.service.callbacks.IntervalScanListener;
import nl.dobots.bluenet.service.callbacks.ScanDeviceListener;

public class BluenetBridge extends ReactContextBaseJavaModule implements IntervalScanListener, EventListener, ScanDeviceListener, BleBeaconRangingListener {
	private static final String TAG = BluenetBridge.class.getCanonicalName();


	public static final int FAST_SCAN_INTERVAL = 20000; // ms scanning
	public static final int FAST_SCAN_PAUSE = 100; // ms pause
	public static final int SLOW_SCAN_INTERVAL = 10000; // ms scanning
	public static final int SLOW_SCAN_PAUSE = 1000; // ms pause
	private boolean _bound;

	private ReactApplicationContext _reactContext;
	private BleScanService _scanService;
//	private BleScanService _trackService;
//	private BleBase _bleBase;
	private BleExt _bleExt;
	private BleIbeaconRanging _iBeaconRanger;

//	private Map<UUID, String> _trackedIBeacons = new HashMap<>();

	private Callback _readyCallback = null;

	private boolean _isScanning;
	private boolean _isTracking;
//	private BleDeviceFilter _scanFilter;

	private Map<UUID, String> _iBeaconSphereIds = new HashMap<>();

	public BluenetBridge(ReactApplicationContext reactContext) {
		super(reactContext);
		_reactContext = reactContext;
//		_bleBase = new BleBase();
//		_bleExt = new BleExt();
//		_bleExt.init(_reactContext, new IStatusCallback() {
//			@Override
//			public void onSuccess() {
//				Log.v(TAG, "onSuccess");
//			}
//
//			@Override
//			public void onError(int error) {
//				Log.e(TAG, "onError: " + error);
//			}
//		});

		_isScanning = false;
		_isTracking = false;
//		_scanFilter = BleDeviceFilter.all;

		// create and bind to the BleScanService
		Log.d(TAG, "binding to service..");
		Intent intent = new Intent(_reactContext, BleScanService.class);
		boolean success = _reactContext.bindService(intent, _connection, Context.BIND_AUTO_CREATE);
		Log.d(TAG, "success: " + success);


//		_scanService
	}

	@Override
	public String getName() {
		return "BluenetJS";
	}

	@ReactMethod
	public void setSettings(ReadableMap config, Callback callback) {
		Log.d(TAG, "setSettings");
		// keys can be either in plain string or hex string format, check length to determine which


//		String adminKey = null;
//		if (config.hasKey("adminKey")) {
//			adminKey = config.getString("adminKey");
//		}
//		String memberKey = null;
//		if (config.hasKey("memberKey")) {
//			memberKey = config.getString("memberKey");
//		}
//		String guestKey = null;
//		if (config.hasKey("guestKey")) {
//			guestKey = config.getString("guestKey");
//		}
//		if (guestKey != null || memberKey != null || adminKey != null) {
//		_   scanService.getBleExt().getBleBase().setEncryptionKeys(new EncryptionKeys(adminKey, memberKey, guestKey));
//		}
		// TODO: Does getString() return null if the field doesn't exist?
		String adminKey = config.getString("adminKey");
		String memberKey = config.getString("memberKey");
		String guestKey = config.getString("guestKey");
		if (adminKey == null || adminKey.length() != 16) {
			adminKey = null;
		}
		if (memberKey == null || memberKey.length() != 16) {
			memberKey = null;
		}
		if (guestKey == null || guestKey.length() != 16) {
			guestKey = null;
		}
		_scanService.getBleExt().getBleBase().setEncryptionKeys(new EncryptionKeys(adminKey, memberKey, guestKey));

		WritableMap retVal = Arguments.createMap();
		if (config.hasKey("encryptionEnabled")) {
			boolean enableEncryption = config.getBoolean("encryptionEnabled");
			if (enableEncryption && guestKey == null && memberKey == null && adminKey == null) {
				retVal.putBoolean("error", true);
				retVal.putString("data", "no key supplied");
			}
			else {
				_scanService.getBleExt().getBleBase().enableEncryption(enableEncryption);
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
		Log.d(TAG, "isReady: " + callback);
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
		Log.d(TAG, "rerouteEvents");
	}


	@ReactMethod
	public void startScanning() {
		Log.d(TAG, "startScanning");
		setScanningState(true);
		_scanService.startIntervalScan(getScanInterval(), getScanPause(), BleDeviceFilter.all);
	}

	@ReactMethod
	public void startScanningForCrownstones() {
		Log.d(TAG, "startScanningForCrownstones");
		setScanningState(true);
		_scanService.startIntervalScan(getScanInterval(), getScanPause(), BleDeviceFilter.anyStone);
	}

	@ReactMethod
	public void startScanningForCrownstonesUniqueOnly() {
		// Only emit an event when the data changed
		// TODO: only make it send an event when data changed
		Log.d(TAG, "startScanningForCrownstonesUniqueOnly");
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
	public void connect(String uuid, final Callback callback) {
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
				Log.i(TAG, "connected");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				Log.i(TAG, "failed to connect: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "failed to connect: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void disconnect(final Callback callback) {
		_bleExt.disconnectAndClose(false, new IStatusCallback() {
			@Override
			public void onSuccess() {
				Log.i(TAG, "disconnected");
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", false);
				callback.invoke(retVal);
			}

			@Override
			public void onError(int error) {
				Log.i(TAG, "failed to connect: " + error);
				WritableMap retVal = Arguments.createMap();
				retVal.putBoolean("error", true);
				retVal.putString("data", "failed to disconnect: " + error);
				callback.invoke(retVal);
			}
		});
	}

	@ReactMethod
	public void phoneDisconnect(Callback callback) {

	}

	@ReactMethod
	public void setSwitchState(Float switchState, final Callback callback) {
		if (switchState > 0) {
			_bleExt.relayOn(new IStatusCallback() {
				@Override
				public void onSuccess() {
					Log.i(TAG, "relay on success");
					// power was switch off successfully, update the light bulb
//						updateLightBulb(false);
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					callback.invoke(retVal);
				}

				@Override
				public void onError(int error) {
					Log.i(TAG, "power on failed: " + error);
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "power on failed: " + error);
					callback.invoke();
				}
			});
		} else {
			_bleExt.relayOff(new IStatusCallback() {
				@Override
				public void onSuccess() {
					Log.i(TAG, "relay off success");
					// power was switch off successfully, update the light bulb
//						updateLightBulb(false);
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", false);
					callback.invoke(retVal);
				}

				@Override
				public void onError(int error) {
					Log.i(TAG, "power off failed: " + error);
					WritableMap retVal = Arguments.createMap();
					retVal.putBoolean("error", true);
					retVal.putString("data", "power off failed: " + error);
					callback.invoke();
				}
			});
		}
	}

	@ReactMethod
	public void commandFactoryReset(Callback callback) {

	}

	@ReactMethod
	public void recover(String crownstoneUUID, Callback callback) {

	}

	@ReactMethod
	public void setupCrownstone(String configJson, Callback callback) {
		// keys can be either in plain string or hex string format, check length to determine which

		// Data:
		// int crownstoneId
		// string adminKey
		// string  memberKey
		// string  guestKey
		// int  meshAccessAddress
		//   ibeaconUUID
		//   ibeaconMajor
		//   ibeaconMinor

	}

	@ReactMethod
	public void getMACAddress(Callback callback) {
		WritableMap retVal = Arguments.createMap();
		if (_bleExt.isConnected(null)) {
			retVal.putBoolean("error", false);
			retVal.putString("macAddress", _bleExt.getTargetAddress()); // TODO: find out correct key and value format
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
		Log.d(TAG, "trackIBeacon: " + ibeaconUUID + " sphereId=" + sphereId);
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
		Log.d(TAG, "stopTrackingIBeacon: " + ibeaconUUID);
		UUID uuid = UUID.fromString(ibeaconUUID);
		_iBeaconRanger.remIbeaconFilter(new BleIbeaconFilter(uuid));
		_iBeaconSphereIds.remove(uuid);
//		_trackedIBeacons.remove(uuid);
	}

	@ReactMethod
	public void pauseTracking() {
		// Pause/stop tracking, but keeps the list of tracked iBeacons.
		Log.d(TAG, "pauseTracking");
		setTrackingState(false);
		if (isScannerIdle()) {
			_scanService.stopIntervalScan();
		}
	}

	@ReactMethod
	public void resumeTracking() {
		// Resume/start tracking, with the stored list of tracked iBeacons.
		Log.d(TAG, "resumeTracking");
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

	private void sendEvent(String eventName, @Nullable String params) {
		_reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
	}


	// if the service was connected successfully, the service connection gives us access to the service
	private ServiceConnection _connection = new ServiceConnection() {
		@Override
		public void onServiceConnected(ComponentName name, IBinder service) {
			Log.i(TAG, "connected to ble scan service ...");
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

			_bleExt = _scanService.getBleExt();

			_iBeaconRanger = _bleExt.getIbeaconRanger();

			_iBeaconRanger.registerListener(BluenetBridge.this);
			Log.d(TAG, "registered: " + BluenetBridge.this);

			_bound = true;
			checkReady();
		}

		@Override
		public void onServiceDisconnected(ComponentName name) {
			Log.i(TAG, "disconnected from service");
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
		Log.d(TAG, "event scanned device: " + device.getAddress());
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
//			BluenetConfig.CROWNSTONE_PLUG_SERVICE_DATA_UUID
//			Log.d(TAG, "CS ServiceUUID byte 0: " + String.format("%02x", (BluenetConfig.CROWNSTONE_PLUG_SERVICE_DATA_UUID & 0xFF)));
//			Log.d(TAG, "CS ServiceUUID byte 1: " + String.format("%02x", ((BluenetConfig.CROWNSTONE_PLUG_SERVICE_DATA_UUID >> 8) & 0xFF)));

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
		BleDeviceList sortedList = _bleExt.getDeviceMap().getDistanceSortedList();
		for (BleDevice dev : sortedList) {
			if (dev.isStone() && dev.isSetupMode()) {
				WritableMap nearestMap = Arguments.createMap();
				nearestMap.putString("name", dev.getName());
				nearestMap.putString("handle", dev.getAddress());
				nearestMap.putInt("rssi", dev.getRssi());
				nearestMap.putBoolean("setupMode", dev.isSetupMode());
				sendEvent("nearestSetupCrownstone", nearestMap);
				Log.d(TAG, "nearestSetupCrownstone: " + dev);
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
				Log.d(TAG, "nearestCrownstone: " + dev);
				break;
			}
		}


	}

	@Override
	public void onBeaconScanned(BleDevice device) {
		Log.d(TAG, "event scanned beacon: " + device.getAddress());
		WritableMap advertisementMap = Arguments.createMap();
		advertisementMap.putString("id", device.getProximityUuid().toString() + ".Maj:" + device.getMajor() + ".Min:" + device.getMinor());
		advertisementMap.putString("uuid", device.getProximityUuid().toString());
		advertisementMap.putInt("major", device.getMajor());
		advertisementMap.putInt("minor", device.getMinor());
		advertisementMap.putString("referenceId", _iBeaconSphereIds.get(device.getProximityUuid()));
		// TODO: should be once per second with averaged rssi
//		advertisementMap.putInt("rssi", device.getRssi());
		advertisementMap.putInt("rssi", device.getAverageRssi());
//		Log.d(TAG, "data: " + advertisementMap.toString());
		sendEvent("iBeaconAdvertisement", advertisementMap);
	}

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
		Log.d(TAG, "checkReady");
		if (_readyCallback == null) {
			return;
		}
		if (!_bound) {
			return;
		}
		// TODO: Check for permissions, bluetooth on, localization on, etc.
		Log.d(TAG, "ready!");
		WritableMap retVal = Arguments.createMap();
		retVal.putBoolean("error", false);
		_readyCallback.invoke(retVal);
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