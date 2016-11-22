import React, { Component } from 'react'
import {
  PixelRatio,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { Icon } from './Icon';
import { styles, colors, screenWidth,  topBarHeight, statusBarHeight} from '../styles'


export class TopBar extends Component {
  _getLeftContent() {
    if (this.props.notBack !== true && this.props.leftAction !== undefined) {
      if (this.props.leftItem !== undefined) {
        return (
          <TouchableOpacity onPress={() => {this.props.leftAction();}} style={topBarStyle.topBarLeftTouch}>
            <View style={{flexDirection:'row', alignItems:'center', flex:0}}>
              {this.props.leftItem}
            </View>
          </TouchableOpacity>
        );
      }
      else {
        let color = colors.iosBlue.hex;
        if (this.props.leftStyle && this.props.leftStyle.color) {
          color = this.props.leftStyle.color;
        }
        return (
          <TouchableOpacity onPress={() => {this.props.leftAction();}} style={[topBarStyle.topBarLeftTouch]}>
            <View style={{flexDirection:'row', alignItems:'center', flex:0, height: 42}}>
              <Icon name="ios-arrow-back" size={33} color={color} style={{paddingRight:6, marginTop:2}} />
              <Text style={[topBarStyle.topBarLeft,topBarStyle.text, this.props.leftStyle]}>{this.props.left}</Text>
            </View>
          </TouchableOpacity>
        );
      }
    }
    else if (this.props.left) {
      return (
        <TouchableOpacity onPress={() => {this.props.leftAction();}}  style={topBarStyle.topBarLeftTouch}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-start'}}>
            <Text style={[topBarStyle.topBarLeft, topBarStyle.text, this.props.leftStyle]}>{this.props.left}</Text>
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
      return (
        <TouchableOpacity onPress={() => {this.props.rightAction();}}  style={topBarStyle.topBarRightTouch}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: 42}}>
            <Text style={[topBarStyle.topBarRight, topBarStyle.text, this.props.rightStyle]}>{this.props.right}</Text>
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
          <View style={[topBarStyle.topBarCenterView, {height: barHeight}]}><Text style={[topBarStyle.topBarCenter, topBarStyle.titleText, this.props.titleStyle]}>{this.props.title}</Text></View>
          <View style={[{height: barHeight}]}>{this._getRightContent()}</View>

        </View>
      </View>
    );
  }
}

export const topBarStyle = StyleSheet.create({
  topBar: {
    backgroundColor: colors.menuBackground.hex,
    flexDirection: 'row',
    paddingTop: statusBarHeight
  },
  topBarCenterView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLeft: {
    textAlign: 'left',
  },
  topBarLeftTouch: {
    position:'relative',
    top: -statusBarHeight,
    // backgroundColor:'#f00',
    height:topBarHeight,
    width:70,
    paddingLeft:10,
    paddingTop:statusBarHeight
  },
  topBarRightTouch: {
    position:'relative',
    top: -statusBarHeight,
    // backgroundColor:'#ff0',
    height:topBarHeight,
    width:70,
    paddingRight:6,
    paddingTop:statusBarHeight
  },
  topBarCenter: {
    textAlign: 'center',
  },
  topBarRight: {
    textAlign: 'right',
  },
  titleText: {
    fontSize: 18,
    color: 'white'
  },
  text:{
    fontSize: 17,
    color: colors.iosBlue.hex
  }
});
