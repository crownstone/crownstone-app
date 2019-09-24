
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
    let size = 60;
    let fontSize = 16;
    if (this.props.small) {
      size = 40;
      fontSize = 14;
    }
    return (
      <View style={{flexDirection:'row', padding:10, paddingLeft:0, alignItems:'center', flex:1}}>
        <View style={{paddingRight:10}}>
          <View style={[{
            width:size,
            height:size,
            borderRadius:size*0.5,
            backgroundColor: this.props.backgroundColor || colors.csBlue.hex,
          }, styles.centered]}
          >
            <Icon name={this.props.icon} size={this.props.iconSizeOverride || size*0.55} color={'#fff'} style={{backgroundColor:'transparent'}} />
          </View>
        </View>
        <View style={{flex:1}}>
          <View style={{flexDirection:'column'}}>
            <Text style={{fontSize:fontSize}}>{this.props.name}</Text>
            { this.props.hideSubtitle !== true ? <Text style={{fontSize:fontSize-2, paddingTop:3}}>{ lang("Number_of_Crownstones__",this.props.stoneCount) }</Text> : undefined }
          </View>
        </View>
        {this.props.showNavigationIcon ? <Icon name="ios-arrow-forward" size={18} color={'#888'} /> : undefined}
      </View>
    );
  }
}