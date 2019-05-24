import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings([
  'Module RCTImageLoader requires',
  'Module ToastManager',
  'Require cycles*',
  'Warning: componentWillUpdate is deprecated',
  'Warning: componentWillMount is deprecated',
  'Warning: componentWillReceiveProps is deprecated',
  'Module RNWebGLTextureLoader requires main queue setup',
  // RN 0.58.6 ships with RNCameraRoll with this issue: https://github.com/facebook/react-native/issues/23755:
  'Module RCTImagePickerManager requires main queue setup since it overrides `init`',
])

import 'react-native-gesture-handler'
import { Platform } from 'react-native';

import { config } from './sentrySettings'
import { Sentry, SentryLog } from 'react-native-sentry';
import { USE_SENTRY } from "./js/ExternalConfig";
import { loadRoutes } from "./js/router/Routes";
import { BackgroundProcessHandler } from "./js/backgroundProcesses/BackgroundProcessHandler";

if (USE_SENTRY) {
  let sentryConfig = {
    deactivateStacktraceMerging: true,
    autoBreadcrumbs: {
      'xhr': false,      // XMLHttpRequest
      'console': false,  // console logs
    }
  }

  if (Platform.OS === 'android') {
    if (config.android) {
      Sentry.config(config.android, sentryConfig).install();
    }
  }
  else {
    if (config.ios) {
      Sentry.config(config.ios, sentryConfig).install();
    }
  }

  Sentry.captureBreadcrumb({
    category: 'AppState',
    data: {
      state: "started",
    }
  });
}


loadRoutes();
BackgroundProcessHandler.start();

// AppRegistry.registerComponent('Crownstone', () => Root);