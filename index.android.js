'use strict';
import React, {
  AppRegistry,
  Component,
  View
} from 'react-native';

import {UINavigator} from "./UIModules/UIElements/UINavigator"

class Root extends Component {
  constructor() {
    super();
  }

  render() {
    return <View style={{flex:1, backgroundColor:'#00ff00'}}>
      <UINavigator />
    </View>
  };
}



AppRegistry.registerComponent('Crownstone', () => Root);
