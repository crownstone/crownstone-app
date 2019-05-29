
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ScaledImage", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image} from 'react-native';

export class ScaledImage extends Component<{source: any, targetWidth?: number, targetHeight?: number, sourceWidth: number, sourceHeight:number, style?:any}, any> {
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
      <Image source={this.props.source} resizeMode={'contain'} style={[{width: width, height: height}, this.props.style]} />
    );
  }
}