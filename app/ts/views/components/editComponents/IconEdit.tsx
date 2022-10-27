
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("IconEdit", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { IconCircle }  from '../IconCircle'
import {menuStyles, styles} from '../../styles'
import {IconCircleEdit} from "../IconCircleEdit";


export class IconEdit extends Component<any, any> {
  render() {
    return (
      <View style={{height: this.props.barHeightLarge}}>
        <View style={[menuStyles.listView, { justifyContent:'flex-start', alignItems:'center', height: this.props.barHeightLarge}]}>
          <Text style={[menuStyles.listText,{height:this.props.barHeightLarge - 20}]}>{this.props.label}</Text>
          <TouchableOpacity onPress={() => {this.props.setActiveElement(); this.props.callback()}} testID={this.props.testID}>
            <IconCircleEdit icon={this.props.value} showEdit={true} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}