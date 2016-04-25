import React, {
  Animated,
  Component,
} from 'react-native';

export class FadeInView extends Component {
  constructor(props) {
    super();

    this.state = {
      visible: props.visible,
      viewOpacity: new Animated.Value(props.visible ? 1 : 0),
    }
  }

  render() {
    if (this.state.visible !== this.props.visible) {
      if (this.props.visible === true) {
        Animated.timing(this.state.viewOpacity, {toValue: 1, duration:this.props.duration || 100}).start();
      }
      else {
        Animated.timing(this.state.viewOpacity, {toValue: 0, duration:this.props.duration || 100}).start();
      }
      this.state.visible = this.props.visible;
    }

    return (
      <Animated.View style={[this.props.style, {overflow:'hidden', opacity:this.state.viewOpacity}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}
