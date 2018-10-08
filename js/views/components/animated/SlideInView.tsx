import { Languages } from "../../../Languages"
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

  componentWillUpdate(nextProps) {
    if (this.visible !== nextProps.visible) {
      if (nextProps.visible === true) {
        Animated.timing(this.state.viewHeight, {
          toValue: (nextProps.height || (nextProps.style && nextProps.style.height)),
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
      this.visible = nextProps.visible;
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
