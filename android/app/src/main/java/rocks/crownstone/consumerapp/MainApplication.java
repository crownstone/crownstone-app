package rocks.crownstone.consumerapp;

import android.app.Application;
import android.content.Context;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;

import ca.jaysoo.extradimensions.ExtraDimensionsPackage;
import com.airbnb.android.react.maps.MapsPackage;
import com.cmcewen.blurview.BlurViewPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativecommunity.slider.ReactSliderPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.horcrux.svg.SvgPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import org.reactnative.camera.RNCameraPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.corbt.keepawake.KCKeepAwakePackage;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.rnfs.RNFSPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
//import com.facebook.react.modules.storage.ReactDatabaseSupplier;
//import com.facebook.react.ReactNativeHost;
//import com.facebook.react.ReactPackage;
//import com.facebook.react.shell.MainReactPackage;
//import com.facebook.soloader.SoLoader;
//import com.reactnativenavigation.react.ReactGateway;
//import com.reactnativenavigation.react.SyncUiImplementation;

import java.lang.reflect.InvocationTargetException;
import java.util.List;


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
		SoLoader.init(this, /* native exopackage */ false);
		initializeFlipper(this); // Remove this line if you don't want Flipper enabled
	}

	/**
	 * Loads Flipper in React Native templates.
	 *
	 * @param context
	 */
	private static void initializeFlipper(Context context) {
		if (BuildConfig.DEBUG) {
			try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
				Class<?> aClass = Class.forName("com.facebook.flipper.ReactNativeFlipper");
				aClass.getMethod("initializeFlipper", Context.class).invoke(null, context);
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

//public class MainApplication extends NavigationApplication {
//
//	@Override
//	protected ReactGateway createReactGateway() {
//		ReactNativeHost host = new NavigationReactNativeHost(this, isDebug(), createAdditionalReactPackages()) {
//			@Override
//			protected String getJSMainModuleName() {
//				return "index";
//			}
//
////			@Override
////			protected UIImplementationProvider getUIImplementationProvider() {
////				return new SyncUiImplementation.Provider();
////			}
//		};
//		return new ReactGateway(this, isDebug(), host);
//	}
//
//	@Override
//	public boolean isDebug() {
//		return BuildConfig.DEBUG;
//	}
//
//	protected List<ReactPackage> getPackages() {
//		// Add additional packages you require here
//		// No need to add RnnPackage and MainReactPackage
//		return Arrays.<ReactPackage>asList(
//				new BluenetBridgePacket(),
//				new MainReactPackage(),
//				new RNGestureHandlerPackage(),
//				new ReanimatedPackage(),
//                new ExtraDimensionsPackage(),
//            	new BlurViewPackage(),
//				new RNCameraPackage(),
//				new AsyncStoragePackage(),
//				new ReactSliderPackage(),
//				new VectorIconsPackage(),
//				new SvgPackage(),
//				new ImageResizerPackage(),
//				new RNFSPackage(),
//				new KCKeepAwakePackage(),
//				new SplashScreenReactPackage(),
//				new RNSentryPackage(),
//				new RNDeviceInfo(),
//				new ReactNativePushNotificationPackage(),
//				new MapsPackage()
//		);
//	}
//
//	@Override
//	public List<ReactPackage> createAdditionalReactPackages() {
//		return getPackages();
//	}
//
//	@Override
//	public void onCreate() {
//		super.onCreate();
////		long size = 50L * 1024L * 1024L; // 50 MB
////		ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(size);
////
//	}
//}
