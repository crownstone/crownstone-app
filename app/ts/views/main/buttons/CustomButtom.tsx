
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SmartHomeStateButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  TouchableOpacity, View, ViewStyle
} from "react-native";
import {colors, screenWidth} from "../../styles";
import { Icon } from "../../components/Icon";
import { Component } from "react";
import { AnimatedCircle } from "../../components/animated/AnimatedCircle";


export const SPHERE_OVERVIEW_BUTTON_SIZE      = 0.11*screenWidth;
export const SPHERE_OVERVIEW_BUTTON_ICON_SIZE = 0.045*screenWidth;

export class CustomButtom extends Component<{
  testID: string,
  callback: () => void,
  visible: boolean,
  icon?: string,
  iconScale?: number,
  highlight?: boolean,
  customIcon?: any,
  position:     "top-right" | "top-right-2" | "top-left" | "bottom-left" | "bottom-right" | "custom",
  borderColor?: string,
  outerColor?: string,
  innerColor?:  string,
  iconColor?:  string,
  style?: ViewStyle
  innerStyle?: ViewStyle
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

  animationInterval = null;
  animationTimeout = null;

  constructor(props) {
    super(props);

    this.setDefaultStyle();
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
    clearInterval(this.animationInterval);
    clearTimeout(this.animationTimeout);

    let pulse = () => {
      this.size = 1.3*SPHERE_OVERVIEW_BUTTON_SIZE;
      this.rippleSize = 2*SPHERE_OVERVIEW_BUTTON_SIZE;
      this.highlightSize = 1*SPHERE_OVERVIEW_BUTTON_SIZE;

      this.rippleColor = colors.white.rgba(0)
      this.outerColor  = colors.white.rgba(1);
      this.borderColor = colors.lightBlue.hex;
      this.innerColor  = colors.blue.hex;
      this.forceUpdate()
      this.animationTimeout = setTimeout(() => {
        this.outerColor  = this.props.outerColor  ?? colors.white.rgba(0.75);
        this.borderColor = this.props.borderColor ?? colors.csBlue.hex;
        this.innerColor  = this.props.innerColor  ?? colors.csBlue.hex;
        this.rippleColor = colors.blue.rgba(0.0)
        this.rippleSize = 0.5*SPHERE_OVERVIEW_BUTTON_SIZE;
        this.size = 1*SPHERE_OVERVIEW_BUTTON_SIZE;
        this.highlightSize = 1.2*SPHERE_OVERVIEW_BUTTON_SIZE;
        this.forceUpdate()
      },800)
    }
    this.animationInterval = setInterval(pulse,1600);
    pulse();
  }

  stopAnimation() {
    clearInterval(this.animationInterval);
    clearTimeout(this.animationTimeout);

    this.setDefaultStyle();
    this.forceUpdate();
  }

  setDefaultStyle() {
    this.outerColor  = this.props.borderColor ?? 'transparent';
    this.borderColor = this.props.borderColor ?? 'transparent';
    this.innerColor  = this.props.innerColor  ?? 'transparent';
    this.iconColor   = this.props.iconColor   ?? colors.csBlue.hex;

    this.rippleColor   = colors.white.rgba(0.0);
    this.rippleSize    = 0.5*SPHERE_OVERVIEW_BUTTON_SIZE;
    this.size          = SPHERE_OVERVIEW_BUTTON_SIZE;
    this.highlightSize = SPHERE_OVERVIEW_BUTTON_SIZE;
    this.iconSize      = SPHERE_OVERVIEW_BUTTON_ICON_SIZE * (this.props.iconScale ?? 1);
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
    let style : ViewStyle = {};
    let innerStyle : ViewStyle = null;
    let padding = 6;
    switch (this.props.position) {
      case "top-right-2":  style = {top: SPHERE_OVERVIEW_BUTTON_SIZE + padding, right: 0};  break;
      case "top-right":    style = {top: 0,    right: 0,}; break;
      case "top-left":     style = {top: 0,    left:  0,}; break;
      case "bottom-left":  style = {bottom: 0, left:  0,}; break;
      case "bottom-right": style = {bottom: 0, right: 0,}; break;
      case "custom":       style = this.props.style; innerStyle = {top: 0, right: 0}; break;;
    }

    if (innerStyle === null) {
      innerStyle = this.props.innerStyle ?? style;
    }


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
    };



    return (
      <View style={wrapperStyle}>
        <View style={{...wrapperStyle, ...innerStyle}} pointerEvents={'none'}>
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
