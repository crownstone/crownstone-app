
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
import { NavigationUtil } from "../../../util/NavigationUtil";
import { DataUtil, enoughCrownstonesForIndoorLocalization, requireMoreFingerprints } from "../../../util/DataUtil";

export class LocalizationButton extends Component<any, any> {

  render() {
    let inSphere = DataUtil.inSphere(this.props.sphereId);
    let enoughCrownstones = enoughCrownstonesForIndoorLocalization(this.props.sphereId);
    let trainingRequired  = requireMoreFingerprints(this.props.sphereId);

    let highlight = inSphere && enoughCrownstones && trainingRequired;

    return (
      <SphereOverviewButton
        testID="LocalizationButton"
        visible={this.props.visible}
        icon={"c1-locationPin1"}
        position={"top-right"}
        highlight={highlight}
        callback={() => {
          NavigationUtil.launchModal( "LocalizationMenu",{sphereId: this.props.sphereId});
        }}
      />
    );
  }
}
