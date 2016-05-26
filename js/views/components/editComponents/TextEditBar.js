import React, { Component } from 'react'
import {
  
  TextInput,
  Text,
  View
} from 'react-native';
var Icon = require('react-native-vector-icons/Ionicons');
import { styles, colors } from '../../styles'
import { TextEditInput } from './TextEditInput'


export class TextEditBar extends Component {
  render() {
    return (
      <View>
        <View style={[styles.listView, {height:this.props.barHeight}]}>
          <Text style={styles.listText}>{this.props.label}</Text>
          <TextEditInput
            {...this.props}
          />
          {this.props.state === 'error' ? <Icon name="ios-close-circle" size={18} color={'#f03333'} style={{paddingLeft:3}} /> : undefined}
          {this.props.state === 'valid' ? <Icon name="ios-checkmark-circle" size={18} color={colors.green.h} style={{paddingLeft:3}} /> : undefined}
        </View>
      </View>
    );
  }
}
