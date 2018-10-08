import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from '../Icon';
import {styles, colors, screenWidth, LARGE_ROW_SIZE, MID_ROW_SIZE, NORMAL_ROW_SIZE} from '../../styles'


export class CheckBar extends Component<any, any> {
  _getSelectedIcon() {
    if (this.props.value) {
      return (
        <View style={{paddingTop: 3}}>
          <Icon name="ios-checkmark" size={30} color={colors.iosBlue.hex}/>
        </View>
      );
    }
    else if (this.props.showAddIcon) {
      return (
        <View style={{paddingTop: 3}}>
          <Icon name="md-add-circle" size={25} color={colors.lightGray.hex}/>
        </View>
      );
    }
  }

  render() {
    let navBarHeight = this.props.barHeight || NORMAL_ROW_SIZE;
    if (this.props.largeIcon)
      navBarHeight = LARGE_ROW_SIZE;
    else if (this.props.mediumIcon)
      navBarHeight = MID_ROW_SIZE;
    else if (this.props.icon)
      navBarHeight = NORMAL_ROW_SIZE;

    return (
      <TouchableHighlight onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
        <View style={[styles.listView, {height: navBarHeight}]}>
          {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
          {this.props.mediumIcon !== undefined ? <View style={[styles.centered, {width: 0.15 * screenWidth, paddingRight: 15}]}>{this.props.mediumIcon}</View> : undefined}
          {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}

          <View style={{flexDirection:'column', justifyContent: 'center'}}>
            <Text style={{fontSize: 16}}>{this.props.label}</Text>
            {this.props.subtext ? <Text style={{fontSize:12, color:colors.iosBlue.hex}}>{this.props.subtext}</Text> : undefined}
          </View>
          <View style={{flex:1}} />
          { this._getSelectedIcon() }
        </View>
      </TouchableHighlight>
    );
  }
}
