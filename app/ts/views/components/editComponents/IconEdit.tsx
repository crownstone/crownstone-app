
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
import { styles} from '../../styles'


export class IconEdit extends Component<any, any> {
  render() {
    return (
      <View style={{height: this.props.barHeightLarge}}>
        <View style={[styles.listView, { justifyContent:'flex-start', alignItems:'center', height:this.props.barHeightLarge}]}>
          <Text style={[styles.listText,{height:this.props.barHeightLarge - 20}]}>{this.props.label}</Text>
          <TouchableOpacity onPress={() => {this.props.setActiveElement(); this.props.callback()}} testID={this.props.testID}>
            <View>
              <IconCircle icon={this.props.value} showEdit={true} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}