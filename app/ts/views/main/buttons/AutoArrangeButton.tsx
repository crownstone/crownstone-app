
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AutoArrangeButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text,
  TouchableOpacity,
} from "react-native";
import {colors, screenWidth} from "../../styles";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { core } from "../../../Core";
import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export function AutoArrangeButton(props) {
  let tabBarHeight = useBottomTabBarHeight();
  let insets       = useSafeAreaInsets();

  return (
    <HiddenFadeInView visible={props.arrangingRooms} style={{position:'absolute', bottom:tabBarHeight-insets.bottom, width: screenWidth, left:0, height: 54, alignItems:'center', justifyContent:'center'}}>
      <TouchableOpacity
        style={{
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
        }}
        onPress={() => { core.eventBus.emit('physicsRun'+props.viewId, 150)}}>
        <Text style={{color: colors.csBlue.hex, fontWeight:'bold', paddingLeft:15, paddingRight:15, fontSize:16, textAlign:'center'}}>{ lang("Auto_arrange_") }</Text>
      </TouchableOpacity>
    </HiddenFadeInView>
  );
}