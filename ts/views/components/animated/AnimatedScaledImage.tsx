import * as React from 'react'; import { Component } from 'react';
import { Animated, Image, Platform, View } from "react-native";


export class AnimatedScaledImage extends Component<{
  duration?:          number,
  source: any,
  targetWidth?: number,
  targetHeight?: number,
  sourceWidth: number,
  sourceHeight:number,
  style?:any,
  tintColor?:string
}, any> {

  staticImage : any;
  animatedSource : any;
  value  : number = 0;

  constructor(props) {
    super(props);

    this.staticImage = this.props.source;
    this.animatedSource = this.props.source;
    this.state = {fade: new Animated.Value(0)};
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    let change = false;

    if (this.value === 0) {
      if (this.props.source !== this.staticImage) {
        change = true;
        this.animatedSource = this.props.source;
      }
    }
    else {
      if (this.props.source !== this.animatedSource) {
        change = true;
        this.staticImage = this.props.source;
      }
    }

    if (change) {
      let newValue = this.value === 0 ? 1 : 0;
      Animated.timing(this.state.fade, {toValue: newValue, duration: this.props.duration || 500}).start();
      this.value = newValue;
    }
  }

  render() {
    let factor = this.props.sourceWidth/this.props.sourceHeight;
    let width = this.props.sourceWidth;
    let height = this.props.sourceHeight;
    if (this.props.targetWidth && this.props.targetHeight) {
      width = this.props.targetWidth;
      height = this.props.targetHeight;
    }
    else if (this.props.targetWidth) {
      width = this.props.targetWidth;
      height = Math.round(this.props.targetWidth/factor);
    }
    else if (this.props.targetHeight) {
      height = this.props.targetHeight;
      width =  Math.round(this.props.targetHeight*factor);
    }


    return (
      <View style={{width: width, height:height}}>
        <View style={{width: width, height:height, position:'absolute', top:0, left:0}}>
          <Image source={this.staticImage} resizeMode={'contain'} style={[{width: width, height: height, tintColor: this.props.tintColor}, this.props.style]}/>
        </View>
        <Animated.View style={{width: width, height:height, position:'absolute', top:0, left:0, opacity:this.state.fade}}>
          <Image source={this.animatedSource} resizeMode={'contain'} style={[{width: width, height: height, tintColor: this.props.tintColor}, this.props.style]}/>
        </Animated.View>
      </View>
    );
  }
}