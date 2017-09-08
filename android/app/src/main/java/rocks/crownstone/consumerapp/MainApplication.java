package rocks.crownstone.consumerapp;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.corbt.keepawake.KCKeepAwakePackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.facebook.react.flat.FlatUIImplementationProvider;
import com.facebook.react.modules.storage.ReactDatabaseSupplier;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.mehcode.reactnative.splashscreen.SplashScreenPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.horcrux.svg.SvgPackage;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.rnfs.RNFSPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.lwansbrough.RCTCamera.RCTCameraPackage;
//import com.mehcode.reactnative.splashscreen.SplashScreenPackage;
//import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.rnfs.RNFSPackage;
import com.lwansbrough.RCTCamera.RCTCameraPackage;

public class MainApplication extends Application implements ReactApplication {

	private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
		@Override
		public boolean getUseDeveloperSupport() {
			return BuildConfig.DEBUG;
		}

		@Override
		protected List<ReactPackage> getPackages() {
			return Arrays.<ReactPackage>asList(
					new BluenetBridgePacket(),
					new MainReactPackage(),
					new KCKeepAwakePackage(),
					new VectorIconsPackage(),
					new SvgPackage(),
					new ImageResizerPackage(),
					new RNFSPackage(),
					new RNDeviceInfo(),
					new RCTCameraPackage(),
					new SplashScreenPackage(),
					new ReactNativePushNotificationPackage()
			);
		}

//		@Override
//		protected UIImplementationProvider getUIImplementationProvider() {
//			return new FlatUIImplementationProvider();
//		}
	};

	@Override
	public ReactNativeHost getReactNativeHost() {
		return mReactNativeHost;
	}

	@Override
	public void onCreate() {
		super.onCreate();
		long size = 50L * 1024L * 1024L; // 50 MB
		ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(size);
		SoLoader.init(this, /* native exopackage */ false);
	}
}
