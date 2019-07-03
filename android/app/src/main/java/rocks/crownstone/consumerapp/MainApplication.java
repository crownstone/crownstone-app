package rocks.crownstone.consumerapp;


import com.dylanvann.fastimage.FastImageViewPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativecommunity.slider.ReactSliderPackage;
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
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;
import com.reactnativenavigation.react.ReactGateway;

import java.util.Arrays;
import java.util.List;


public class MainApplication extends NavigationApplication {

	@Override
	protected ReactGateway createReactGateway() {
		ReactNativeHost host = new NavigationReactNativeHost(this, isDebug(), createAdditionalReactPackages()) {
			@Override
			protected String getJSMainModuleName() {
				return "index";
			}
		};
		return new ReactGateway(this, isDebug(), host);
	}

	@Override
	public boolean isDebug() {
		return BuildConfig.DEBUG;
	}

	protected List<ReactPackage> getPackages() {
		// Add additional packages you require here
		// No need to add RnnPackage and MainReactPackage
		return Arrays.<ReactPackage>asList(
				new BluenetBridgePacket(),
				new MainReactPackage(),
				new FastImageViewPackage(),
				new AsyncStoragePackage(),
				new ReactSliderPackage(),
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
	public List<ReactPackage> createAdditionalReactPackages() {
		return getPackages();
	}

	@Override
	public void onCreate() {
		super.onCreate();
		long size = 50L * 1024L * 1024L; // 50 MB
		ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(size);
		SoLoader.init(this, /* native exopackage */ false);
	}
}
