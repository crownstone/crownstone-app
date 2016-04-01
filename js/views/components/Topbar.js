import React, {
  Component,
  PixelRatio,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

var Icon = require('react-native-vector-icons/Ionicons');

import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

export class TopBar extends Component {
  _getLeftContent() {
    if (this.props.left && this.props.notBack !== true) {
      return (
        <TouchableOpacity onPress={() => {this.props.leftAction();}}>
          <View style={{flexDirection:'row', alignItems:'center', flex:0}}>
            <Icon name="ios-arrow-left" size={23} color={colors.menuText.h} style={{paddingRight:6, marginTop:2}} />
            <Text style={styles.topBarLeft}>{this.props.left}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    else if (this.props.left) {
      return (
        <TouchableOpacity onPress={() => {this.props.leftAction();}}>
          <Text style={styles.topBarLeft}>{this.props.left}</Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.topBarLeftView}></View>;
  }

  _getRightContent() {
    if (this.props.right) {
      return (
        <TouchableOpacity onPress={() => {this.props.rightAction();}}>
          <Text style={styles.topBarRight}>{this.props.right}</Text>
        </TouchableOpacity>
      );
    }
    return undefined;
  }

  render() {
    let pxRatio = PixelRatio.get();
    let height = 22*pxRatio;
    return (
      <View>
        <View style={styles.topBar}>
          <View style={[styles.topBarSideView,    {height}]}>{this._getLeftContent()}</View>
          <View style={[styles.topBarCenterView,  {height}]}><Text style={styles.topBarCenter}>{this.props.name}</Text></View>
          <View style={[styles.topBarSideView,    {height}]}>{this._getRightContent()}</View>
        </View>
      </View>
    );
  }
}


