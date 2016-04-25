import React, {
  Animated,
  Component,
} from 'react-native';

export class SlideInView extends Component {
  constructor(props) {
    super();

    this.state = {
      visible: props.visible,
      viewHeight: new Animated.Value(props.visible ? props.height : 0)
    }
  }

  render() {
    if (this.state.visible !== this.props.visible) {
      if (this.props.visible === true) {
        Animated.timing(this.state.viewHeight, {toValue: this.props.height, duration:200}).start();
      }
      else {
        Animated.timing(this.state.viewHeight,  {toValue: 0, duration:200}).start();
      }
      this.state.visible = this.props.visible;
    }

    return (
      <Animated.View style={[this.props.style, {overflow:'hidden', height: this.state.viewHeight}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}
