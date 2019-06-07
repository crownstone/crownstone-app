import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  
} from 'react-native';

export class SlideFadeInView extends Component<{visible, height, delay?, duration?, style?}, any> {
  visible : boolean;
  height : number;

  constructor(props) {
    super(props);

    this.state = {
      viewOpacity: new Animated.Value(props.visible ? 1 : 0),
      viewHeight:  new Animated.Value(props.visible ? (props.height || (props.style && props.style.height)) : 0)
    };
    this.height =  props.height || (props.style && props.style.height);
    this.visible = props.visible || false;
  }

  componentWillUpdate(nextProps) {
    let delay = this.props.delay || 0;
    let duration = this.props.duration || 200;
    let height = nextProps.height || (nextProps.style && nextProps.style.height);
    if (this.visible !== nextProps.visible) {
      let animations = [];
      if (nextProps.visible === true) {
        animations.push(Animated.timing(this.state.viewOpacity, {
          toValue:  1,
          delay:    delay + 0.2*duration,
          duration: duration,
        }));
        animations.push(Animated.timing(this.state.viewHeight, {
          toValue:  height,
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
    else if (this.visible && this.height !== height) {
      Animated.timing(this.state.viewHeight, {toValue: height, delay: delay, duration: duration }).start(() => { this.height = height; })
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


export class SlideSideFadeInView extends Component<{visible, width, delay?, duration?, style?}, any> {
  visible : boolean;
  width : number;

  constructor(props) {
    super(props);

    this.state = {
      viewOpacity: new Animated.Value(props.visible ? 1 : 0),
      viewWidth:  new Animated.Value(props.visible ? (props.width || (props.style && props.style.width)) : 0)
    };
    this.width =  props.width || (props.style && props.style.width);
    this.visible = props.visible || false;
  }

  componentWillUpdate(nextProps) {
    let delay = this.props.delay || 0;
    let duration = this.props.duration || 200;
    let width = nextProps.width || (nextProps.style && nextProps.style.width);
    if (this.visible !== nextProps.visible) {
      let animations = [];
      if (nextProps.visible === true) {
        animations.push(Animated.timing(this.state.viewOpacity, {
          toValue:  1,
          delay:    delay + 0.2*duration,
          duration: duration,
        }));
        animations.push(Animated.timing(this.state.viewWidth, {
          toValue:  width,
          delay:    delay,
          duration: duration
        }))
      }
      else {
        animations.push(Animated.timing(this.state.viewOpacity, {toValue: 0, delay:delay, duration:duration}));
        animations.push(Animated.timing(this.state.viewWidth,  {toValue: 0, delay:delay, duration:duration}));
      }
      Animated.parallel(animations).start();
      this.visible = nextProps.visible;
    }
    else if (this.visible && this.width !== width) {
      Animated.timing(this.state.viewWidth, {toValue: width, delay: delay, duration: duration }).start(() => { this.width = width; })
    }
  }

  render() {
    return (
      <Animated.View style={[this.props.style,{overflow:'hidden', opacity:this.state.viewOpacity, width: this.state.viewWidth}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}

