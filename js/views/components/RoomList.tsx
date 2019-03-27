
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomList", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';

import { Icon } from './Icon';
import { styles, colors} from '../styles'


export class RoomList extends Component<any, any> {
  render() {
    return (
      <View style={{flexDirection:'row', padding:10, paddingLeft:0, alignItems:'center', flex:1}}>
        <View style={{paddingRight:20}}>
          <View style={[{
            width:60,
            height:60,
            borderRadius:30,
            backgroundColor: this.props.backgroundColor || colors.csBlue.hex,
          }, styles.centered]}
          >
            <Icon name={this.props.icon} size={this.props.iconSizeOverride || 35} color={'#fff'} style={{backgroundColor:'transparent'}} />
          </View>
        </View>
        <View style={{flex:1}}>
          <View style={{flexDirection:'column'}}>
            <Text style={{fontSize:16, fontWeight:'500'}}>{this.props.name}</Text>
            { this.props.hideSubtitle !== true ? <Text style={{fontSize:14, fontWeight:'100', paddingTop:3}}>{ lang("Number_of_Crownstones__",this.props.stoneCount) }</Text> : undefined }
          </View>
        </View>
        {this.props.showNavigationIcon ? <Icon name="ios-arrow-forward" size={18} color={'#888'} /> : undefined}
      </View>
    );
  }
}