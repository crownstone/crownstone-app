import React, { Component } from 'react'
import {
  
  Switch,
  Text,
  View,
  TouchableOpacity
} from 'react-native';

import { styles, colors, screenWidth } from '../../styles'
import { Icon } from '../Icon'

export class OptionalSwitchBar extends Component {
  render() {
    return (
      <View style={[styles.listView, {height:this.props.barHeight, paddingRight:0}]}>
        {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
        <Text style={styles.listTextLarge}>{this.props.label}</Text>
        <View style={{flex:1}} />
        { this.props.value !== null ?
          <Switch
            value={this.props.value === 1}
            onValueChange={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
          />
            :
          <Text>NULL</Text>
        }

        <TouchableOpacity style={{paddingLeft:15, height:this.props.barHeight, paddingRight:15, justifyContent:'center'}} onPress={() => {this.props.callback(null)}}>
          <Icon name="md-close-circle" color={colors.gray.hex} size={20} />
        </TouchableOpacity>

      </View>
    );
  }
}
