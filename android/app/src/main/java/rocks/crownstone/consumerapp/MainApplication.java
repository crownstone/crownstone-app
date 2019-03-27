package rocks.crownstone.consumerapp;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.horcrux.svg.SvgPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import io.sentry.RNSentryPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.corbt.keepawake.KCKeepAwakePackage;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.rnfs.RNFSPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.wix.RNCameraKit.RNCameraKitPackage;
import com.facebook.react.modules.storage.ReactDatabaseSupplier;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;


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
            new RNGestureHandlerPackage(),
					new VectorIconsPackage(),
					new SvgPackage(),
					new ImageResizerPackage(),
					new RNFSPackage(),
					new KCKeepAwakePackage(),
					new RNCameraKitPackage(),
					new SplashScreenReactPackage(),
					new RNSentryPackage(),
					new RNDeviceInfo(),
					new ReactNativePushNotificationPackage()
			);
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
		long size = 50L * 1024L * 1024L; // 50 MB
		ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(size);
		SoLoader.init(this, /* native exopackage */ false);
	}
}
