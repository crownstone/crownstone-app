
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SlideFadeInView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  
} from 'react-native';

export class SlideFadeInView extends Component<any, any> {
  visible : boolean;

  constructor(props) {
    super(props);

    this.state = {
      viewOpacity: new Animated.Value(props.visible ? 1 : 0),
      viewHeight:  new Animated.Value(props.visible ? (props.height || (props.style && props.style.height)) : 0)
    };
    this.visible = props.visible || false;
  }

  componentWillUpdate(nextProps) {
    if (this.visible !== nextProps.visible) {
      let animations = []
      let delay = this.props.delay || 0;
      let duration = this.props.duration || 200;
      if (nextProps.visible === true) {
        animations.push(Animated.timing(this.state.viewOpacity, {
          toValue:  1,
          delay:    delay + 0.2*duration,
          duration: duration,
        }))
        animations.push(Animated.timing(this.state.viewHeight, {
          toValue:  (nextProps.height || (nextProps.style && nextProps.style.height)),
          delay:    delay,
          duration: duration
        }))
      }
      else {
        animations.push(Animated.timing(this.state.viewOpacity, {toValue: 0, delay:delay, duration:duration}));
        animations.push(Animated.timing(this.state.viewHeight,  {toValue: 0, delay:delay, duration:duration}));
      }
      Animated.parallel(animations).start();
      this.visible = nextProps.visible;
    }
  }

  render() {
    return (
      <Animated.View style={[this.props.style,{overflow:'hidden', opacity:this.state.viewOpacity, height: this.state.viewHeight}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}
