import * as React from 'react';
import {
  Text,
  TouchableOpacity,
} from "react-native";
import {colors, screenWidth} from "../../styles";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { core } from "../../../core";

export function AutoArrangeButton(props) {
  return (
    <HiddenFadeInView visible={props.arrangingRooms} style={{position:'absolute', bottom:10, width: screenWidth, left:0, height: 54, alignItems:'center', justifyContent:'center'}}>
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
        <Text style={{color: colors.csBlue.hex, fontWeight:'bold', paddingLeft:15, paddingRight:15, fontSize:16, textAlign:'center'}}>{"Auto arrange!"}</Text>
      </TouchableOpacity>
    </HiddenFadeInView>
  );
}