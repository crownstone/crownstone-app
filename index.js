import { AppRegistry, Platform } from 'react-native';
import { Root } from './App';

import { config } from './sentrySettings'
import { Sentry } from 'react-native-sentry';

console.log("here")
if ( global.__DEV__ !== true) {
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

console.log("x")
AppRegistry.registerComponent('Crownstone', () => Root);
console.log("y")