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
import { styles, colors} from '../styles'


export class TopBar extends Component {
  _getLeftContent() {
    if (this.props.notBack !== true) {
      let color = colors.iosBlue.hex;
      if (this.props.leftStyle && this.props.leftStyle.color) {
        color = this.props.leftStyle.color;
      }
      return (
        <TouchableOpacity onPress={() => {this.props.leftAction();}}>
          <View style={{flexDirection:'row', alignItems:'center', flex:0}}>
            <Icon name="ios-arrow-back" size={30} color={color} style={{paddingRight:6, marginTop:2}} />
            <Text style={[topBarStyle.topBarLeft,styles.menuText, this.props.leftStyle]}>{this.props.left}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    else if (this.props.left) {
      return (
        <TouchableOpacity onPress={() => {this.props.leftAction();}}>
          <Text style={[topBarStyle.topBarLeft,styles.menuText, this.props.leftStyle]}>{this.props.left}</Text>
        </TouchableOpacity>
      );
    }
    return <View style={topBarStyle.topBarLeftView}></View>;
  }

  _getRightContent() {
    if (this.props.right) {
      return (
        <TouchableOpacity onPress={() => {this.props.rightAction();}}>
          <Text style={[topBarStyle.topBarRight,styles.menuText, this.props.rightStyle]}>{this.props.right}</Text>
        </TouchableOpacity>
      );
    }
    return undefined;
  }

  render() {
    let barHeight = 42;
    return (
      <View>
        {this.props.shadeStatus ? <View style={styles.shadedStatusBar} /> : <View style={[styles.shadedStatusBar, {backgroundColor:colors.menuBackground.hex}]} />}
        <View style={[topBarStyle.topBar,this.props.style]}>
          <View style={[topBarStyle.topBarSideView,   {height: barHeight}]}>{this._getLeftContent()}</View>
          <View style={[topBarStyle.topBarCenterView, {height: barHeight}]}><Text style={[topBarStyle.topBarCenter, styles.menuText, this.props.titleStyle]}>{this.props.title}</Text></View>
          <View style={[topBarStyle.topBarSideView,   {height: barHeight}]}>{this._getRightContent()}</View>
        </View>
      </View>
    );
  }
}

let topBarStyle = StyleSheet.create({
  topBar: {
    backgroundColor: colors.menuBackground.hex,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row'
  },
  topBarSideView: {
    justifyContent: 'center',
    width: 70,
  },
  topBarCenterView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLeft: {
    textAlign: 'left',
  },
  topBarCenter: {
    textAlign: 'center',
  },
  topBarRight: {
    textAlign: 'right',
  },
});
