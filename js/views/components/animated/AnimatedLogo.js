import React, { Component } from 'react' 
import {
  Animated,
  Image,
  
} from 'react-native';

export class AnimatedLogo extends Component {
  constructor(props) {
    super();

    this.baseSize = props.size || 100;
    this.state = { size: new Animated.Value(this.baseSize) };

    this.animationTimeout = undefined;
  }

  componentDidMount() {
    this.animate();
  }

  componentWillUnmount() {
    if (this.animationTimeout !== undefined) {
      clearTimeout(this.animationTimeout);
    }
  }

  animate() {
    let newSize = Math.max(0.6*this.baseSize, this.baseSize * 1.1 * Math.random());
    Animated.spring(this.state.size, {toValue: newSize, friction:3}).start();

    this.animationTimeout = setTimeout(() => {this.animate();}, 800);
  }

  render() {
    return (
      <Animated.Image
        source={require("../../../images/crownstoneLogo.png")}
        style={[this.props.style, {width:this.state.size, height:this.state.size}]}
      />
    );
  }
}
