
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AutoArrangeButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text,
  TouchableOpacity, ViewStyle,
} from "react-native";
import { colors, screenWidth, tabBarHeight } from "../../styles";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { core } from "../../../Core";

const fadeInView: ViewStyle = {
  position:'absolute',
  bottom: tabBarHeight,
  width: screenWidth,
  left:0, height: 54,
  alignItems:'center', justifyContent:'space-evenly',
  flexDirection:'row',
}

const ButtonStyle: ViewStyle = {
  alignItems:'center',
  justifyContent:'center',
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.white.hex,
  shadowColor: colors.black.hex,
  shadowOffset: {width:2,height:2},
  shadowOpacity: 0.15,
  shadowRadius: 3,
  elevation: 1,
}

export function AutoArrangeButton(props) {
  return (
    <HiddenFadeInView visible={props.arrangingRooms} style={fadeInView}>
      <TouchableOpacity
        style={ButtonStyle}
        onPress={() => { core.eventBus.emit('physicsRun'+props.viewId, 150)}} testID={'SphereRoomArranger_autoArrange'}>
        <Text style={{color: colors.csBlue.hex, fontWeight:'bold', paddingLeft:15, paddingRight:15, fontSize:16, textAlign:'center'}}>{ lang("Auto_arrange_") }</Text>
      </TouchableOpacity>
    </HiddenFadeInView>
  );
}
