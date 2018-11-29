
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AnimatedLoadingBar", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Image,
  Text,
  View,
} from 'react-native';

import { colors, screenWidth} from '../../styles'


/**
 * expects a progress prop [0 .. 1]
 */
export class AnimatedLoadingBar extends Component<any, any> {
  width : number;
  barHeight : number;
  borderWidth : number;
  innerWidth : number;
  progressTarget : any;

  constructor(props) {
    super(props);
    this.width = props.width || screenWidth * 0.6;
    this.barHeight = props.height || 30;
    this.borderWidth = 3;
    this.innerWidth = this.width - 2 * this.borderWidth;
    this.progressTarget = props.progress;
    this.state = { progress: new Animated.Value(props.progress * this.innerWidth || 0) };
  }

  componentWillUpdate(nextProps) {
    if (nextProps.progress) {
      if (nextProps.progress !== this.progressTarget) {
        Animated.timing(this.state.progress, {
          toValue: this.innerWidth * nextProps.progress,
          duration: 200
        }).start();
        this.progressTarget = nextProps.progress;
      }
    }
  }

  render() {
    let innerHeight = this.barHeight - 2 * this.borderWidth;

    return (
      <View style={{width:this.width, overflow:'hidden', alignItems:'center', justifyContent:'center', height:this.barHeight, borderRadius: 18, margin:20, backgroundColor:'#fff'}}>
        <View style={{width:this.innerWidth, height:innerHeight, borderRadius: 15, margin:0, backgroundColor:colors.csBlue.hex, overflow:'hidden', alignItems:'flex-start', justifyContent:'center'}}>
          <Animated.View style={{width:this.state.progress, height: innerHeight, backgroundColor:colors.green.hex, borderRadius:0.5*innerHeight}} />
        </View>
      </View>
    );
  }
}