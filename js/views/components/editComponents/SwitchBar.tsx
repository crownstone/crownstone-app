import * as React from 'react'; import { Component } from 'react';
import {
  Switch,
  Text,
  View
} from 'react-native';

import {styles, colors, screenWidth, barHeight} from '../../styles'


export class SwitchBar extends Component<any, any> {
  render() {
    let navBarHeight = this.props.barHeight || barHeight;
    if (this.props.largeIcon)
      navBarHeight = 75;
    else if (this.props.icon)
      navBarHeight = 50;

    return (
      <View style={[styles.listView, {height: navBarHeight}, this.props.wrapperStyle]}>
        {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
        {this.props.iconIndent === true ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]} /> : undefined }
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
