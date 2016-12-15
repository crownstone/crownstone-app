package nl.dobots.crownstoneapp;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.vanport.errorreporter.ErrorReporterPackage;
import com.mehcode.reactnative.splashscreen.SplashScreenPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.horcrux.svg.RNSvgPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.rnfs.RNFSPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.lwansbrough.RCTCamera.RCTCameraPackage;
import com.mehcode.reactnative.splashscreen.SplashScreenPackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;


import java.util.Arrays;
import java.util.List;

import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.rnfs.RNFSPackage;
import com.lwansbrough.RCTCamera.RCTCameraPackage;

public class MainApplication extends Application implements ReactApplication {

	private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
		@Override
		protected boolean getUseDeveloperSupport() {
			return BuildConfig.DEBUG;
		}

		@Override
		protected List<ReactPackage> getPackages() {
			return Arrays.<ReactPackage>asList(
					new BluenetBridgePacket(),
					new MainReactPackage(),
					new VectorIconsPackage(),
					new RNSvgPackage(),
					new RandomBytesPackage(),
					new ImageResizerPackage(),
					new RNFSPackage(),
					new RNDeviceInfo(),
					new RCTCameraPackage(),
					new SplashScreenPackage()
			);
		}
	};

	@Override
	public ReactNativeHost getReactNativeHost() {
		return mReactNativeHost;
	}
}
