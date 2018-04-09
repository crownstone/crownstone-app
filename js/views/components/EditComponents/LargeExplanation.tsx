import * as React from 'react'; import { Component } from 'react';
import {
  
  Text,
  View
} from 'react-native';


import { styles, colors} from '../../styles'


export class LargeExplanation extends Component<any, any> {
  render() {
    return (
      <View style={{backgroundColor: this.props.backgroundColor || 'transparent'}}>
        <View style={[{padding:4, paddingRight:15, paddingLeft: 15, paddingTop: this.props.alreadyPadded ? 0 : 30}, this.props.style]}>
          <Text style={{fontSize:15, fontWeight:'400', color: this.props.color || '#444', textAlign: this.props.centered ? 'center' : 'left'}}>{this.props.text}</Text>
        </View>
      </View>
    );
  }
}