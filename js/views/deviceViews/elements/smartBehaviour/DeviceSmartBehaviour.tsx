
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { colors, deviceStyles, OrangeLine, screenHeight, screenWidth } from "../../../styles";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { TopbarBackButton, TopbarButton } from "../../../components/topbar/TopbarButton";
import { DeviceSmartBehaviour_TypeSelectorBody } from "./DeviceSmartBehaviour_TypeSelector";
import { core } from "../../../../core";
import { Background } from "../../../components/Background";
import { DeviceSmartBehaviour_RuleOverview } from "./DeviceSmartBehaviour_RuleOverview";

export class DeviceSmartBehaviour extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "A Crownstone",
      headerLeft:  <TopbarBackButton text={lang("Back")} onPress={() => { navigation.goBack(null) }} />
    }
  };


  render() {
    let rulesCreated = false;
    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
        <OrangeLine/>
        {
          rulesCreated ?
          <DeviceSmartBehaviour_RuleOverview     {...this.props} /> :
          <DeviceSmartBehaviour_TypeSelectorBody {...this.props} />
        }
      </Background>
    )
  }
}
