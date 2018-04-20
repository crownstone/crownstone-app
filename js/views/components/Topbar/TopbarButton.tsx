import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { topBarHeight, statusBarHeight} from '../../styles'
import {topBarStyle} from "./TopbarStyles";

let barHeight = topBarHeight - statusBarHeight;


export class TopbarButton extends Component<any, any> {

  render() {
    if ( this.props.item ) {
      return (
        <TouchableOpacity onPress={() => {this.props.onPress();}} style={[topBarStyle.topBarRightTouch, this.props.style]}>
          {this.props.item}
        </TouchableOpacity>
      );
    }
    else if ( this.props.text ) {
      let text = this.props.text;
      if (typeof this.props.text === 'function') {
        text = this.props.text();
      }
      return (
        <TouchableOpacity onPress={() => {this.props.onPress();}}  style={[topBarStyle.topBarRightTouch, this.props.style]}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
            <Text style={[topBarStyle.topBarRight, topBarStyle.text, this.props.style]}>{text}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return <View style={[topBarStyle.topBarRightTouch, this.props.style]} />;
  }
}
