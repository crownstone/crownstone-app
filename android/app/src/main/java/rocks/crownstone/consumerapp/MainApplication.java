package rocks.crownstone.consumerapp;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.cmcewen.blurview.BlurViewPackage;
import com.wix.RNCameraKit.RNCameraKitPackage;
import com.cboy.rn.splashscreen.SplashScreenReactPackage;
import io.sentry.RNSentryPackage;
import com.corbt.keepawake.KCKeepAwakePackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.facebook.react.flat.FlatUIImplementationProvider;
import com.facebook.react.modules.storage.ReactDatabaseSupplier;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.oblador.vectoricons.VectorIconsPackage;
import com.horcrux.svg.SvgPackage;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.rnfs.RNFSPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.lwansbrough.RCTCamera.RCTCameraPackage;
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
            new BlurViewPackage(),
            new RNCameraKitPackage(),
            		new SplashScreenReactPackage(),
					new RNSentryPackage(MainApplication.this),
					new KCKeepAwakePackage(),
					new VectorIconsPackage(),
					new SvgPackage(),
					new ImageResizerPackage(),
					new RNFSPackage(),
					new RNDeviceInfo(),
					new RCTCameraPackage(),
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
