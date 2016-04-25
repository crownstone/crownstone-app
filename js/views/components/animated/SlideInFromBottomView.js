import React, {
  Animated,
  Component,
  Dimensions,
} from 'react-native';

export class SlideInFromBottomView extends Component {
  constructor(props) {
    super();

    let height = Dimensions.get('window').height;

    this.state = {
      visible: props.visible,
      viewHeight: new Animated.Value(props.visible ? height - props.height : height)
    }
  }

  render() {
    let height = Dimensions.get('window').height;
    let width  = Dimensions.get('window').width;

    if (this.state.visible !== this.props.visible) {
      if (this.props.visible === true) {
        Animated.timing(this.state.viewHeight, {toValue: height - this.props.height, duration:150}).start();
      }
      else {
        Animated.timing(this.state.viewHeight,  {toValue: height, duration:150}).start();
      }
      this.state.visible = this.props.visible;
    }


    return (
      <Animated.View style={[this.props.style, {position:'absolute', top: this.state.viewHeight, left:0, width: width, overflow:'hidden', height: this.props.height}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}
