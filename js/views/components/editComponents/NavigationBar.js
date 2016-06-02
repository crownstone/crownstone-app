import React, { Component } from 'react'
import {
  
  TouchableHighlight,
  Text,
  View
} from 'react-native';

var Icon = require('react-native-vector-icons/Ionicons');
import { styles, colors } from '../../styles'


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
          {this.props.largeIcon}
          {this.props.icon}
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
