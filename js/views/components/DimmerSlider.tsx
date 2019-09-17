
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DimmerButton", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Text,
  View
} from "react-native";

import { colors, deviceStyles, screenWidth, styles } from "../styles";
import { HiddenFadeIn, HiddenFadeInView } from "./animated/FadeInView";
import { xUtil } from "../../util/StandAloneUtil";

const SLIDER_BUBBLE_SIZE = 70;
const PADDING = 0.125*screenWidth;
const SLIDER_WIDTH = screenWidth - 2 * PADDING;
const UPPER_BOUND = screenWidth - PADDING;
const LOWER_BOUND = PADDING;
const RANGE = UPPER_BOUND - LOWER_BOUND;
const CORRECTION = LOWER_BOUND/RANGE;
export const INDICATOR_SIZE = 60;
export const INDICATOR_SPACING = 20;

export class DimmerSlider extends Component<{initialState: number, dimmingSynced: boolean, showDimmingText: boolean, callback: any}, any> {

  _panResponder;
  x = null;
  indicatorTimeout = null;

  constructor(props) {
    super(props)

    this.x = new Animated.Value(xUtil.transformStoneSwitchStateToUISwitchState(props.initialState)*RANGE + LOWER_BOUND);
    this.state = {
      showIndicator: false
    };
    this.init()
  }


  init() {
    const updateState = (gestureState) => {
      let newState = Math.max(LOWER_BOUND, Math.min(UPPER_BOUND, gestureState.x0 + gestureState.dx));
      let percentage = newState / RANGE - CORRECTION;
      if (this.props.dimmingSynced === false) {
        if (percentage < 0.5) {
          newState = LOWER_BOUND;
        }
        else {
          newState = UPPER_BOUND
        }
      }
      else {
        if (percentage >= 0.05 && percentage < 0.1) {
          newState = (0.1 + CORRECTION)*RANGE;
        }
        else if (percentage < 0.05) {
          newState = LOWER_BOUND;
        }
      }

      this.x.setValue(newState);
      this.props.callback(newState / RANGE - CORRECTION);
    }

    // configure the pan responder
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder:        (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder:         (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture:  (evt, gestureState) => true,
      onPanResponderTerminationRequest:    (evt, gestureState) => false,
      onShouldBlockNativeResponder:        (evt, gestureState) => true,
      onPanResponderTerminate:             (evt, gestureState) => { },
      onPanResponderGrant: (evt, gestureState) => {
        this.setState({showIndicator: true});
        updateState(gestureState);
        clearTimeout(this.indicatorTimeout);
      },
      onPanResponderMove: (evt, gestureState) => {
        updateState(gestureState);
      },

      onPanResponderRelease: (evt, gestureState) => {
        this.indicatorTimeout = setTimeout(() => { this.setState({showIndicator: false})},  this.props.dimmingSynced === false ? 500 : 0);
      },
    });
  }

  componentWillUnmount(): void {
    clearTimeout(this.indicatorTimeout);
  }

  _getDimmerStatus() {
    if (this.props.dimmingSynced === false) {
      return (
        <View style={{flexDirection:"row"}}>
          <ActivityIndicator size={"small"} style={{height:25, paddingRight:3}} />
          <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{fontSize: 13, lineHeight: 25, color: colors.black.rgba(0.3), textAlign:'center'}}>Get close to enable dimming!</Text>
        </View>
      );
    }
    else if (this.props.showDimmingText) {
      return (
        <View style={{flexDirection:"row"}}>
          <ActivityIndicator size={"small"} style={{height:25, paddingRight:3}} />
          <Text style={{fontSize: 13, lineHeight: 25, color: colors.black.rgba(0.3), textAlign:'center'}}>The dimmer is starting up...</Text>
        </View>
      );
    }
  }

  _getIndicator() {
    if (this.props.dimmingSynced) {
      return (
        <View style={{marginBottom: INDICATOR_SPACING, height: INDICATOR_SIZE}}>
          <Indicator x={this.x} visible={this.state.showIndicator} />
        </View>
      );
    }
    else {
      return (
        <View style={{marginBottom: INDICATOR_SPACING-15, height: INDICATOR_SIZE+15}}>
          <Explanation visible={this.state.showIndicator} />
        </View>
      );

    }
  }

  render() {
    return (
      <View style={{width:screenWidth, height: SLIDER_BUBBLE_SIZE + INDICATOR_SIZE + INDICATOR_SPACING}}>
        { this._getIndicator() }
        <View {...this._panResponder.panHandlers} style={{width:screenWidth, height: SLIDER_BUBBLE_SIZE, alignItems:'center', justifyContent:'center'}}>
        <View style={{height:50, width: SLIDER_WIDTH, backgroundColor: colors.white.rgba(0.8), borderRadius: 25, alignItems:'center', justifyContent:'center'}}>
          { this._getDimmerStatus() }
        </View>
        <SliderBubble x={this.x} />
        </View>
      </View>
    )
  }
}


class SliderBubbleClass extends Component<any, any> {
  render() {
    let percentage = this.props.x / RANGE - CORRECTION;

    return (
      <View
        style={{
          position: "absolute",
          left: this.props.x - 0.5 * SLIDER_BUBBLE_SIZE,
          height: SLIDER_BUBBLE_SIZE,
          width: SLIDER_BUBBLE_SIZE,
          borderRadius: SLIDER_BUBBLE_SIZE * 0.5,
          backgroundColor: colors.csBlueDark.rgba(1), ...styles.centered
        }}>
        <View
          style={{ width: 65, height: 65, backgroundColor: colors.white.hex, borderRadius: 33, ...styles.centered }}>
          <View style={{
            width: 60,
            height: 60,
            backgroundColor: colors.csBlueDark.blend(colors.green, percentage).hex,
            borderRadius: 30, ...styles.centered
          }}>
            <Text style={{
              color: colors.white.hex,
              fontSize: 18,
              fontWeight: "bold"
            }}>{Math.round(percentage * 100) + "%"}</Text>
          </View>
        </View>
      </View>
    );
  }
}

const SliderBubble = Animated.createAnimatedComponent(SliderBubbleClass);

class IndicatorClass extends Component<any, any> {
  render() {
    let percentage = this.props.x / RANGE - CORRECTION;

    return (
      <HiddenFadeInView
        style={{
          position: "absolute",
          left: this.props.x - 0.65 * INDICATOR_SIZE,
          height: INDICATOR_SIZE,
          width: INDICATOR_SIZE * 1.3,
          borderRadius: SLIDER_BUBBLE_SIZE * 0.5,
          backgroundColor: colors.black.rgba(0.2), ...styles.centered
        }}
        visible={this.props.visible}
      >
        <Text style={{
          color: colors.white.hex,
          fontSize: 18,
          fontWeight: "bold"
        }}>{Math.round(percentage * 100) + "%"}</Text>
      </HiddenFadeInView>
    );
  }
}
const Indicator = Animated.createAnimatedComponent(IndicatorClass);

class Explanation extends Component<any, any> {
  render() {
    return (
      <HiddenFadeInView
        style={{
          height: INDICATOR_SIZE + 15,
          width: screenWidth,
          alignItems:'center',
          justifyContent:"center"
        }}
        visible={this.props.visible}
      >
        <View style={{
          width: screenWidth*0.95,
          borderRadius: SLIDER_BUBBLE_SIZE * 0.5,
          backgroundColor: colors.black.rgba(0.2), ...styles.centered,
          padding: 10,
        }}>
          <Text style={{
            color: colors.white.hex,
            fontSize: 13,
            fontWeight: "bold",
            textAlign:'center'
          }}>{"Smooth sliding will be available once I'm close enough to the Crownstone to enable dimming on it."}</Text>
        </View>
      </HiddenFadeInView>
    );
  }
}
