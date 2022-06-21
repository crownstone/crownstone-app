import { Text, TouchableOpacity, ViewStyle } from "react-native";
import * as React from "react";
import { colors } from "../../styles";

const normalStyle   : ViewStyle = { height: 30, justifyContent:'center', flex:1, borderRadius: 5, marginHorizontal: 10 };
const selectedStyle : ViewStyle = { ...normalStyle, backgroundColor: colors.white.hex}

export function TimeButton(props: {selected:boolean, label: string, callback: () => void}) {

  return (
    <TouchableOpacity
      style={ props.selected ? selectedStyle : normalStyle }
      onPress={props.callback}
    >
      <Text style={{fontWeight:'bold', fontSize: 13, textAlign:'center'}}>{props.label}</Text>
    </TouchableOpacity>
  )
}
