package nl.dobots.crownstoneapp;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.telecom.Call;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;

import nl.dobots.bluenet.ble.base.BleBase;
import nl.dobots.bluenet.ble.base.callbacks.IDataCallback;
import nl.dobots.bluenet.ble.base.callbacks.IDiscoveryCallback;
import nl.dobots.bluenet.ble.base.callbacks.IStatusCallback;
import nl.dobots.bluenet.ble.base.structs.CrownstoneServiceData;
import nl.dobots.bluenet.ble.extended.BleDeviceFilter;
import nl.dobots.bluenet.ble.extended.BleExt;
import nl.dobots.bluenet.ble.extended.callbacks.IBleDeviceCallback;
import nl.dobots.bluenet.ble.extended.structs.BleDevice;
import nl.dobots.bluenet.service.BleScanService;
import nl.dobots.bluenet.service.callbacks.EventListener;
import nl.dobots.bluenet.service.callbacks.IntervalScanListener;
import nl.dobots.bluenet.service.callbacks.ScanDeviceListener;

import static nl.dobots.bluenet.ble.extended.BleDeviceFilter.crownstone;

public class BluenetBridge extends ReactContextBaseJavaModule implements IntervalScanListener, EventListener, ScanDeviceListener {
	private static final String TAG = BluenetBridge.class.getCanonicalName();

	// scan for 1 second every 3 seconds
	public static final int LOW_SCAN_INTERVAL = 10000; // 1 second scanning
	public static final int LOW_SCAN_PAUSE = 2000; // 2 seconds pause
	private boolean _bound;

	private ReactApplicationContext _reactContext;
	private BleScanService _scanService;
//	private BleBase _bluenet;
	private BleExt _bluenet;

	private Callback _readyCallback = null;

	public BluenetBridge(ReactApplicationContext reactContext) {
		super(reactContext);
		_reactContext = reactContext;
//		_bluenet = new BleBase();
		_bluenet = new BleExt();
		_bluenet.init(_reactContext, new IStatusCallback() {
			@Override
			public void onSuccess() {
				Log.v(TAG, "onSuccess");
			}

			@Override
			public void onError(int error) {
				Log.e(TAG, "onError: " + error);
			}
		});

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
	public void setSettings(String configJson, Callback callback) {

	}

	@ReactMethod
	public void isReady(Callback callback) {
		// TODO: what is isReady gets called twice before ready?
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
	}

	@ReactMethod
	public void startScanning() {
//		_scanService.startIntervalScan(2000, 50, BleDeviceFilter.all);
	}

	@ReactMethod
	public void startScanningForCrownstones() {
//		_bluenet.setScanFilter(crownstone);
//		_bluenet.startScan(true, new IBleDeviceCallback() {
//			@Override
//			public void onDeviceScanned(BleDevice device) {
//				Log.d(TAG, "cb scanned device:" + device);
//			}
//
//			@Override
//			public void onError(int error) {
//				Log.i(TAG, "scan error: " + error);
//			}
//		});
		Log.d(TAG, "start scan");
		_scanService.startIntervalScan(2000, 50, BleDeviceFilter.crownstone);
	}

	@ReactMethod
	public void startScanningForCrownstonesUniqueOnly() {

	}

	@ReactMethod
	public void startScanningForService(String serviceId) {

	}

	@ReactMethod
	public void stopScanning() {
		_scanService.stopIntervalScan();
	}

	@ReactMethod
	public void connect(String uuid, final Callback callback) {
//		_bluenet.connectDevice(uuid, 3, new IDataCallback() {
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
		_bluenet.connectAndDiscover(uuid, new IDiscoveryCallback() {
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
		_bluenet.disconnectAndClose(false, new IStatusCallback() {
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
			_bluenet.relayOn(new IStatusCallback() {
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
			_bluenet.relayOff(new IStatusCallback() {
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

	}

	@ReactMethod
	public void getMACAddress(Callback callback) {

	}

	@ReactMethod
	public void trackIBeacon(String groupUuid, String groupId) {

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
	public void resumeIBeaconTracking() {

	}

	@ReactMethod
	public void stopIBeaconTracking() {

	}

	@ReactMethod
	public void clearTrackedBeacons(Callback callback) {

	}

	@ReactMethod
	public void finalizeFingerprint(String groupId, String locationId) {

	}

	@ReactMethod
	public void getFingerprint(String groupId, String locationId, Callback callback) {

	}

	@ReactMethod
	public void loadFingerprint(String groupId, String locationId, String fingerPrint) {

	}



	private void sendEvent(String eventName, @Nullable WritableMap params) {
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
			_scanService.setScanInterval(LOW_SCAN_INTERVAL);
			// set the scan pause (how many ms should the service wait before starting the next scan)
			_scanService.setScanPause(LOW_SCAN_PAUSE);

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
		// TODO: send out event
		Log.d(TAG, "event scanned device: " + device.getAddress());
		WritableMap advertisementMap = Arguments.createMap();
		advertisementMap.putString("handle", device.getAddress());
		advertisementMap.putString("name", device.getName());
		advertisementMap.putInt("rssi", device.getRssi());
		advertisementMap.putBoolean("setupPackage", false); // TODO determine if this is a setup package
		advertisementMap.putBoolean("isCrownstone", device.isCrownstone());
		if (device.getProximityUuid() != null) {
			advertisementMap.putString("serviceUUID", device.getProximityUuid().toString()); // TODO: what string is expected?
		}
		else {
			advertisementMap.putString("serviceUUID", "1337");
		}
		WritableMap serviceDataMap = Arguments.createMap();
		CrownstoneServiceData serviceData = device.getServiceData();
		if (serviceData != null) {
			serviceDataMap.putInt("firmwareVersion", 0); // TODO: get firmware version
			serviceDataMap.putInt("crownstoneId", serviceData.getCrownstoneId());
			serviceDataMap.putInt("switchState", serviceData.getSwitchState());
			serviceDataMap.putInt("eventBitmask", serviceData.getEventBitmask());
			serviceDataMap.putInt("temperature", serviceData.getTemperature());
			serviceDataMap.putInt("powerUsage", serviceData.getPowerUsage());
			serviceDataMap.putInt("accumulatedEnergy", serviceData.getAccumulatedEnergy());
			serviceDataMap.putBoolean("newDataAvailable", false); // TODO: get this from eventBitmask
			serviceDataMap.putBoolean("stateOfExternalCrownstone", false); // TODO: get this from eventBitmask
			serviceDataMap.putBoolean("setupMode", false); // TODO: get this from eventBitmask
			serviceDataMap.putString("random", "bla"); // TODO: get this from servicedata
			advertisementMap.putMap("serviceData", serviceDataMap);
		}
		sendEvent("advertisementData", advertisementMap);
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
		WritableMap retVal = Arguments.createMap();
		retVal.putBoolean("error", false);
		_readyCallback.invoke(retVal);
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