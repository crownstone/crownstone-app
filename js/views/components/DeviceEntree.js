import React, { Component } from 'react' 
import {
  ActivityIndicatorIOS,
  Dimensions,
  Image,
  PixelRatio,
  Switch,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from './Icon';
import Slider from 'react-native-slider'
import { styles, colors} from '../styles'


export class DeviceEntree extends Component {
  _pressedDevice() {
    this.props.onChange((this.props.state === 1 ? 0 : 1));
  }

  _getControl() {
    if (this.props.pending === false) {
      return <Switch value={this.props.state === 1} onValueChange={this._pressedDevice.bind(this)} />
    }
    else {
      return <ActivityIndicatorIOS animating={true} size="large" />
    }
  }

  _getItem() {
    let color = (
      this.props.pending === true ?
          colors.gray.hex :
          (this.props.state > 0 ? colors.green.hex : colors.menuBackground.hex)
    );

    let content = (
      <View style={[{
        width:60,
        height:60,
        borderRadius:30,
        backgroundColor: color,
        }, styles.centered]}>
        <Icon name={this.props.icon} size={45} color={'#ffffff'} style={{position:'relative', top:2, backgroundColor:'transparent'}} />
      </View>
    );

    if (this.props.control === true && this.props.pending === false) {
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
        {this.props.navigation === true ? <Icon name="ios-arrow-forward" size={23} color={'#bababa'} /> : undefined}
        {this.props.control    === true ? this._getControl() : undefined}
      </View>
    );
    return content;
  }
}