
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Processing", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  
  Text,
  View,
} from 'react-native';

import { AnimatedLogo }       from '../components/animated/AnimatedLogo'
import { AnimatedLoadingBar } from '../components/animated/AnimatedLoadingBar'
import { HiddenFadeInView }         from '../components/animated/FadeInView'
import { styles, colors , screenHeight} from '../styles'
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";

export class Processing extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);


    console.log(props)
    if (typeof props.data === "string" || !props.data) {
      this.state = {
        visible: false,
        text: props.data,
        progress: undefined,
        progressText: undefined,
        opacity: undefined
      };
    }
    else {
      this.state = {
        visible: false,
        text: props.data.text,
        progress: undefined,
        progressText: undefined,
        opacity: props.data.opacity === undefined ? null : props.data.opacity,
      };
    }

    this.unsubscribe = [];
  }

  componentDidMount() {
    this.setState({visible: true})

    this.unsubscribe.push(core.eventBus.on('showLoading', (data) => {
      if (typeof data === "string" || !data) {
        this.setState({
          progress: undefined,
          text: data,
          progressText: undefined,
          opacity: null,
        })
      }
      else {
        this.setState({
          progress: undefined,
          text: data.text,
          progressText: undefined,
          opacity: data.opacity === undefined ? null : data.opacity,
        })
      }
    }));

    this.unsubscribe.push(core.eventBus.on('showProgress', (data) => {
      this.setState({
        progress:     data.progress === undefined ? 0               : data.progress,
        text:         data.text     === undefined ? this.state.text : data.text,
        opacity:      data.opacity  === undefined ? null            : data.opacity,
        progressText: data.progressText,
      })}));
    this.unsubscribe.push(core.eventBus.on('updateProgress', (data) => {
      this.setState({
        progress:     data.progress     === undefined ? this.state.progress     : data.progress,
        text:         data.text         === undefined ? this.state.text         : data.text,
        progressText: data.progressText === undefined ? this.state.progressText : data.progressText,
        opacity:      data.opacity      === undefined ? this.state.opacity      : data.opacity
      })}));
    this.unsubscribe.push(core.eventBus.on('hideProgress', () => {
      this.setState({
        visible:      false,
        progress:     undefined,
        text:         undefined,
        progressText: undefined,
        opacity:      null,
      }, () => {  NavigationUtil.closeOverlay(this.props.componentId); })}));
    this.unsubscribe.push(core.eventBus.on('hideLoading', () => {
      this.setState({
        visible:      false,
        progress:     undefined,
        text:         undefined,
        progressText: undefined,
        opacity:      null,
      }, () => {  NavigationUtil.closeOverlay(this.props.componentId); })}));
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