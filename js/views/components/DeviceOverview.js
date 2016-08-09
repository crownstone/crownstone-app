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

var Icon = require('react-native-vector-icons/Ionicons');
import Slider from 'react-native-slider'
import { styles, colors} from '../styles'


export class DeviceOverview extends Component {

  _getItem() {
    let color = colors.blue.hex;

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
            <Text style={{fontSize:16, fontWeight:'500'}}>{this.props.stoneName}</Text>
            <Text style={{fontSize:14, fontWeight:'100', paddingTop:3, paddingBottom:2}}>{'Device: ' + (this.props.stoneName !== this.props.deviceName ? this.props.deviceName : this.props.stoneName)}</Text>
            <Text style={{fontSize:11, fontWeight:'100', fontStyle:'italic'}}>{this.props.locationName === undefined ? 'Not in a room.' :'In the ' + this.props.locationName}</Text>
          </View>
        </View>
        {this.props.navigation ? <Icon name="ios-arrow-forward" size={23} color={'#bababa'} /> : undefined}
      </View>
    );
    return content;
  }
}