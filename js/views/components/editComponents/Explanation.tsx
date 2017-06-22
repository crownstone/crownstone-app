import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';

export class Explanation extends Component<any, any> {
  render() {
    if (this.props.below === true) {
      return (
        <View style={{backgroundColor: this.props.backgroundColor || 'transparent'}}>
          <View style={[{padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:25}, this.props.style]}>
            <Text style={{textAlign: this.props.centered ? 'center' : 'left', fontSize:11, color: this.props.color || '#444'}}>{this.props.text}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={{backgroundColor: this.props.backgroundColor || 'transparent'}}>
        <View style={[{padding:4, paddingRight:15, paddingLeft: 15, paddingTop: this.props.alreadyPadded ? 0 : 30}, this.props.style]}>
          <Text style={{textAlign: this.props.centered ? 'center' : 'left', fontSize:11, color: this.props.color || '#444'}}>{this.props.text}</Text>
        </View>
      </View>
    );
  }
}