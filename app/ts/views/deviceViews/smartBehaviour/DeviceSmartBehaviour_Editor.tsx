
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_Editor", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  ScrollView,
  Text, TouchableOpacity,
  View
} from "react-native";

import {
  availableModalHeight, background,
  deviceStyles,
  screenWidth
} from "../../styles";
import { Background } from "../../components/Background";
import { core } from "../../../Core";
import { BehaviourEditor } from "./supportComponents/BehaviourEditor";
import { TopBarUtil } from "../../../util/TopBarUtil";
import ResponsiveText from "../../components/ResponsiveText";


export class DeviceSmartBehaviour_Editor extends Component<{twilightBehaviour: boolean, data: any, sphereId: string, stoneId: string, behaviourId: any, label:string, selectedDay?: string, isModal?:boolean}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Edit_Behaviour",props.typeLabel), closeModal: props.isModal});
  }

  render() {
    let header = lang("Create_my_Behaviour")
    if (this.props.behaviourId) {
      header = lang("Customize_my_Behaviour_");
    }

    let height = availableModalHeight;
    return (
      <Background image={background.main} hideNotifications={true} hasNavBar={false}>
        <ScrollView style={{width:screenWidth}} contentContainerStyle={{flexGrow:1}}>
          <View style={{ flexGrow: 1, alignItems:'center', paddingVertical:30}}>
            <ResponsiveText style={{...deviceStyles.header, width: 0.7*screenWidth}} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</ResponsiveText>
            <View style={{height: 0.02*height}} />
            <Text style={deviceStyles.specification}>{ lang("Tap_the_underlined_parts_t") }</Text>
            <BehaviourEditor {...this.props} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}
