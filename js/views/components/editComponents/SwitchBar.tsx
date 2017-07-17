import * as React from 'react'; import { Component } from 'react';
import {
  Switch,
  Text,
  View
} from 'react-native';

import { styles, colors, screenWidth } from '../../styles'


export class SwitchBar extends Component<any, any> {
  render() {
    return (
      <View style={[styles.listView, {height:this.props.barHeight}]}>
        {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
        <Text style={[styles.listTextLarge, this.props.style]}>{this.props.label}</Text>
        <View style={{flex:1}} />
        <Switch
          disabled={this.props.disabled || false}
          value={this.props.value}
          onValueChange={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
        />
      </View>
    );
  }
}
