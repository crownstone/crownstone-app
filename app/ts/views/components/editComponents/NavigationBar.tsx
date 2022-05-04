import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("NavigationBar", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Text,
  View, TouchableOpacity
} from 'react-native';

import { Icon } from '../Icon';
import {styles, colors, screenWidth, LARGE_ROW_SIZE, MID_ROW_SIZE, NORMAL_ROW_SIZE, menuStyles} from '../../styles'
import { core } from "../../../Core";


export class NavigationBar extends Component<any, any> {
  setActiveElement : any;

  animating = false;
  unsubscribe = [];

  constructor(props) {
    super(props);
    let emptyFunction = () => {};
    this.setActiveElement = props.setActiveElement || emptyFunction;
    this.state = { backgroundColor: new Animated.Value(0) };
  }

  componentDidMount() {
    // this event makes the background of the device entry blink to incidate the error.
    this.unsubscribe.push(core.eventBus.on('highlight_nav_field', (fieldId) => {
      if (fieldId === this.props.fieldId) {
        Animated.spring(this.state.backgroundColor, { toValue: 10, friction: 1.5, tension: 50, useNativeDriver: false }).start();
        setTimeout(() => {
          Animated.timing(this.state.backgroundColor, { toValue: 0, useNativeDriver: false, duration: 200 }).start();
        }, 1000);
      }
    }));
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
  }



  render() {
    let navBarHeight = this.props.barHeight || NORMAL_ROW_SIZE;
    if (this.props.largeIcon)
      navBarHeight = LARGE_ROW_SIZE;
    else if (this.props.mediumIcon)
      navBarHeight = MID_ROW_SIZE;
    else if (this.props.icon)
      navBarHeight = NORMAL_ROW_SIZE;

    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0,10],
      outputRange: [menuStyles.listView.backgroundColor,  colors.green.rgba(0.8)]
    });

    let fontColor = colors.black.hex;

    if (this.props.disabled) {
      backgroundColor = menuStyles.disabledListView.backgroundColor;
      fontColor = menuStyles.disabledListView.color;
    }

    let content = (
      <Animated.View style={[menuStyles.listView, {height: navBarHeight, backgroundColor:backgroundColor}]}>
        {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
        {this.props.mediumIcon !== undefined ? <View style={[styles.centered, {width: 0.15 * screenWidth, paddingRight: 15}]}>{this.props.mediumIcon}</View> : undefined}
        {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}

        {this.props.value !== undefined && this.props.valueRight !== true ?
          <Text numberOfLines={this.props.numberOfLines ?? 1} style={[menuStyles.listText, this.props.labelStyle, this.props.style, {color: fontColor}]}>{this.props.label}</Text>
          :
          <Text numberOfLines={this.props.numberOfLines ?? 1} style={[menuStyles.listTextLarge, this.props.labelStyle, this.props.style, {color: fontColor}]}>{this.props.label}</Text>
        }
        {this.props.subtext ? <Text style={[menuStyles.subText, this.props.subtextStyle, {color: fontColor}]}>{this.props.subtext}</Text> : undefined}
        {this.props.value !== undefined ?
          this.props.valueRight ?
            <Text style={[menuStyles.valueText, {flex:1}, this.props.valueStyle, this.props.style]}>{this.props.value}</Text>
            :
            <Text style={[menuStyles.valueText, {flex:1}, this.props.valueStyle, this.props.style]}>{this.props.value}</Text>
          :
          <View style={{flex:1}} />
        }

        {this.props.disabled !== true &&
          <View style={{ paddingTop: 3 }}>
            {this.props.arrowDown === true ? <Icon name="ios-arrow-down" size={18} color={'#888'}/> :
              <Icon name="ios-arrow-forward" size={18} color={'#888'}/>}
          </View>
        }
      </Animated.View>
    );

    if (this.props.disabled) {
      return content;
    }

    return (
      <TouchableOpacity onPress={() => { this.setActiveElement(); this.props.callback()}} testID={this.props.testID}>
        {content}
      </TouchableOpacity>
    );
  }
}
