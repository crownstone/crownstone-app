package nl.dobots.crownstoneapp;

import android.content.ComponentName;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.telecom.Call;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import nl.dobots.bluenet.ble.base.callbacks.IStatusCallback;
import nl.dobots.bluenet.ble.extended.BleExt;
import nl.dobots.bluenet.ble.extended.structs.BleDevice;
import nl.dobots.bluenet.service.BleScanService;
import nl.dobots.bluenet.service.callbacks.EventListener;
import nl.dobots.bluenet.service.callbacks.IntervalScanListener;
import nl.dobots.bluenet.service.callbacks.ScanDeviceListener;

public class BluenetBridge extends ReactContextBaseJavaModule implements IntervalScanListener, EventListener, ScanDeviceListener {
	private static final String TAG = BluenetBridge.class.getCanonicalName();

	// scan for 1 second every 3 seconds
	public static final int LOW_SCAN_INTERVAL = 10000; // 1 second scanning
	public static final int LOW_SCAN_PAUSE = 2000; // 2 seconds pause
	private boolean _bound;

	private ReactApplicationContext _reactContext;
	private BleScanService _scanService;
	private BleExt _bleExt;

	public BluenetBridge(ReactApplicationContext reactContext) {
		super(reactContext);
		_reactContext = reactContext;
		_bleExt = new BleExt();
		_bleExt.init(_reactContext, new IStatusCallback() {
			@Override
			public void onSuccess() {
				Log.v(TAG, "onSuccess");
			}

			@Override
			public void onError(int error) {
				Log.e(TAG, "onError: " + error);
			}
		});

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

	}

	@ReactMethod
	public void startScanningForCrownstones() {

	}

	@ReactMethod
	public void startScanningForService(String serviceId) {

	}

	@ReactMethod
	public void stopScanning() {

	}

	@ReactMethod
	public void connect(String uuid, Callback callback) {

	}

	@ReactMethod
	public void disconnect(Callback callback) {

	}

	@ReactMethod
	public void phoneDisconnect(Callback callback) {

	}

	@ReactMethod
	public void setSwitchState(Integer switchState, Callback callback) {

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