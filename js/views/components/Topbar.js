import React, {
  Component,
  PixelRatio,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

var Icon = require('react-native-vector-icons/Ionicons');

import { styles, colors} from '../styles'


export class TopBar extends Component {
  _getLeftContent() {
    if (this.props.left && this.props.notBack !== true) {
      return (
        <TouchableOpacity onPress={() => {this.props.leftAction();}}>
          <View style={{flexDirection:'row', alignItems:'center', flex:0}}>
            <Icon name="ios-arrow-left" size={23} color={colors.menuText.h} style={{paddingRight:6, marginTop:2}} />
            <Text style={[topBarStyle.topBarLeft,styles.menuText]}>{this.props.left}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    else if (this.props.left) {
      return (
        <TouchableOpacity onPress={() => {this.props.leftAction();}}>
          <Text style={[topBarStyle.topBarLeft,styles.menuText]}>{this.props.left}</Text>
        </TouchableOpacity>
      );
    }
    return <View style={topBarStyle.topBarLeftView}></View>;
  }

  _getRightContent() {
    if (this.props.right) {
      return (
        <TouchableOpacity onPress={() => {this.props.rightAction();}}>
          <Text style={[topBarStyle.topBarRight,styles.menuText]}>{this.props.right}</Text>
        </TouchableOpacity>
      );
    }
    return undefined;
  }

  render() {
    let pxRatio = PixelRatio.get();
    let height = 21*pxRatio;
    return (
      <View>
        {this.props.shadeStatus ? <View style={styles.shadedStatusBar} /> : <View style={[styles.shadedStatusBar, {backgroundColor:colors.menuBackground.h}]} />}
        <View style={[topBarStyle.topBar,this.props.style]}>
          <View style={[topBarStyle.topBarSideView,   {height}]}>{this._getLeftContent()}</View>
          <View style={[topBarStyle.topBarCenterView, {height}]}><Text style={[topBarStyle.topBarCenter,styles.menuText]}>{this.props.title}</Text></View>
          <View style={[topBarStyle.topBarSideView,   {height}]}>{this._getRightContent()}</View>
        </View>
      </View>
    );
  }
}

let topBarStyle = StyleSheet.create({
  topBar: {
    backgroundColor: colors.menuBackground.h,
    paddingLeft: 6,
    paddingRight: 6,
    flexDirection: 'row'
  },
  topBarSideView: {
    justifyContent: 'center',
    width: 100,
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
  topBarRight: {
    textAlign: 'right',
  },
});
