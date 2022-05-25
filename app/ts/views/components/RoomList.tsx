
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
    let size = 50;
    let fontSize = 16;
    return (
      <View style={{flexDirection:'row', alignItems:'center', paddingVertical: 12}}>
        <Icon name={this.props.icon} size={this.props.iconSizeOverride || size*0.55} color={colors.csBlue.hex} />
        <View style={{flexDirection:'column', flex:1, paddingLeft:10}}>
          <Text style={{fontSize:fontSize}}>{this.props.name}</Text>
          { this.props.hideSubtitle !== true ? <Text style={{fontSize:fontSize-2, paddingTop:3}}>{ lang("Number_of_Crownstones__",this.props.stoneCount) }</Text> : undefined }
        </View>
        {this.props.showNavigationIcon ? <Icon name="ios-arrow-forward" size={18} color={'#888'} style={{paddingRight:10}} /> : undefined}
      </View>
    );
  }
}
