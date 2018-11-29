
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SlideInFromBottomView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  
  Dimensions,
} from 'react-native';

export class SlideInFromBottomView extends Component<any, any> {
  visible : boolean;

  constructor(props) {
    super(props);

    let height = Dimensions.get('window').height;

    this.state = {viewHeight: new Animated.Value(props.visible ? height - props.height : height)};
    this.visible = props.visible || false;
  }

  componentWillUpdate(nextProps) {
    let height = Dimensions.get('window').height;
    if (this.visible !== nextProps.visible) {
      if (nextProps.visible === true) {
        Animated.timing(this.state.viewHeight, {toValue: height - nextProps.height, duration:150}).start();
      }
      else {
        Animated.timing(this.state.viewHeight,  {toValue: height, duration:150}).start();
      }
      this.visible = nextProps.visible;
    }
  }

  render() {
    let width  = Dimensions.get('window').width;

    return (
      <Animated.View style={[this.props.style, {position:'absolute', top: this.state.viewHeight, left:0, width: width, overflow:'hidden', height: this.props.height}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}
