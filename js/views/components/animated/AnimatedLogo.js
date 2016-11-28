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
    // we want a noticable difference from the old size
    let newSize = this._getNewSize();

    Animated.spring(this.state.size, {toValue: newSize, friction:3}).start();

    this.animationTimeout = setTimeout(() => {this.animate();}, 800);
  }

  _getNewSize() {
    let range = 0.5 * this.baseSize;
    return 0.6 * this.baseSize + range * Math.random();
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
