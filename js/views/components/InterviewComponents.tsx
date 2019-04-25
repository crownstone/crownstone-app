import { Text, TextStyle, TouchableOpacity, ViewStyle,View } from "react-native";
import { ScaledImage } from "./ScaledImage";
import { Icon } from "./Icon";
import { colors, screenWidth } from "../styles";
import { useState } from "react";
import { FadeIn, FadeInView } from "./animated/FadeInView";
import React from "react";


let buttonStyle : ViewStyle = {
  flexDirection:'row',
  margin:10,
  marginTop:5,
  marginBottom:5,
  paddingTop:10,
  paddingBottom:10,
  paddingLeft:15,
  paddingRight:25,
  alignItems:'center',
  backgroundColor: colors.csBlue.rgba(0.2),
  borderRadius:10
};

let textStyle : TextStyle = {
  fontSize: 16,
  fontWeight: "bold",
  color: colors.csBlue.hex
};


export function TimeButtonWithImage(props) {
  return (
    <FadeIn index={props.index || 0}>
      <TouchableOpacity style={buttonStyle} onPress={() => { props.callback(); }}>
        <ScaledImage source={props.image} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
        <Icon name={"md-arrow-dropright"} color={colors.csBlue.hex} size={15} style={{padding:10}} />
        <Text style={textStyle} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5}>{props.label}</Text>
      </TouchableOpacity>
    </FadeIn>
  );
}


function TextButton(props) {
  return (
    <TouchableOpacity style={[buttonStyle, {backgroundColor: props.backgroundColor}]} onPress={() => { props.callback(); }}>
      <Icon name={"md-arrow-dropright"} color={props.iconColor || props.textColor || colors.csBlue.hex} size={15} style={{padding:10}} />
      <Text style={[textStyle, {color: props.textColor}]}>{props.label}</Text>
    </TouchableOpacity>
  );
}

export function TextButtonDark({label, callback}) {
  return TextButton({label, callback, backgroundColor: colors.csBlue.rgba(0.2), textColor: colors.csBlue.hex});
}

export function TextButtonSemitranslucentDark({label, callback}) {
  return (
    <View style={{backgroundColor: colors.white.rgba(0.6) }}>{
      TextButton({label, callback, backgroundColor: colors.csBlue.rgba(0.2), textColor: colors.csBlue.hex})
    }</View>
  )
}

export function TextButtonLight({label, callback}) {
  return TextButton({label, callback, backgroundColor: colors.white.rgba(0.3), textColor: colors.white.hex})
}

