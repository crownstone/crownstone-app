package rocks.crownstone.consumerapp;

import android.content.Context;
import com.facebook.react.PackageList;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;

import java.lang.reflect.InvocationTargetException;
import java.util.List;

// According to https://docs.bugsnag.com/build-integrations/gradle/
import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.BugsnagPackage;
import com.bugsnag.android.BugsnagReactNativePlugin;

public class MainApplication extends NavigationApplication {

	private final ReactNativeHost mReactNativeHost =
			new NavigationReactNativeHost(this) {
				@Override
				public boolean getUseDeveloperSupport() {
					return BuildConfig.DEBUG;
				}

				@Override
				protected List<ReactPackage> getPackages() {
					@SuppressWarnings("UnnecessaryLocalVariable")
					List<ReactPackage> packages = new PackageList(this).getPackages();
					// Packages that cannot be autolinked yet can be added manually here, for example:
					// packages.add(new MyReactNativePackage());
					packages.add(new BluenetBridgePacket());
					return packages;
				}

				@Override
				protected String getJSMainModuleName() {
					return "index";
				}
			};

	@Override
	public ReactNativeHost getReactNativeHost() {
		return mReactNativeHost;
	}

	@Override
	public void onCreate() {
		super.onCreate();
		// According to https://docs.bugsnag.com/build-integrations/gradle/
		Bugsnag.start(this);
		SoLoader.init(this, /* native exopackage */ false);
		initializeFlipper(this, getReactNativeHost().getReactInstanceManager()); // Remove this line if you don't want Flipper enabled
	}

	/**
	 * Loads Flipper in React Native templates.
	 *
	 * @param context
	 */
	private static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
		if (BuildConfig.DEBUG) {
			try {
			/*
			 We use reflection here to pick up the class that initializes Flipper,
			 since Flipper library is not available in release mode
			*/
				Class<?> aClass = Class.forName("com.helloworld.ReactNativeFlipper");
				aClass
						.getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
						.invoke(null, context, reactInstanceManager);
			} catch (ClassNotFoundException e) {
				e.printStackTrace();
			} catch (NoSuchMethodException e) {
				e.printStackTrace();
			} catch (IllegalAccessException e) {
				e.printStackTrace();
			} catch (InvocationTargetException e) {
				e.printStackTrace();
			}
		}
	}
}
