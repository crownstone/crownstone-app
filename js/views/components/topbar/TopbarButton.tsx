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
    let alignmentStyle = this.props.alignmentStyle || topBarStyle.topBarRightTouch;
    if ( this.props.item ) {
      return (
        <TouchableOpacity onPress={() => {this.props.onPress();}} style={[alignmentStyle, this.props.style]}>
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
        <TouchableOpacity onPress={() => {this.props.onPress();}}  style={[alignmentStyle, this.props.style]}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
            <Text style={[topBarStyle.topBarRight, topBarStyle.text, this.props.style]}>{text}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return <View style={[alignmentStyle, this.props.style]} />;
  }
}


export class TopbarLeftButton extends Component<any, any> {

  render() {
    return <TopbarButton {...this.props} alignmentStyle={topBarStyle.topBarLeftTouch}/>
  }
}


export class TopbarRightButton extends Component<any, any> {

  render() {
    return <TopbarButton {...this.props} alignmentStyle={topBarStyle.topBarRightTouch}/>
  }
}
