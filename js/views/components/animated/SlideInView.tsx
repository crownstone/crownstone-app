
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SlideInView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
} from 'react-native';

export class SlideInView extends Component<any, any> {
  visible : boolean;

  constructor(props) {
    super(props);

    this.state = {viewHeight: new Animated.Value(props.visible ? (props.height || (props.style && props.style.height)) : 0)};
    this.visible = props.visible || false;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.visible !== this.props.visible) {
      if (this.props.visible === true) {
        Animated.timing(this.state.viewHeight, {
          toValue: (this.props.height || (this.props.style && this.props.style.height)) || 0,
          delay: this.props.delay || 0,
          duration:this.props.duration || 200
        }).start();
      }
      else {
        Animated.timing(this.state.viewHeight, {
          toValue: 0,
          delay: this.props.delay || 0,
          duration: this.props.duration || 200
        }).start();
      }
      this.visible = this.props.visible;
    }
  }

  render() {
    return (
      <Animated.View style={[this.props.style, {overflow:'hidden', height: this.state.viewHeight}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}
