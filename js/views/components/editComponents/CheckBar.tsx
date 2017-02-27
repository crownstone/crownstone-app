import React, { Component } from 'react' 
import {
  
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from '../Icon';
import { styles, colors, screenWidth, barHeight} from '../../styles'


export class CheckBar extends Component {
  render() {
    let navBarHeight = this.props.barHeight || barHeight;
    if (this.props.largeIcon)
      navBarHeight = 75;
    else if (this.props.mediumIcon)
      navBarHeight = 62;
    else if (this.props.icon)
      navBarHeight = 50;


    return (
      <TouchableHighlight onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
        <View style={[styles.listView, {height: navBarHeight}]}>
          {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
          {this.props.mediumIcon !== undefined ? <View style={[styles.centered, {width: 0.15 * screenWidth, paddingRight: 15}]}>{this.props.mediumIcon}</View> : undefined}
          {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}

          <View style={{flexDirection:'column'}}>
            <Text style={styles.listTextLarge}>{this.props.label}</Text>
            {this.props.subtext ? <Text style={{fontSize:12, color:colors.iosBlue.hex}}>{this.props.subtext}</Text> : undefined}
            </View>
          <View style={{flex:1}} />
          {
            this.props.value === true ?
              <View style={{paddingTop:3}}>
                <Icon name="ios-checkmark" size={30} color={colors.iosBlue.hex} />
              </View>
              : undefined
          }
        </View>
      </TouchableHighlight>
    );
  }
}
