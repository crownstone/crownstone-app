import { View, TouchableOpacity, Text, Image } from "react-native";
import { Icon } from "../components/Icon";
import { colors, screenWidth } from "../styles";
import React from "react";

export function DeviceMenuIcon(props) {
  let size = screenWidth/6;
  let borderWidth = size*0.05;
  let innerSize = size-2*borderWidth;

  return (
    <TouchableOpacity onPress={() => { if (props.callback) { props.callback() }}} style={{alignItems:'center', justifyContent:'center', ...props.style}}>
      <View style={{width:size, height:size, borderRadius:0.5*size, borderWidth: borderWidth, borderColor: colors.csBlueDark.rgba(0.8)}}>
        <View style={{
          width:innerSize,
          height:innerSize,
          borderRadius:0.5*innerSize,
          borderWidth: 2,
          borderColor: colors.white.hex,
          backgroundColor: props.backgroundColor || "transparent",
          alignItems:'center',
          justifyContent:'center'
        }}>
          {
            props.image ?
              <Image source={props.image} style={{width:innerSize*0.55, height:innerSize*0.55}} /> :
              <Icon name={props.icon} color={props.iconColor || colors.white.hex} size={innerSize*0.65} />
          }
        </View>
      </View>
      {props.label ? <Text style={{fontSize: 12, color:colors.csBlueDarker.rgba(1), textAlign:'center', paddingTop: 5, paddingBottom:5, ...props.labelStyle}} >{props.label}</Text> : undefined }
    </TouchableOpacity>
  )
}

export function DeviceMenuSingleIcon(props) {
  let size = screenWidth/6;

  return (
    <TouchableOpacity onPress={() => { if (props.callback) { props.callback() }}} style={{alignItems:'center', justifyContent:'center'}}>
      {props.label ? <Text style={{fontSize: 12, color:colors.csBlueDarker.rgba(1), textAlign:'center', paddingTop: 5, paddingBottom:5}} >{props.label}</Text> : undefined }
      <View style={{width:0.5*size,height:size, justifyContent:'center', alignItems:'center'}}>
        <Icon name={props.icon} size={33} color={colors.csBlueDark.hex} />
      </View>
    </TouchableOpacity>
  )
}
