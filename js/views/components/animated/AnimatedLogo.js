import React, { Component } from 'react' 
import {
  Animated,
  Image,
  
} from 'react-native';

export class AnimatedLogo extends Component {
  constructor(props) {
    super();

    this.baseSize = props.size || 100;
    this.setSize = this.baseSize;
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
    let currentSize = this.setSize;
    let newSize = currentSize;
    for (let i = 0; i < 5; i++) {
      newSize = this._getNewSize();
      console.log("Math.abs((newSize - currentSize)/currentSize) ",Math.abs((newSize - currentSize)/currentSize) );
      if (Math.abs((newSize - currentSize)/currentSize) > 0.35) {
        break;
      }
    }

    Animated.spring(this.state.size, {toValue: newSize, friction:3}).start();

    this.animationTimeout = setTimeout(() => {this.animate();}, 800);
  }

  _getNewSize() {
    return Math.max(0.6*this.baseSize, this.baseSize * 1.1 * Math.random());
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
