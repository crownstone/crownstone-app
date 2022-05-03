
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SmartHomeStateButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ActivityIndicator, Alert,
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
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { SphereOverviewButton } from "./SphereOverviewButton";

export class SmartHomeStateButton extends Component<any, any> {

  render() {
    return (
      <SphereOverviewButton
        testID="SmartHomeStateButton"
        visible={this.props.visible}
        innerColor={colors.csOrange.hex}
        borderColor={colors.csOrange.rgba(0.5)}
        icon={"c1-brain"}
        position={"top-right-2"}
        callback={() => {
          Alert.alert(
            "Behaviour is disabled.",
            "Do you want to re-enable it?",
            [{text:"No", style:"cancel"}, {text:"Yes", onPress:() => {
                NavigationUtil.launchModal( "LocalizationMenu",{sphereId: this.props.sphereId});
            }}]
          );
        }}
      />
    );
  }

}
