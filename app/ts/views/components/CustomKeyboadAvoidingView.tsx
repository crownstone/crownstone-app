import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("CustomKeyboardAvoidingView", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';
import {
  Animated, Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View
} from "react-native";

import {
  styles,
  screenHeight,
  tabBarHeight,
  colors,
  screenWidth,
  updateScreenHeight, availableScreenHeight, availableModalHeight
} from "../styles";
import { core } from "../../Core";


const KEYBOARD_HEIGHT = 450;

export class CustomKeyboadAvoidingView extends Component< any, { offset: any} > {

  subscriptions = [];
  keyboardSubscriptions = [];
  reference;

  constructor(props) {
    super(props);
    this.reference = React.createRef();

    this.state = {
      offset: new Animated.Value(0),
    }
  }

  componentDidMount() {
    if (Platform.OS === 'android') {
      this.subscriptions.push(core.eventBus.on('focus', (data) => {
        let offset = 0;
        let correctedData = data - this.state.offset._value;

        if (screenHeight - correctedData < KEYBOARD_HEIGHT) {
          offset = KEYBOARD_HEIGHT - (screenHeight - correctedData);
        }

        if (this.props.enabled) {
          this.state.offset.stopAnimation();
          Animated.timing(this.state.offset, { toValue: -offset, useNativeDriver: false, duration: 150 }).start()
        }
      }));
      this.subscriptions.push(core.eventBus.on('blur', (data) => {
        if (this.props.enabled) {
          this.state.offset.stopAnimation();
          Animated.timing(this.state.offset, { toValue: 0, useNativeDriver: false, duration: 150 }).start()
        }
        else {
          if (this.state.offset._value !== 0) {
            Animated.timing(this.state.offset, { toValue: 0, useNativeDriver: false, duration: 150 }).start()
          }
        }
      }));
    }

  }

  componentWillUnmount() {
    this.state.offset.stopAnimation();
    for (let unsubscriber of this.subscriptions) { unsubscriber(); }
  }

  render() {
    if (Platform.OS === 'android') {
      return <Animated.View ref={this.reference} {...this.props} style={{...this.props.style, position:'relative', top: this.state.offset}} />;
    }
    else {
      return <KeyboardAvoidingView {...this.props} />
    }
  }
}