import React, { Component } from 'react'
import {
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from '../Icon';
import { styles, colors, screenWidth, barHeight } from '../../styles'


export class NavigationBar extends Component {
  constructor(props) {
    super();
    let emptyFunction = () => {};
    this.setActiveElement = props.setActiveElement || emptyFunction;
  }

  render() {
    let navBarHeight = this.props.barHeight || barHeight;
    if (this.props.largeIcon)
      navBarHeight = 75;
    else if (this.props.icon)
      navBarHeight = 50;

    return (
      <TouchableHighlight onPress={() => {this.setActiveElement(); this.props.callback()}}>
        <View style={[styles.listView, {height: navBarHeight}]}>
          {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
          {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}

          {this.props.value !== undefined && this.props.valueRight !== true ?
            <Text style={[styles.listText, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
            :
            <Text style={[styles.listTextLarge, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
          }
          {this.props.value !== undefined ?
            this.props.valueRight ?
              <Text style={[{flex:1, fontSize:16}, this.props.valueStyle, this.props.style]}>{this.props.value}</Text>
              :
              <Text style={[{flex:1, fontSize:16}, this.props.valueStyle, this.props.style]}>{this.props.value}</Text>
            :
            <View style={{flex:1}} />
          }
          <View style={{paddingTop:3}}>
            {this.props.arrowDown === true ? <Icon name="ios-arrow-down" size={18} color={'#888'} /> : <Icon name="ios-arrow-forward" size={18} color={'#888'} />}
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}
