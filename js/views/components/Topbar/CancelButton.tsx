import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { styles, colors, screenWidth, topBarHeight, statusBarHeight} from '../../styles'
import {topBarStyle} from "./TopbarStyles";

let barHeight = topBarHeight - statusBarHeight;


export class CancelButton extends Component<any, any> {

  render() {
    return (
      <TouchableOpacity onPress={() => { this.props.onPress();}}  style={topBarStyle.topBarLeftTouch}>
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-start', flex:0, height: barHeight}}>
          <Text style={[topBarStyle.topBarLeft, topBarStyle.text, {color: colors.white.hex}]}>{"Cancel"}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

