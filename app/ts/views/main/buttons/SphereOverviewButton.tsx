
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SmartHomeStateButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ActivityIndicator, Alert, Animated,
  Text,
  TouchableOpacity, View, ViewProps, ViewStyle
} from "react-native";
import {colors, screenWidth} from "../../styles";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { core } from "../../../Core";
import { Icon } from "../../components/Icon";
import { Component } from "react";
import { SlideSideFadeInView } from "../../components/animated/SlideFadeInView";
import { SphereStateManager } from "../../../backgroundProcesses/SphereStateManager";
import { AnimatedCircle } from "../../components/animated/AnimatedCircle";
import { Circle } from "../../components/Circle";
import { BorderCircle } from "../../components/BorderCircle";
import { NavigationUtil } from "../../../util/NavigationUtil";


export const SPHERE_OVERVIEW_BUTTON_SIZE      = 0.11*screenWidth;
export const SPHERE_OVERVIEW_BUTTON_ICON_SIZE = 0.045*screenWidth;

export class SphereOverviewButton extends Component<{
  testID: string,
  callback: () => void,
  visible: boolean,
  icon?: string,
  iconScale?: number,
  highlight?: boolean,
  customIcon?: any,
  position: "top-right" | "top-left" | "bottom-left" | "bottom-right",

}, any> {

  outerColor  : string;
  borderColor : string;
  innerColor  : string;
  iconColor   : string;

  rippleColor   : string;
  rippleSize    : number;

  size          : number;
  highlightSize : number;
  iconSize      : number;

  constructor(props) {
    super(props);

    this.outerColor  = colors.white.rgba(0.75);
    this.borderColor = colors.csBlue.hex;
    this.innerColor  = colors.csBlue.hex;
    this.iconColor   = colors.white.hex;

    this.rippleColor   = colors.white.rgba(0.6);
    this.rippleSize    = 0.5*SPHERE_OVERVIEW_BUTTON_SIZE;
    this.size          = SPHERE_OVERVIEW_BUTTON_SIZE;
    this.highlightSize = SPHERE_OVERVIEW_BUTTON_SIZE;
    this.iconSize      = SPHERE_OVERVIEW_BUTTON_ICON_SIZE * (this.props.iconScale ?? 1);
  }

  componentDidMount() {
    if (this.props.highlight) {
      this.animate();
    }
  }

  componentWillUnmount() {
    this.stopAnimation();
  }

  animate() {
    let pulse = () => {
      this.size = 1.3*SPHERE_OVERVIEW_BUTTON_SIZE;
      this.rippleSize = 2*SPHERE_OVERVIEW_BUTTON_SIZE;
      this.highlightSize = 1*SPHERE_OVERVIEW_BUTTON_SIZE;

      this.rippleColor = colors.white.rgba(0)
      this.outerColor  = colors.white.rgba(1);
      this.borderColor = colors.lightBlue.hex;
      this.innerColor  = colors.blue.hex;
      this.forceUpdate()
      setTimeout(() => {
        this.outerColor  = colors.white.rgba(0.75);
        this.borderColor = colors.csBlue.hex;
        this.innerColor  = colors.csBlueDarker.hex;
        this.rippleColor = colors.blue.rgba(0.6)
        this.rippleSize = 0.5*SPHERE_OVERVIEW_BUTTON_SIZE;
        this.size = 1*SPHERE_OVERVIEW_BUTTON_SIZE;
        this.highlightSize = 1.2*SPHERE_OVERVIEW_BUTTON_SIZE;
        this.forceUpdate()
      },800)
    }
    setInterval(pulse,1600);
    pulse();
  }

  stopAnimation() {

  }

  shouldComponentUpdate(nextProps, nextState, nextContext): boolean {
    if (nextProps.highlight === true && this.props.highlight !== true) {
      this.animate();
    }
    else if (nextProps.highlight !== true && this.props.highlight === true) {
      this.stopAnimation();
    }


    return true;
  }


  render() {
    // if (this.props.highlight) {
    //   this.outerColor  = colors.blue.rgba(0.75);
    //   this.borderColor = colors.white.hex;
    //   this.innerColor  = colors.blue.hex;
    //
    //   this.size *= 1.2;
    //   this.iconSize *= 1.2;
    // }

    let style : ViewStyle = {};
    switch (this.props.position) {
      case "top-right":    style = {top: 0,    right: 0,}; break;
      case "top-left":     style = {top: 0,    left:  0,}; break;
      case "bottom-left":  style = {bottom: 0, left:  0,}; break;
      case "bottom-right": style = {bottom: 0, right: 0,}; break;
    }

    let padding = 6;

    if (!this.props.visible) {
      return <View />;
    }

    let wrapperStyle : ViewStyle = {
      position: 'absolute',
      ...style,
      width:  SPHERE_OVERVIEW_BUTTON_SIZE + 2*padding,
      height: SPHERE_OVERVIEW_BUTTON_SIZE + 2*padding,
      alignItems: 'center',
      justifyContent:'center',
      overflow:"visible",
    }

    return (
      <View style={wrapperStyle}>
        <View style={wrapperStyle} pointerEvents={'none'}>
          <AnimatedCircle size={this.rippleSize} color={this.rippleColor} />
        </View>
        <TouchableOpacity
          onPress={this.props.callback}
          testID={this.props.testID}
          style={{
            overflow:'visible',
          }}
        >
          <AnimatedCircle size={this.size} color={this.outerColor}>
            <AnimatedCircle size={this.size-10} color={this.borderColor} delay={100}>
              <AnimatedCircle size={this.size-13} color={this.innerColor} delay={200}>
              { this.props.customIcon ?? <Icon name={this.props.icon} size={this.iconSize} color={this.iconColor}/> }
              </AnimatedCircle>
            </AnimatedCircle>
          </AnimatedCircle>
        </TouchableOpacity>
      </View>
    );
  }
}
