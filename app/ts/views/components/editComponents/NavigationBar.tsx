import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("NavigationBar", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from '../Icon';
import {styles, colors, screenWidth, LARGE_ROW_SIZE, MID_ROW_SIZE, NORMAL_ROW_SIZE} from '../../styles'
import { core } from "../../../core";


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
        Animated.spring(this.state.backgroundColor, { toValue: 10, friction: 1.5, tension: 50 }).start();
        setTimeout(() => {
          Animated.timing(this.state.backgroundColor, { toValue: 0, duration: 200 }).start();
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
      outputRange: ['rgba(255, 255, 255, 1.0)',  colors.green.rgba(0.8)]
    });


    return (
      <TouchableHighlight onPress={() => {this.setActiveElement(); this.props.callback()}}>
        <Animated.View style={[styles.listView, {height: navBarHeight, backgroundColor:backgroundColor}]}>
          {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
          {this.props.mediumIcon !== undefined ? <View style={[styles.centered, {width: 0.15 * screenWidth, paddingRight: 15}]}>{this.props.mediumIcon}</View> : undefined}
          {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}

          {this.props.value !== undefined && this.props.valueRight !== true ?
            <Text numberOfLines={1} style={[styles.listText, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
            :
            <Text numberOfLines={1} style={[styles.listTextLarge, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
          }
          {this.props.subtext ? <Text style={[{fontSize:12, color:colors.iosBlue.hex}, this.props.subtextStyle]}>{this.props.subtext}</Text> : undefined}
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
        </Animated.View>
      </TouchableHighlight>
    );
  }
}
