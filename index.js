
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings([
  'Module RCTImageLoader requires',
  'Module ToastManager',
  'Warning: componentWillUpdate is deprecated',
  'Warning: componentWillMount is deprecated',
  'Warning: componentWillReceiveProps is deprecated',
]);

import { AppRegistry, Platform } from 'react-native';
import { Root } from './App';

import { config } from './sentrySettings'
import { Sentry } from 'react-native-sentry';
import {USE_SENTRY} from "./js/ExternalConfig";

if (USE_SENTRY) {
  if (global.__DEV__ !== true) {
    if (Platform.OS === 'android') {
      if (config.android) {
        Sentry.config(config.android).install();
      }
    }
    else {
      if (config.ios) {
        Sentry.config(config.ios).install();
      }
    }
  }
}

AppRegistry.registerComponent('Crownstone', () => Root);