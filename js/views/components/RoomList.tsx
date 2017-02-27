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
import { styles, colors} from '../styles'


export class RoomList extends Component {
  render() {
    return (
      <View style={{flexDirection:'row', padding:10, paddingLeft:0, alignItems:'center', flex:1}}>
        <View style={{paddingRight:20}}>
          <View style={[{
            width:60,
            height:60,
            borderRadius:30,
            backgroundColor: colors.blue.hex,
          }, styles.centered]}
          >
            <Icon name={this.props.icon} size={35} color={'#fff'} style={{position:'relative', top:2, backgroundColor:'transparent'}} />
          </View>
        </View>
        <View style={{flex:1}}>
          <View style={{flexDirection:'column'}}>
            <Text style={{fontSize:16, fontWeight:'500'}}>{this.props.name}</Text>
            <Text style={{fontSize:14, fontWeight:'100', paddingTop:3}}>{'Number of Crownstones: ' + this.props.stoneCount}</Text>
          </View>
        </View>
        {this.props.navigation ? <Icon name="ios-arrow-forward" size={18} color={'#888'} /> : undefined}
      </View>
    );
  }
}