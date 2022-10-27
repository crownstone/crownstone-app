
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


export function RoomList(props) {
  let size = 50;
  let fontSize = 16;
  return (
    <View style={{flexDirection:'row', alignItems:'center', paddingVertical: 12, paddingHorizontal:10}}>
      <Icon name={props.icon} size={props.iconSizeOverride || size*0.55} color={colors.black.hex} />
      <View style={{flexDirection:'column', flex:1, paddingLeft:10}}>
        <Text style={{fontSize:fontSize}}>{props.name}</Text>
        { props.hideSubtitle !== true ? <Text style={{fontSize:fontSize-2, paddingTop:3}}>{ lang("Number_of_Crownstones__",props.stoneCount) }</Text> : undefined }
      </View>
      { props.value ?? <Text style={{fontSize:fontSize, ...(props.valueStyle ?? {})}}>{props.value}</Text> }
      {props.showNavigationIcon ? <Icon name="ios-arrow-forward" size={18} color={'#888'} style={{paddingRight:0}} /> : undefined}
    </View>
  );
}
