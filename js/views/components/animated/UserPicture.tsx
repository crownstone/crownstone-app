
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("UserPicture", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated} from 'react-native';
import {ProfilePicture} from "../ProfilePicture";

export class UserPicture extends Component<any, any> {
  x : number;
  y : number;
  opacity : number;

  constructor(props) {
    super(props);

    this.state = {x: new Animated.Value(props.x || 0), y: new Animated.Value(props.y || 0), opacity: new Animated.Value(0)};
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.opacity = 0;
  }

  componentWillUpdate(nextProps) {
    let animations = [];
    if (nextProps.x !== this.x) {
      this.x = nextProps.x;
      animations.push(Animated.timing(this.state.x, {toValue: nextProps.x, duration: 300}));
    }
    if (nextProps.y !== this.y) {
      this.y = nextProps.y;
      animations.push(Animated.timing(this.state.y, {toValue: nextProps.y, duration: 300}));
    }
    if (nextProps.opacity !== this.opacity) {
      this.opacity = nextProps.opacity;
      animations.push(Animated.timing(this.state.opacity, {toValue: nextProps.opacity, duration: 300}));
    }

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }

  componentDidMount() {
    if (this.props.opacity !== this.opacity) {
      this.opacity = this.props.opacity;
      if (this.props.disableFadeIn !== true) {
        Animated.timing(this.state.opacity, {toValue: this.props.opacity, duration: 300}).start();
      }
      else {
        this.state.opacity.setValue(this.props.opacity);
      }
    }
  }

  render() {
    let picture = null;
    if (this.props.user && this.props.user.data && this.props.user.data.picture) {
      picture = this.props.user.data.picture;
    }

    return (
      <Animated.View style={{position:'absolute', width: this.props.size, height: this.props.size, top: this.state.y, left: this.state.x, opacity: this.state.opacity}}>
        <ProfilePicture picture={picture} size={this.props.size} />
      </Animated.View>
    );
  }
}

