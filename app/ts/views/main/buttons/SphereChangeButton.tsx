
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereChangeButton", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  View
} from 'react-native';
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { SphereOverviewButton } from "./SphereOverviewButton";


export class SphereChangeButton extends Component<any, any> {
  render() {
    return (
      <SphereOverviewButton
        icon={'c1-house'}
        iconScale={1.1}
        callback={() => { this.props.onPress(); }}
        testID={"SphereChangeButton"}
        visible={this.props.visible}
        position={'top-left'}
      />
    );
  }
}
