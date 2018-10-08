import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  
  Dimensions,
  Image,
  PixelRatio,
  Text,
  View,
} from 'react-native';

import { AnimatedLogo }       from './animated/AnimatedLogo'
import { AnimatedLoadingBar } from './animated/AnimatedLoadingBar'
import { HiddenFadeInView }         from './animated/FadeInView'
import { styles, colors , screenHeight} from './../styles'
import { eventBus } from '../../util/EventBus'

export class Processing extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      text: undefined,
      progress: undefined,
      progressText: undefined,
      opacity: undefined
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on('showLoading', (data) => {
      if (typeof data === "string") {
        this.setState({
          visible: true,
          progress: undefined,
          text: data,
          progressText: undefined,
          opacity: null,
        })
      }
      else {
        this.setState({
          visible: true,
          progress: undefined,
          text: data.text,
          progressText: undefined,
          opacity: data.opacity === undefined ? null : data.opacity,
        })
      }
    }));

    this.unsubscribe.push(eventBus.on('showProgress', (data) => {this.setState({
      visible:      true,
      progress:     data.progress === undefined ? 0               : data.progress,
      text:         data.text     === undefined ? this.state.text : data.text,
      opacity:      data.opacity  === undefined ? null            : data.opacity,
      progressText: data.progressText,
    })}));
    this.unsubscribe.push(eventBus.on('updateProgress', (data) => {this.setState({
      visible:      true,
      progress:     data.progress     === undefined ? this.state.progress     : data.progress,
      text:         data.text         === undefined ? this.state.text         : data.text,
      progressText: data.progressText === undefined ? this.state.progressText : data.progressText,
      opacity:      data.opacity      === undefined ? this.state.opacity      : data.opacity
    })}));
    this.unsubscribe.push(eventBus.on('hideProgress', () => {this.setState({
      visible:      false,
      progress:     undefined,
      text:         undefined,
      progressText: undefined,
      opacity:      null,
    })}));
    this.unsubscribe.push(eventBus.on('hideLoading', () => {this.setState({
      visible:      false,
      progress:     undefined,
      text:         undefined,
      progressText: undefined,
      opacity:      null,
    })}));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    return (
      <HiddenFadeInView
        style={[styles.fullscreen, {backgroundColor:colors.black.rgba(this.state.opacity || 0.75),justifyContent:'center', alignItems:'center'}]}
        height={screenHeight}
        duration={200}
        visible={this.state.visible}>
        <View style={{width: 200, height:120, alignItems:'center', justifyContent:'center'}} >
          <AnimatedLogo />
        </View>
        {this.state.text ? <Text style={[styles.menuText,{fontWeight:'bold', paddingLeft:20, paddingRight:20, textAlign:'center'}]}>{this.state.text}</Text> : undefined}
        {this.state.progress !== undefined ? <AnimatedLoadingBar progress={this.state.progress} /> : undefined}
        {this.state.progressText ? <Text style={[styles.menuText,{fontSize:15, fontWeight:'400', fontStyle:'italic', textAlign:'center'}]}>{this.state.progressText}</Text> : undefined}
      </HiddenFadeInView>
    );
  }
}