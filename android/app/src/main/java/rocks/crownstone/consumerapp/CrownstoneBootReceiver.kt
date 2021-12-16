package rocks.crownstone.consumerapp

import android.app.Application
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactInstanceManager.ReactInstanceEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import rocks.crownstone.bluenet.util.Log
import rocks.crownstone.consumerapp.MainApplication


class CrownstoneBootReceiver: BroadcastReceiver() {
	private val TAG = this.javaClass.simpleName

	override fun onReceive(context: Context, intent: Intent?) {
		Log.e(TAG, "Handle boot event: context=$context context.applicationContext=${context.applicationContext} intent=$intent extras=${intent?.extras}")

		// The react code has to run on the main thread.
		val handler = Handler(Looper.getMainLooper())
		handler.post {
			// Construct and load our normal React JS code bundle
			val application = context.applicationContext as ReactApplication
			val reactInstanceManager: ReactInstanceManager = application.reactNativeHost.reactInstanceManager
			val reactContext = reactInstanceManager.currentReactContext

			if (reactContext != null) {
				// Already exists, we can use the reactContext.
			}
            else {
                // Create react context and wait for result.
				reactInstanceManager.addReactInstanceEventListener(object : ReactInstanceEventListener {
					override fun onReactContextInitialized(context: ReactContext) {
						reactInstanceManager.removeReactInstanceEventListener(this)
						// React context can now be used.
					}
				})
				if (!reactInstanceManager.hasStartedCreatingInitialContext()) {
					reactInstanceManager.createReactContextInBackground()
				}
			}
		}

	}
}