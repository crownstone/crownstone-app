
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Topbar", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { Icon } from './Icon';
import { colors, topBarHeight, statusBarHeight} from '../styles'

import { AlternatingContent }   from './animated/AlternatingContent'

import {topBarStyle} from "./topbar/TopbarStyles";
import { NavigationUtil } from "../../util/NavigationUtil";

let barHeight = topBarHeight - statusBarHeight;


/**
 * Props:
 *
 * left
 *
 * alternateLeftItem
 *
 * leftItem
 *
 * right
 *
 * rightItem
 *
 * showHamburgerMenu
 */
class TopBarAndroid extends Component<any, any> {
  _getLeftContent() {
    if (this.props.notBack === true && this.props.left) {
      // draw custom element
      let left = this.props.left;
      if (typeof this.props.left === 'function') {
        left = this.props.left();
      }    return (
        <TouchableOpacity onPress={() => { this.props.leftAction(); }}  style={topBarStyle.topBarLeftTouch}>
          <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
            <Text style={[topBarStyle.topBarLeft, topBarStyle.text, this.props.leftStyle]}>{left}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    else {
      // back
      let backCallback = () => { NavigationUtil.back(); };
      if (typeof this.props.leftAction === 'function') {
        backCallback = this.props.leftAction;
      }
      return (
        <TouchableOpacity onPress={() => { backCallback(); }} style={[topBarStyle.topBarLeftTouch, {paddingLeft:10}]} >
          <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
            <Icon name="md-arrow-back" size={22} color={this.props.leftStyle.color || colors.white.hex} style={{paddingRight:6, marginTop:2}} />
          </View>
        </TouchableOpacity>
      );
    }
  }

  _getRightContent() {
    if ( this.props.rightItem ) {
      return (
        <TouchableOpacity onPress={() => {this.props.rightAction();}} style={topBarStyle.topBarRightTouch}>
          {this.props.rightItem}
        </TouchableOpacity>
      );
    }
    else if ( this.props.right ) {
      let right = this.props.right;
      if (typeof this.props.right === 'function') {
        right = this.props.right();
      }
      return (
        <TouchableOpacity onPress={() => {this.props.rightAction();}}  style={[topBarStyle.topBarRightTouch, {paddingRight:10}]}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
            <Text style={[topBarStyle.topBarRight, topBarStyle.text, this.props.rightStyle]}>{right}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return <View style={topBarStyle.topBarRightTouch} />;
  }

  render() {
    let barHeight = topBarHeight - statusBarHeight;
    return (
      <View>
        <View style={[topBarStyle.topBar,this.props.style]}>
          <View style={[{height: barHeight}]}>{this._getLeftContent()}</View>
          <View style={[topBarStyle.topBarCenterView, {height: barHeight}]}>
            { this.props.titleObject || <Text style={[topBarStyle.topBarCenter, topBarStyle.titleText, this.props.titleStyle]}>{this.props.title}</Text> }
          </View>
          <View style={[{height: barHeight}]}>{this._getRightContent()}</View>
        </View>
      </View>
    );
  }
}

class TopBarIOS extends Component<any, any> {
  _getLeftContent() {
    if (this.props.notBack !== true && this.props.leftAction !== undefined) {
      if (this.props.leftItem !== undefined) {
        return (
          <TouchableOpacity onPress={() => {this.props.leftAction();}} style={{...topBarStyle.topBarLeftTouch, paddingLeft:10}}>
            <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
              {this.props.leftItem}
            </View>
          </TouchableOpacity>
        );
      }
      else {
        let color = colors.menuTextSelected.hex;
        if (this.props.leftStyle && this.props.leftStyle.color) {
          color = this.props.leftStyle.color;
        }
        return (
          <TouchableOpacity
            onPress={() => {this.props.leftAction();}}
            style={[topBarStyle.topBarLeftTouch, {paddingLeft:10}, this.props.leftButtonStyle]}>
            <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
              <Icon name="ios-arrow-back" size={33} color={color} style={{paddingRight:6, marginTop:2}} />
              <Text style={[topBarStyle.topBarLeft,topBarStyle.leftText, {color: colors.menuTextSelected.hex}, this.props.leftStyle]}>{this.props.left}</Text>
            </View>
          </TouchableOpacity>
        );
      }
    }
    else if (this.props.left) {
      let left = this.props.left;
      if (typeof this.props.left === 'function') {
        left = this.props.left();
      }
      return (
        <TouchableOpacity onPress={() => {this.props.leftAction();}}  style={{...topBarStyle.topBarLeftTouch, paddingLeft:10}}>
          <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
            <Text style={[topBarStyle.topBarLeft, topBarStyle.text, this.props.leftStyle]}>{left}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return <View style={topBarStyle.topBarLeftTouch} />;
  }

  _getRightContent() {
    if (this.props.rightItem) {
      return (
        <TouchableOpacity onPress={() => {this.props.rightAction();}} style={topBarStyle.topBarRightTouch}>
          {this.props.rightItem}
        </TouchableOpacity>
      );
    }
    else if (this.props.right) {
      let right = this.props.right;
      if (typeof this.props.right === 'function') {
        right = this.props.right();
      }
      return (
        <TouchableOpacity onPress={() => {this.props.rightAction();}}  style={[topBarStyle.topBarRightTouch,{paddingRight:10}]}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
            <Text style={[topBarStyle.topBarRight, topBarStyle.text, this.props.rightStyle]}>{right}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return <View style={topBarStyle.topBarRightTouch} />;
  }

  render() {
    return (
      <View>
        <View style={[topBarStyle.topBar,this.props.style]}>
          <View style={[{height: barHeight}]}>{this._getLeftContent()}</View>
          <View style={[topBarStyle.topBarCenterView, {height: barHeight}]}>
            { this.props.titleObject || <Text style={[topBarStyle.topBarCenter, topBarStyle.titleText, this.props.titleStyle]}>{this.props.title}</Text> }
          </View>
          <View style={[{height: barHeight}]}>{this._getRightContent()}</View>
        </View>
      </View>
    );
  }
}

let TopBarClass;
if (Platform.OS === 'android') {
  TopBarClass = TopBarAndroid;
}
else {
  TopBarClass = TopBarIOS;
}

export const TopbarImitation = TopBarClass;

