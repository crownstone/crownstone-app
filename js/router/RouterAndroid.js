import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';
import { Bluenet }                   from '../native/libInterface/Bluenet';

import { colors} from '../views/styles'

export class Router_Android extends Component {
  componentDidMount() {
    Bluenet.viewsInitialized();
  }
  render() {
    return (
      <View style={{flex:1, backgroundColor: colors.menuBackground.hex}}>
      </View>
    );
  }
}


let navBarStyle = {
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  titleStyle:{color:'white'},
  backButtonImage: require('../images/androidBackIcon.png'),
  leftButtonIconStyle: {width:15, height:15, marginTop:8},
};

