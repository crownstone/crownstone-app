
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings([
  'Module RCTImageLoader requires',
  'Module ToastManager',
  'Warning: componentWillUpdate is deprecated',
  'Warning: componentWillMount is deprecated',
  'Warning: componentWillReceiveProps is deprecated',
  'Module RNWebGLTextureLoader requires main queue setup',
])

import { AppRegistry, Platform } from 'react-native';
import { Root } from './App';

import { config } from './sentrySettings'
import { Sentry, SentryLog } from 'react-native-sentry';
import {USE_SENTRY} from "./js/ExternalConfig";

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

AppRegistry.registerComponent('Crownstone', () => Root);