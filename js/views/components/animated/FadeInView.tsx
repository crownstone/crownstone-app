import { Component } from 'react'
import {
  Animated,
  View
} from 'react-native';
import { LOG } from '../../../logging/Log'

export class FadeInView extends Component<any, any> {
  visible : boolean;
  pendingTimeout : any;

  constructor(props) {
    super();

    this.state = {show: props.visible || false, viewOpacity: new Animated.Value(props.visible ? 1 : 0)};
    this.visible = props.visible || false;
    this.pendingTimeout = null;
  }

  componentWillUpdate(nextProps) {
    let defaultDuration = 200;
    if (this.visible !== nextProps.visible) {
      if (nextProps.visible === true) {
        this.setState({show: true});
        this.pendingTimeout = setTimeout(() => {
          this.pendingTimeout = null;
          Animated.timing(this.state.viewOpacity, {toValue: 1, duration:this.props.duration || defaultDuration}).start();
        },0);
      }
      else {
        Animated.timing(this.state.viewOpacity, {toValue: 0, duration:this.props.duration || defaultDuration}).start();
        this.pendingTimeout = setTimeout(() => {
          this.pendingTimeout = null;
          this.setState({show: false});
        },this.props.duration || defaultDuration);
      }
      this.visible = nextProps.visible;
    }
  }

  componentWillUnmount() {
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
    }
  }

  render() {
    // this will be the processing view after initialization.
    if (this.state.show === true) {
      return (
        <Animated.View style={[this.props.style, {overflow:'hidden', opacity:this.state.viewOpacity}]}>
          {this.props.children}
        </Animated.View>
      );
    }
    return <View />;
  }
}
