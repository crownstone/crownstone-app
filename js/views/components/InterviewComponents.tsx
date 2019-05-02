import { Text, TextStyle, TouchableOpacity, ViewStyle,View } from "react-native";
import { ScaledImage } from "./ScaledImage";
import { Icon } from "./Icon";
import { colors, screenWidth } from "../styles";
import { useState } from "react";
import { FadeIn, FadeInView } from "./animated/FadeInView";
import React from "react";
import { TextEditInput } from "./editComponents/TextEditInput";


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
  borderBottomLeftRadius:  0,
  borderBottomRightRadius: 10,
  borderTopLeftRadius:     10,
  borderTopRightRadius:    0,
  borderColor: colors.green.hex,
  borderBottomWidth: 4,
  borderRightWidth:  4,
  borderTopWidth:    0,
  borderLeftWidth:   0,

};

let buttonBasicStyle : ViewStyle = {
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
  borderBottomLeftRadius:  0,
  borderBottomRightRadius: 10,
  borderTopLeftRadius:     10,
  borderTopRightRadius:    0,

};

let selectedAsymetricalStyle : ViewStyle = {
  borderColor: colors.menuTextSelected.hex,
  borderBottomWidth: 6,
  borderRightWidth:  6,
  borderTopWidth:    0,
  borderLeftWidth:   0,
};

let selectedStyle : ViewStyle = {
  borderColor: colors.menuTextSelected.hex,
  borderBottomWidth: 5,
  borderRightWidth:  5,
  borderTopWidth:    0,
  borderLeftWidth:   0,
};

let textStyle : TextStyle = {
  fontSize: 16,
  fontWeight: "bold",
  color: colors.csBlue.hex
};


export function TimeButtonWithImage(props) {
  return (
    <FadeIn index={props.index || 0}>
      <TouchableOpacity style={props.basic ? buttonBasicStyle : buttonStyle} onPress={() => { props.callback(); }}>
        <ScaledImage source={props.image} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
        <Icon name={"md-arrow-dropright"} color={colors.csBlue.hex} size={15} style={{padding:10}} />
        <Text style={textStyle} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5}>{props.label}</Text>
      </TouchableOpacity>
    </FadeIn>
  );
}

export function TextButtonWithLargeImage(props) {
  return (
    <FadeIn index={props.index || 0}>
      <TouchableOpacity style={[buttonStyle, {
        backgroundColor: colors.white.hex,
        borderBottomLeftRadius:  0,
        borderBottomRightRadius: 20,
        borderTopLeftRadius:     15,
        borderTopRightRadius:    0,
        borderColor: colors.green.hex,
        borderBottomWidth: 3,
        borderRightWidth: 3,
      }, props.selected ? selectedAsymetricalStyle : {}]} onPress={() => { props.callback(); }}>
        { props.textAlign === "right" ? <View style={{flex:1}} /> : undefined }
        <Icon name={"md-arrow-dropright"} color={colors.csBlue.hex} size={15} style={{padding:10}} />
        <ScaledImage source={props.image} sourceWidth={600} sourceHeight={450} targetHeight={90}/>
        <Text style={[textStyle,{color: props.textColor}]}>{props.label}</Text>
      </TouchableOpacity>
    </FadeIn>
  );
}

function TextButton(props) {
  return (
    <TouchableOpacity style={[props.basic ? buttonBasicStyle : buttonStyle, {backgroundColor: props.backgroundColor}, props.selected ? selectedStyle : {}]} onPress={() => { props.callback(); }}>
      { props.textAlign === "right" ? <View style={{flex:1}} /> : undefined }
      <Icon name={"md-arrow-dropright"} color={props.iconColor || props.textColor || colors.csBlue.hex} size={15} style={{padding:10}} />
      <Text style={[textStyle, {color: props.textColor}]}>{props.label}</Text>
    </TouchableOpacity>
  );
}
function TextButtonWithIcon(props) {
  return (
    <TouchableOpacity style={[buttonStyle, {
      backgroundColor: props.backgroundColor,
      borderBottomLeftRadius:  0,
      borderBottomRightRadius: 20,
      borderTopLeftRadius:     15,
      borderTopRightRadius:    0,
    }, props.selected ? selectedStyle : {}]} onPress={() => { props.callback(); }}>
      { props.textAlign === "right" ? <View style={{flex:1}} /> : undefined }
      <Icon name={props.icon} color={props.iconColor || props.textColor || colors.csBlue.hex} size={42} style={{padding:10, paddingRight: 30}} />
      <Text style={[textStyle, {color: props.textColor, fontStyle:props.fontStyle || 'normal'}]}>{props.label}</Text>
    </TouchableOpacity>
  );
}

export function TextButtonDark({label, callback, basic=false, selected=false}) {
  return TextButton({label, callback, selected, basic, backgroundColor: colors.csBlue.rgba(0.2), textColor: colors.csBlue.hex});
}

export function TextButtonSemitranslucentDark({label, callback, selected=false}) {
  return (
    TextButton({label, callback, selected, backgroundColor: colors.white.blend(colors.csBlue,0.25).rgba(0.7), textColor: colors.csBlue.hex})
  )
}

export function TextButtonLightOnDark({label, callback, selected=false}) {
  return TextButton({label, callback, selected, backgroundColor: colors.white.rgba(0.3), textColor: colors.white.hex})
}


export function TextButtonLight({label, callback, selected=false, textAlign="left"}) {
  return TextButton({label, callback, selected, backgroundColor: colors.white.rgba(1), textColor: colors.csBlue.hex, textAlign})
}

export function TextButtonLightWithIcon({label, icon, callback, selected=false, textAlign="left"}) {
  return TextButtonWithIcon({label, callback, icon, selected, backgroundColor: colors.white.rgba(1), textColor: colors.csBlue.hex, textAlign})
}
export function ThemedTextButtonWithIcon({label, icon, theme, callback, selected=false, textAlign="left"}) {
  if (theme === "create") {
    return TextButtonWithIcon({
      label,
      callback,
      icon,
      selected,
      backgroundColor: colors.menuTextSelected.rgba(0.8),
      textColor: colors.white.hex,
      fontStyle:'italic',
      textAlign
    })
  }
  else {
    return TextButtonWithIcon({label, callback, icon, selected, backgroundColor: colors.white.rgba(0.9), textColor: colors.csBlue.hex, textAlign})
  }
}

export function InterviewTextInput(props) {
  return (
    <View style={{...buttonStyle, borderRightWidth:0, borderColor: colors.menuTextSelected.hex, backgroundColor: colors.white.rgba(1)}}>
      <TextEditInput
        focusOnMount={true}
        style={{width: 0.8*screenWidth, padding:10}}
        placeholder={props.placeholder}
        placeholderTextColor='#888'
        autoCorrect={false}
        value={props.value}
        callback={(newValue) => { props.callback(newValue) }}
      />
    </View>
  )
}

