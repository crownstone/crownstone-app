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


export class DeviceOverview extends Component {
  _getText() {
    if (this.props.subtext) {
      return <View style={{flexDirection: 'column'}}>
        <Text style={{fontSize: 16, fontWeight: '500'}}>{this.props.name}</Text>
        <Text style={{fontSize: 14, fontWeight: '100', paddingTop: 3, paddingBottom: 2}}>{this.props.subtext}</Text>
        <Text style={{fontSize: 11, fontWeight: '100', fontStyle: 'italic'}}>{this.props.subtext2}</Text>
      </View>
    }
    else {
      return <Text style={{fontSize: 18, fontWeight: '300'}}>{this.props.name}</Text>
    }
  }

  render() {
    let size = this.props.size || 60;

    let content = (
      <View style={{flexDirection:'row', padding:10, paddingLeft:0, alignItems:'center', flex:1}}>
        <View style={{paddingRight:20}}>
          <View style={[{
              width: size,
              height: size,
              borderRadius: 0.5 * size,
              backgroundColor:  colors.blue.hex,
            }, styles.centered]}
          >
            <Icon name={this.props.icon} size={35} color={'#ffffff'} style={{position:'relative', top:2, backgroundColor:'transparent'}} />
          </View>
        </View>
        <View style={{flex:1}}>
          {this._getText()}
        </View>
        {this.props.navigation ? <Icon name="ios-arrow-forward" size={23} color={'#bababa'} /> : undefined}
      </View>
    );
    return content;
  }
}