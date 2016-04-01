import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

var Icon = require('react-native-vector-icons/Ionicons');

import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

export class DeviceEntry extends Component {
  _pressedDevice() {
    this.props.onChange((this.props.state === 1 ? 0 : 1));
  }


  _getItem() {
    let content = (
      <View style={[{
        width:60,
        height:60,
        borderRadius:30,
        backgroundColor: this.props.state > 0 ? colors.green.h : colors.menuBackground.h,
        }, styles.centered]}>
        <Icon name={this.props.icon} size={45} color={'#ffffff'} />
      </View>
    );

    if (this.props.control === true) {
      return (
        <TouchableOpacity onPress={this._pressedDevice.bind(this)}>
          {content}
        </TouchableOpacity>
      );
    }
    return content;

  }

  render() {
    let content = (
      <View style={{flexDirection:'row', padding:10, paddingLeft:0, alignItems:'center', flex:1}}>
        <View style={{paddingRight:20}}>
          {this._getItem()}
        </View>
        <View style={{flex:1}}>
          <View style={{flexDirection:'column'}}>
            <Text style={{fontSize:17, fontWeight:'100'}}>{this.props.name}</Text>
            <Text style={{fontSize:12}}>{this.props.currentUsage + ' W'}</Text>
          </View>
        </View>
        {this.props.navigation === true ? <Icon name="ios-arrow-right" size={23} color={'#bababa'} /> : undefined}
      </View>
    );

    if (this.props.navigation === true) {
      return (
        <TouchableOpacity onPress={this.props.onNavigation}  style={{flex:1}}>
          {content}
        </TouchableOpacity>
      );
    }
    return content;
  }
}