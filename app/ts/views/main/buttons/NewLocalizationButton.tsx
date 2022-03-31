
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SmartHomeStateButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ActivityIndicator, Alert, Animated,
  Text,
  TouchableOpacity, View
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
import { SphereOverviewButton } from "./SphereOverviewButton";

export class NewLocalizationButton extends Component<any, any> {

  loadingTimeout = null;
  doubleCheckTimeout = null;
  unsubscribeEventListener = null;

  pulseSize = 50;
  pulseSizeInner = 40;
  pulseSizeInnerIcon = 37;
  backgroundColor = colors.white.rgba(0.3);
  backgroundColorInner = colors.white.rgba(0.3);

  constructor(props) {
    super(props);

    this.state = {
      doubleCheck: false,
      showLoading: false,
    }
  }

  componentDidMount() {
    this.unsubscribeEventListener = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeSphereSmartHomeState && change.changeSphereSmartHomeState.sphereIds[this.props.sphereId]) {
        this.forceUpdate();
      }
    });

    let pulse = () => {
      this.pulseSize = 40;
      this.pulseSizeInner = 50;
      this.backgroundColor = colors.green.rgba(0.15);
      this.backgroundColorInner = colors.green.rgba(0.3);
      this.forceUpdate()
      setTimeout(() => {
        this.backgroundColor = colors.white.rgba(0.15);
        this.backgroundColorInner = colors.white.rgba(0.3);
        this.pulseSize = 60;
        this.pulseSizeInner = 40;
        this.forceUpdate()
      },600)
    }

    // setInterval(() => { pulse(); }, 1500);
    // pulse();
  }

  componentWillUnmount() {
    this._cleanup();
    this.unsubscribeEventListener();
  }

  _cleanup() {
    clearTimeout(this.doubleCheckTimeout);
    clearTimeout(this.loadingTimeout);
  }

  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let activeState = true;
    if (sphere) {
      activeState = sphere.state.smartHomeEnabled === true
    }

    let outerRadius = 0.11 * screenWidth;
    let innerRadius = outerRadius - 10;

    let size = 0.11*screenWidth;
    let iconSize = 0.05*screenWidth;
    let iconColor = colors.csBlueDark.rgba(0.75);

    return (
      <SphereOverviewButton testID="Localizatoin" visible={this.props.visible} icon={"c1-locationPin1"} position={"top-right"} callback={() => {}}/>
    );
  }
}
