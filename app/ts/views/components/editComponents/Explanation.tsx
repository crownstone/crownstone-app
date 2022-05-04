
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Explanation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';
import {menuStyles} from "../../styles";

export class Explanation extends Component<any, any> {
  render() {
    if (this.props.below === true) {
      return (
        <View style={{backgroundColor: this.props.backgroundColor || 'transparent'}}>
          <View style={[{padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:25}, this.props.style]}>
            <Text style={{textAlign: this.props.align || (this.props.centered ? 'center' : 'left'), ...menuStyles.explanationText, color: this.props.color || menuStyles.explanationText.color}}>{this.props.text}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={{backgroundColor: this.props.backgroundColor || 'transparent'}}>
        <View style={[{padding:4, paddingRight:15, paddingLeft: 15, paddingTop: this.props.alreadyPadded ? 0 : 30}, this.props.style]}>
          <Text style={{textAlign: this.props.align || (this.props.centered ? 'center' : 'left'), ...menuStyles.explanationText, color: this.props.color || menuStyles.explanationText.color}}>{this.props.text}</Text>
        </View>
      </View>
    );
  }
}