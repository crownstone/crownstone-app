
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
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import {OverlayManager} from "../../backgroundProcesses/OverlayManager";
import { LOGi } from "../../logging/Log";
import {Blur} from "../components/Blur";


export class Processing extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    if (typeof props.data === "string" || !props.data) {
      this.state = {
        visible: false,
        text: props.data,
        progress: undefined,
        progressText: undefined,
        opacity: undefined,
        progressDuration: 200
      };
    }
    else {
      this.state = {
        visible: false,
        text: props.data.text,
        progress: undefined,
        progressText: undefined,
        opacity: props.data.opacity === undefined ? null : props.data.opacity,
        progressDuration: 200
      };
    }

    this.unsubscribe = [];

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
        progress:         data.progress         === undefined ? 0               : data.progress,
        text:             data.text             === undefined ? this.state.text : data.text,
        opacity:          data.opacity          === undefined ? null            : data.opacity,
        progressDuration: data.progressDuration === undefined ? 200             : data.progressDuration,
        progressText:     data.progressText,
      })}));
    this.unsubscribe.push(core.eventBus.on('updateProgress', (data) => {
      this.setState({
        progress:         data.progress         === undefined ? this.state.progress     : data.progress,
        text:             data.text             === undefined ? this.state.text         : data.text,
        progressDuration: data.progressDuration === undefined ? 200                     : data.progressDuration,
        progressText:     data.progressText     === undefined ? this.state.progressText : data.progressText,
        opacity:          data.opacity          === undefined ? this.state.opacity      : data.opacity
      })}));
    this.unsubscribe.push(core.eventBus.on('hideProgress', () => {
      this.setState({
        visible:          false,
        progress:         undefined,
        text:             undefined,
        progressText:     undefined,
        progressDuration: 200,
        opacity:          null,
      }, () => {  NavigationUtil.closeOverlay(this.props.componentId); })}));
    this.unsubscribe.push(core.eventBus.on('hideLoading', () => {
      this.setState({
        visible:          false,
        progress:         undefined,
        text:             undefined,
        progressText:     undefined,
        progressDuration: 200,
        opacity:          null,
      }, () => {  NavigationUtil.closeOverlay(this.props.componentId); })}));
  }

  componentDidMount() {
    if (OverlayManager.loadingState === false) {
      LOGi.nav("ProcessingOverlay: Closing before showing the overlay", this.props.componentId);
      this.setState({visible: false}, () => {NavigationUtil.closeOverlay(this.props.componentId);});
    }
    else {
      this.setState({visible: true});
    }
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    return (
      <HiddenFadeInView
        style={styles.fullscreen}
        height={screenHeight}
        duration={200}
        testID={"Processing"}
        visible={this.state.visible}>
        <Blur
          blurType={'dark'}
          blurAmount={2}
          style={[styles.fullscreen,{justifyContent:'center', alignItems:'center'}]}
        >
          <View style={{width: 200, height:120, alignItems:'center', justifyContent:'center'}} >
            <AnimatedLogo />
          </View>
          {this.state.text ? <Text style={[styles.menuText,{fontWeight:'bold', paddingLeft:20, paddingRight:20, textAlign:'center'}]} testID={"Processing_text"}>{this.state.text}</Text> : undefined}
          {this.state.progress !== undefined ? <AnimatedLoadingBar progress={this.state.progress} progressDuration={this.state.progressDuration} /> : undefined}
          {this.state.progressText ? <Text style={[styles.menuText,{fontSize:15, fontStyle:'italic', textAlign:'center'}]}>{this.state.progressText}</Text> : undefined}
        </Blur>
      </HiddenFadeInView>
    );
  }
}
