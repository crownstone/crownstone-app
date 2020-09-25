/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Jan 15, 2019
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class BluenetBridgePacket implements ReactPackage {
	private static BluenetBridge bluenetBridge = null;

	@Override
	public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
		List<NativeModule> modules = new ArrayList<>();
		bluenetBridge = new BluenetBridge(reactContext);
		modules.add(bluenetBridge);
		return modules;
	}

	@Override
	public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
		return Collections.emptyList();
	}

	public static void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
		if (bluenetBridge != null) {
			bluenetBridge.onRequestPermissionsResult(requestCode, permissions, grantResults);
		}
	}

	public static void onTrimMemory(int level) {
		if (bluenetBridge != null) {
			bluenetBridge.onTrimMemory(level);
		}
	}
}
