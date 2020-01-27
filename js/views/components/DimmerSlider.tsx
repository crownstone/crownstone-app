import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Text,
  View
} from "react-native";

import { availableScreenHeight, colors, screenWidth, styles } from "../styles";
import { HiddenFadeInView } from "./animated/FadeInView";
import { NavigationUtil } from "../../util/NavigationUtil";
import ResponsiveText from "./ResponsiveText";
import { core } from "../../core";

const SLIDER_BUBBLE_SIZE = Math.min(0.12*availableScreenHeight, 70);
const PADDING = 0.125*screenWidth;
const SLIDER_WIDTH = screenWidth - 2 * PADDING;
const UPPER_BOUND = screenWidth - PADDING;
const LOWER_BOUND = PADDING;
const RANGE = UPPER_BOUND - LOWER_BOUND;
const CORRECTION = LOWER_BOUND/RANGE;
export const DIMMING_INDICATOR_SIZE = Math.min(0.08*availableScreenHeight, 60);
export const DIMMING_INDICATOR_SPACING = DIMMING_INDICATOR_SIZE/3;

export class DimmerSlider extends Component<{stoneId: string, sphereId: string, callback: any}, {showIndicator: boolean, dimmerReady: boolean, dimmingSyncedToCrownstone: boolean}> {

  _panResponder;
  x = null;
  indicatorTimeout = null;
  manualSwitchTimeout = null;
  manualSwitchTimeoutActive = false;
  lastRecordedValue = null;
  lastRecordedValueTimeout = null;

  percentage = null;
  changeTime = 0;
  unsubscribeStoreEvents = null;



  constructor(props) {
    super(props)


    let state = core.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    if (!stone || !stone.config) { return; }

    let switchState = stone.state.state;

    this.x = new Animated.Value(switchState*RANGE + LOWER_BOUND);
    this.percentage = switchState;
    this.lastRecordedValue = switchState;

    this.state = {
      showIndicator: false,
      dimmerReady: stone.state.dimmerReady,
      dimmingSyncedToCrownstone: stone.abilities.dimming.syncedToCrownstone
    };

    this.init();
  }

  componentDidMount(): void {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = core.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      let newState = {};
      let changed = false;

      if (change.stoneSyncedAbilities && change.updateStoneState.stoneIds[this.props.stoneId]) {
        if (stone.abilities.dimming.syncedToCrownstone !== this.state.dimmingSyncedToCrownstone) {
          newState["dimmingSyncedToCrownstone"] = stone.abilities.dimming.syncedToCrownstone;
          changed = true;
        }
      }

      if (change.updateStoneState && change.updateStoneState.stoneIds[this.props.stoneId]) {
        if (stone.state.state !== this.percentage) {
          this.lastRecordedValue = stone.state.state;
          if (this.manualSwitchTimeoutActive === false) {
            this._updatePercentage(stone.state.state, false);
          }
        }

        if (stone.state.dimmerReady !== this.state.dimmerReady) {
          newState['dimmerReady'] = stone.state.dimmerReady;
          changed = true;
        }
      }

      if (changed) {
        this.setState(newState);
      }
    });
  }


  init() {
    const updateState = (gestureState) => {
      let newState = Math.max(LOWER_BOUND, Math.min(UPPER_BOUND, gestureState.x0 + gestureState.dx));
      let percentage = (newState-LOWER_BOUND) / RANGE;
      // round this to a 0-100 int
      percentage = Math.round(percentage*100) / 100;

      this._updatePercentage(percentage, true);
      this.props.callback(percentage);
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
        NavigationUtil.setViewBackSwipeEnabled(false);
        this.setState({showIndicator: true});
        updateState(gestureState);
        clearTimeout(this.indicatorTimeout);
      },
      onPanResponderMove: (evt, gestureState) => {
        updateState(gestureState);
      },

      onPanResponderRelease: (evt, gestureState) => {
        this.indicatorTimeout = setTimeout(() => { this.setState({showIndicator: false})},  this.state.dimmingSyncedToCrownstone === false ? 500 : 0);
        NavigationUtil.setViewBackSwipeEnabled(true);
      },
    });
  }

  _updatePercentage(percentage, isManualAction) {
    this.percentage = percentage;
    let newState = percentage * RANGE + LOWER_BOUND;

    if (this.state.dimmingSyncedToCrownstone === false) {
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

    if (isManualAction) {
      this.manualSwitchTimeoutActive = true;
      this.lastRecordedValue = null;
      clearTimeout(this.manualSwitchTimeout);
      clearTimeout(this.lastRecordedValueTimeout);

      // clear the update freeze after manual timeout
      this.manualSwitchTimeout = setTimeout(() => {
        this.manualSwitchTimeoutActive = false;
        // in case we heard a different state after broadcasting our own, we might want to conclude the state was not set.
        if (this.lastRecordedValue !== null && this.percentage !== this.lastRecordedValue) {
          this.lastRecordedValueTimeout = setTimeout(() => {
            if (this.lastRecordedValue !== null && this.percentage !== this.lastRecordedValue) {
              this._updatePercentage(this.lastRecordedValue, false);
            }
          }, 1500);
        }
      }, 1500);
    }
  }

  componentWillUnmount(): void {
    clearTimeout(this.indicatorTimeout);
    clearTimeout(this.manualSwitchTimeout);
    clearTimeout(this.lastRecordedValueTimeout);
    this.unsubscribeStoreEvents();
  }

  _getDimmerStatus() {
    if (this.state.dimmingSyncedToCrownstone === false) {
      return (
        <View style={{flexDirection:"row"}}>
          <ActivityIndicator size={"small"} style={{height:25, paddingRight:3}} />
          <ResponsiveText adjustsFontSizeToFit={true} numberOfLines={1} style={{fontSize: 13, lineHeight: 25, color: colors.black.rgba(0.3), textAlign:'center'}}>Get close to enable dimming!</ResponsiveText>
        </View>
      );
    }
    else if (this.state.dimmerReady === false) {
      return (
        <View style={{flexDirection:"row"}}>
          <ActivityIndicator size={"small"} style={{height:25, paddingRight:3}} />
          <Text style={{fontSize: 13, lineHeight: 25, color: colors.black.rgba(0.3), textAlign:'center'}}>The dimmer is starting up...</Text>
        </View>
      );
    }
  }

  _getIndicator() {
    if (this.state.dimmingSyncedToCrownstone) {
      return (
        <View style={{marginBottom: DIMMING_INDICATOR_SPACING, height: DIMMING_INDICATOR_SIZE}}>
          <Indicator x={this.x} visible={this.state.showIndicator} />
        </View>
      );
    }
    else {
      return (
        <View style={{marginBottom: DIMMING_INDICATOR_SPACING-15, height: DIMMING_INDICATOR_SIZE+15}}>
          <Explanation visible={this.state.showIndicator} />
        </View>
      );

    }
  }

  render() {
    let sliderBarHeight = 5/7*SLIDER_BUBBLE_SIZE;

    return (
      <View style={{width:screenWidth, height: SLIDER_BUBBLE_SIZE + DIMMING_INDICATOR_SIZE + DIMMING_INDICATOR_SPACING}}>
        { this._getIndicator() }
        <View {...this._panResponder.panHandlers} style={{width:screenWidth, height: SLIDER_BUBBLE_SIZE, alignItems:'center', justifyContent:'center'}}>
        <View style={{
          height:sliderBarHeight + 6,
          width: SLIDER_WIDTH + 6,
          backgroundColor: 'transparent',
          borderColor:colors.white.rgba(0.5),
          borderWidth:1,
          borderRadius: 0.5*sliderBarHeight + 3, alignItems:'center', justifyContent:'center'}}>
          <View style={{
            height:sliderBarHeight,
            width: SLIDER_WIDTH,
            backgroundColor: colors.white.rgba(0.8),
            borderRadius: 0.5*sliderBarHeight, alignItems:'center', justifyContent:'center'}}>
            { this._getDimmerStatus() }
          </View>
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
          style={{ width: SLIDER_BUBBLE_SIZE-5, height: SLIDER_BUBBLE_SIZE-5, backgroundColor: colors.white.hex, borderRadius: 33, ...styles.centered }}>
          <View style={{
            width: SLIDER_BUBBLE_SIZE-10,
            height: SLIDER_BUBBLE_SIZE-10,
            backgroundColor: colors.csBlueDark.blend(colors.green, percentage).hex,
            borderRadius: 0.5*(SLIDER_BUBBLE_SIZE-10), ...styles.centered
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
          left: this.props.x - 0.65 * DIMMING_INDICATOR_SIZE,
          height: DIMMING_INDICATOR_SIZE,
          width: DIMMING_INDICATOR_SIZE * 1.3,
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
          height: DIMMING_INDICATOR_SIZE + 15,
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
