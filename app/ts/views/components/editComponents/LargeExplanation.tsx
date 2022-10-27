
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LargeExplanation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  
  Text,
  View
} from 'react-native';
import {menuStyles} from "../../styles";


export class LargeExplanation extends Component<any, any> {
  render() {
    return (
      <View style={{backgroundColor: this.props.backgroundColor || 'transparent'}}>
        <View style={[{padding:4, paddingRight:15, paddingLeft: 15, paddingTop: this.props.alreadyPadded ? 0 : 30}, this.props.style]}>
          <Text style={{
            ...menuStyles.largeExplanationText,
            fontSize:15,
            color: this.props.color || menuStyles.largeExplanationText.color,
            textAlign: this.props.centered ? 'center' : 'left'
          }}>{this.props.text}</Text>
        </View>
      </View>
    );
  }
}