
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { TopbarBackButton} from "../../../components/topbar/TopbarButton";
import { DeviceSmartBehaviour_TypeSelectorBody } from "./DeviceSmartBehaviour_TypeSelector";
import { core } from "../../../../core";
import { Background } from "../../../components/Background";
import { DeviceSmartBehaviour_RuleOverview } from "./DeviceSmartBehaviour_RuleOverview";
import { View } from "react-native";

export class DeviceSmartBehaviour extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: lang("A_Crownstone"),
      headerLeft:  <TopbarBackButton text={lang("Back")} onPress={() => { navigation.goBack(null) }} />
    }
  };


  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return <View />;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;
    let rulesCreated = Object.keys(stone.rules).length > 0;

    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
        {
          rulesCreated ?
          <DeviceSmartBehaviour_RuleOverview     {...this.props} /> :
          <DeviceSmartBehaviour_TypeSelectorBody {...this.props} />
        }
      </Background>
    )
  }
}
