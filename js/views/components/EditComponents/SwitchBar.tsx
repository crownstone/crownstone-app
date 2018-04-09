import * as React from 'react'; import { Component } from 'react';
import {
  Switch,
  Text,
  View
} from 'react-native';

import {styles, colors, screenWidth, barHeight} from '../../styles'


export class SwitchBar extends Component<any, any> {
  render() {
    let navBarHeight = this.props.barHeight || barHeight;
    if (this.props.largeIcon)
      navBarHeight = 75;
    else if (this.props.icon)
      navBarHeight = 50;


    if (this.props.experimental) {
      return (
        <View style={{height: navBarHeight , width: screenWidth}}>
          <View style={{position:'absolute', top:0, left:0, overflow:'hidden', height: navBarHeight, width: screenWidth}}>
            <View style={{position:'absolute', top: -17, left:-5, backgroundColor: colors.menuBackground.hex}}>
              <Text style={{color:colors.white.rgba(0.1), fontSize:70, fontWeight:'900', fontStyle:'italic', width: 1000}}>{this.props.experimentalLabel || 'EXPERIMENTAL'}</Text>
            </View>
          </View>
          <View style={[styles.listView,{position:'absolute', top:0, left:0, overflow:'hidden', height: navBarHeight, width: screenWidth}]}>
            {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
            {this.props.iconIndent === true ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]} /> : undefined }
            <Text style={[styles.listTextLarge, this.props.style, {color:colors.white.hex}]}>{this.props.label}</Text>
            <View style={{flex:1}} />
            <Switch
              disabled={this.props.disabled || false}
              value={this.props.value}
              onValueChange={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
            />
          </View>
        </View>
      )
    }
    else {
      return (
        <View style={[styles.listView, {height: navBarHeight}, this.props.wrapperStyle]}>
          {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
          {this.props.iconIndent === true ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]} /> : undefined }
          <Text style={[styles.listTextLarge, this.props.style]}>{this.props.label}</Text>
          <View style={{flex:1}} />
          <Switch
            disabled={this.props.disabled || false}
            value={this.props.value}
            onValueChange={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
          />
        </View>
      );
    }
  }
}
