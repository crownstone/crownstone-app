'use strict';
import React, {
  AppRegistry,
  Component,
  StatusBar,
  View
} from 'react-native';

import { AppRouter } from './js/router/Router'


class Root extends Component {
  constructor() {
    super();
  }

  render() {
      return <View style={{flex:1}}>
        <StatusBar barStyle="light-content" />
        <AppRouter />
      </View>
  };
}



AppRegistry.registerComponent('Crownstone', () => Root);


