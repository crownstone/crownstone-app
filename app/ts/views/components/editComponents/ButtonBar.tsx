
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ButtonBar", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { styles, colors, screenWidth, LARGE_ROW_SIZE, NORMAL_ROW_SIZE, MID_ROW_SIZE } from "../../styles";


export class ButtonBar extends Component<any, any> {
  render() {
    let barHeight = this.props.barHeight;
    if (this.props.largeIcon)
      barHeight = LARGE_ROW_SIZE;
    else if (this.props.mediumIcon)
      barHeight = MID_ROW_SIZE;
    else if (this.props.icon)
      barHeight = NORMAL_ROW_SIZE;


    return (
      <TouchableHighlight onPress={() => {
        this.props.setActiveElement && this.props.setActiveElement();
        this.props.callback()
      }} testID={this.props.testID}>
        <View style={[styles.listView, {height: barHeight, backgroundColor: this.props.buttonBackground || '#ffffff'}]}>
          {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
          {this.props.mediumIcon !== undefined ? <View style={[styles.centered, {width: 0.15 * screenWidth, paddingRight: 15}]}>{this.props.mediumIcon}</View> : undefined}
          {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
          <Text style={[{fontSize:16, color:colors.menuRed.hex}, this.props.style]}>{this.props.label}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}
