import React, { Component } from 'react'
import {
  
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from '../Icon';
import { styles, colors, width } from '../../styles'


export class NavigationBar extends Component {

  render() {
    let barHeight = this.props.barHeight;
    if (this.props.largeIcon)
      barHeight = 75;
    else if (this.props.icon)
      barHeight = 50;

    return (
      <TouchableHighlight onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
        <View style={[styles.listView, {height: barHeight}]}>
          {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
          {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * width, paddingRight:15}]}>{this.props.icon}</View> : undefined}

          {this.props.value !== undefined ?
            <Text style={[styles.listText, this.props.labelStyle]}>{this.props.label}</Text>
            :
            <Text style={[styles.listTextLarge, this.props.labelStyle]}>{this.props.label}</Text>
          }
          {this.props.value !== undefined ?
            <Text style={[{flex:1, fontSize:17}, this.props.valueStyle]}>{this.props.value}</Text>
            :
            <View style={{flex:1}} />
          }
          <View style={{paddingTop:3}}>
            <Icon name="ios-arrow-forward" size={18} color={'#888'} />
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}
