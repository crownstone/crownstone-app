
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("FadeInView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated, Platform,
  View
} from "react-native";
import { useState } from "react";
import { BlurView} from "@react-native-community/blur";

export class FadeInView extends Component<any, any> {
  visible : boolean;
  maxOpacity : number;
  pendingTimeout : any;

  constructor(props) {
    super(props);

    this.state = {show: props.visible || false, viewOpacity: new Animated.Value(props.visible ? 1 : 0)};
    this.visible = props.visible || false;
    this.maxOpacity = props.maxOpacity || 1;
    this.pendingTimeout = null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    let defaultDuration = 200;
    if ((this.props.visible !== undefined && this.visible !== this.props.visible) || (this.props.maxOpacity !== undefined && this.maxOpacity !== this.props.maxOpacity)) {
      this.state.viewOpacity.stopAnimation()
      if (this.props.visible === true) {
        this.setState({show: true});
        this.pendingTimeout = setTimeout(() => {
          this.pendingTimeout = null;
          Animated.timing(this.state.viewOpacity, {
            toValue:  this.props.maxOpacity || this.maxOpacity,
            delay:    this.props.delay     || 0,
            duration: this.props.duration  || defaultDuration,
            useNativeDriver: false
          }).start();
        }, 0);
      }
      else {
        Animated.timing(this.state.viewOpacity, {
          toValue:  0,
          delay:    this.props.hideDelay ? (this.props.delay || 0) : 0,
          duration: this.props.duration || defaultDuration,
          useNativeDriver: false
        }).start();
        this.pendingTimeout = setTimeout(() => {
          this.pendingTimeout = null;
          this.setState({show: false});
        }, this.props.duration || defaultDuration);
      }
    }

    // set new values as the current state.
    if (this.props.maxOpacity !== undefined) { this.maxOpacity = this.props.maxOpacity; }
    if (this.props.visible    !== undefined) { this.visible = this.props.visible;       }
  }

  componentWillUnmount() {
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
    }
  }

  render() {
    if (this.props.hidden) {
      // this will be the processing view after initialization.
      if (this.state.show === true) {
        return (
          <Animated.View style={[this.props.style, {overflow:'hidden', opacity:this.state.viewOpacity}]}>
            {this.props.children}
          </Animated.View>
        );
      }
      return <View />;

    }
    else {
      return (
        <Animated.View style={[this.props.style, {overflow:'hidden', opacity:this.state.viewOpacity}]}>
          {this.props.children}
        </Animated.View>
      );
    }
  }
}


export function HiddenFadeInView(props) {
  return <FadeInView {...props} hidden={true} />
}

export function FadeIn(props) {
  let [visible, setVisible] = useState(false);
  if (visible === false) {
    setTimeout(() => { setVisible(true); }, 0);
  }

  return (
    <FadeInView visible={visible} delay={props.index * 65 || 0} {...props}>
      {props.children}
    </FadeInView>
  );
}

export function HiddenFadeIn(props) {
  let [visible, setVisible] = useState(false);
  if (visible === false) {
    setTimeout(() => { setVisible(true); }, 0);
  }

  return (
    <HiddenFadeInView visible={visible} delay={props.index * 65 || 0} style={props.style}>
      {props.children}
    </HiddenFadeInView>
  );
}


export class HiddenFadeInBlur extends Component<any, any> {
  visible : boolean;
  maxOpacity : number;
  pendingTimeout : any;

  constructor(props) {
    super(props);

    this.state = {show: props.visible || false, viewOpacity: new Animated.Value(props.visible ? 1 : 0)};
    this.visible = props.visible || false;
    this.maxOpacity = props.maxOpacity || 1;
    this.pendingTimeout = null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    let defaultDuration = 200;
    if ((this.props.visible !== undefined && this.visible !== this.props.visible) || (this.props.maxOpacity !== undefined && this.maxOpacity !== this.props.maxOpacity)) {
      this.state.viewOpacity.stopAnimation()
      if (this.props.visible === true) {
        this.setState({show: true});
        this.pendingTimeout = setTimeout(() => {
          this.pendingTimeout = null;
          Animated.timing(this.state.viewOpacity, {
            toValue:  this.props.maxOpacity || this.maxOpacity,
            delay:    this.props.delay     || 0,
            duration: this.props.duration  || defaultDuration,
            useNativeDriver: false
          }).start();
        }, 0);
      }
      else {
        Animated.timing(this.state.viewOpacity, {
          toValue:  0,
          delay:    this.props.hideDelay ? (this.props.delay || 0) : 0,
          duration: this.props.duration || defaultDuration,
          useNativeDriver: false
        }).start();
        this.pendingTimeout = setTimeout(() => {
          this.pendingTimeout = null;
          this.setState({show: false});
        }, this.props.duration || defaultDuration);
      }
    }

    // set new values as the current state.
    if (this.props.maxOpacity !== undefined) { this.maxOpacity = this.props.maxOpacity; }
    if (this.props.visible    !== undefined) { this.visible = this.props.visible;       }
  }

  componentWillUnmount() {
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
    }
  }

  render() {
    // this will be the processing view after initialization.
    if (this.state.show === true) {
      return (
        <Animated.View style={{flex:1, overflow:'hidden', opacity:this.state.viewOpacity}}>
          <BlurView
            style={{position:'absolute', top:0, left:0, right:0, bottom:0}}
            blurType="light"
            blurAmount={6}
          />
          <View style={this.props.style}>
            {this.props.children}
          </View>
        </Animated.View>
      );
    }
    return <View />;
  }
}
