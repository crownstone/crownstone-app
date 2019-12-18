
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SlideInView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
} from 'react-native';

export class AnimatedSizeView extends Component<any, any> {
  width  : number;
  height : number;

  constructor(props) {
    super(props);

    this.state = {
      width:  new Animated.Value(props.width  || 0),
      height: new Animated.Value(props.height || 0),
    };
    this.width  = props.width  || 0;
    this.height = props.height || 0;
  }

  componentWillUpdate(nextProps) {
    let actions = [];
    console.log("IM HERE", this.width, nextProps.width)
    if (this.width !== nextProps.width) {
      actions.push(
        Animated.timing(this.state.width, {
          toValue: nextProps.width     || 0,
          delay:   this.props.delay    || 0,
          duration:this.props.duration || 200
        })
      );
    }
    if (this.height !== nextProps.height) {
      actions.push(
        Animated.timing(this.state.height, {
          toValue: nextProps.height    || 0,
          delay:   this.props.delay    || 0,
          duration:this.props.duration || 200
        })
      );
    }

    if (actions.length > 0) {
      this.state.width.stopAnimation();
      this.state.height.stopAnimation();

      Animated.parallel(actions).start(() => { this.width = nextProps.width; this.height = nextProps.height});
    }
  }

  render() {
    return (
      <Animated.View style={[this.props.style, {overflow:'hidden', height: this.state.height, width: this.state.width}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}
