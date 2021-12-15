import {Platform, Text, TextStyle, TouchableOpacity, View, ViewStyle} from "react-native";
import {ScaledImage} from "./ScaledImage";
import {Icon} from "./Icon";
import {colors, screenWidth} from "../styles";
import {FadeIn} from "./animated/FadeInView";
import React, {useRef, useState} from "react";
import {TextEditInput} from "./editComponents/TextEditInput";
import ResponsiveText from "./ResponsiveText";
import {Util} from "../../util/Util";


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
  borderColor: colors.blue.hex,
  borderBottomWidth: 6,
  borderRightWidth:  6,
  borderTopWidth:    0,
  borderLeftWidth:   0,
};

let selectedStyle : ViewStyle = {
  borderColor: colors.blue.hex,
  borderBottomWidth: 5,
  borderRightWidth:  5,
  borderTopWidth:    0,
  borderLeftWidth:   0,
};

let dangerStyle : ViewStyle = {
  borderColor: colors.red.hex,
  borderBottomWidth: 5,
  borderRightWidth:  5,
  borderTopWidth:    0,
  borderLeftWidth:   0,
};

let textStyle : TextStyle = {
  paddingRight: 25,
  fontSize: Util.narrowScreen() ? 15 : 16,
  fontWeight: "bold",
  color: colors.csBlue.hex
};


let subTextStyle : TextStyle = {
  fontSize: Util.narrowScreen() ? 12 : 13,
  fontWeight: "300",
  fontStyle:'italic',
  color: colors.csBlue.hex
};

export function TimeButtonWithImage(props) {
  return (
    <FadeIn index={props.index || 0}>
      <TouchableOpacity style={props.basic ? buttonBasicStyle : buttonStyle} onPress={() => { props.callback(); }}>
        <ScaledImage source={props.image} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
        <Icon name={"md-arrow-dropright"} color={colors.csBlue.hex} size={15} style={{padding:10}} />
        <ResponsiveText style={{...textStyle, width:0.85*screenWidth - 135, paddingRight:0}} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5}>{props.label}</ResponsiveText>
      </TouchableOpacity>
    </FadeIn>
  );
}


export function LargeTextButtonWithLargeImage(props) {
  let height = 0.23*screenWidth;
  return (
    <FadeIn index={props.index || 0}>
      <TouchableOpacity testID={props.testID} style={[buttonStyle, {
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
        <View style={{width: 0.22*screenWidth, height: height, justifyContent:'center', alignItems:'center'}}>
          <ScaledImage
            source={props.image.source}
            sourceWidth={props.image.sourceWidth || 600}
            sourceHeight={props.image.sourceHeight || 450}
            targetWidth={props.image.width || 0.25*screenWidth}
            targetHeight={props.image.height || 0.25*screenWidth}
            tintColor={props.image.tintColor}
          />
        </View>
        <View style={{marginLeft:10, width: screenWidth*0.8-80}}>
          <Text style={[textStyle,{color: props.textColor, paddingBottom: 5}]}>{props.label}</Text>
          <Text style={[subTextStyle,{color: props.textColor}]}>{props.subLabel}</Text>
        </View>
        <Icon name={"md-arrow-dropright"} color={colors.csBlue.hex} size={15} style={{padding:10}} />
      </TouchableOpacity>
    </FadeIn>
  );
}


export function TextButtonWithLargeImage(props) {
  return (
    <FadeIn index={props.index || 0}>
      <TouchableOpacity testID={props.testID} style={[buttonStyle, {
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
        <ScaledImage
          source={props.image.source}
          sourceWidth={props.image.sourceWidth || 600}
          sourceHeight={props.image.sourceHeight || 450}
          targetWidth={props.image.width || 0.28*screenWidth}
          tintColor={props.image.tintColor}
        />
        <Text style={[textStyle,{color: props.textColor}]}>{props.label}</Text>
      </TouchableOpacity>
    </FadeIn>
  );
}

export function TextButton(props) {
  return (
    <TouchableOpacity
      testID={props.testID}
      style={[
        props.basic ? buttonBasicStyle : buttonStyle,
        {backgroundColor: props.backgroundColor},
        props.selected ? selectedStyle : {},
        props.danger ? dangerStyle : {},
        props.rounded ? {borderBottomLeftRadius: 10} : {},
        props.borderColor ? {borderColor: props.borderColor} : {},
      ]} onPress={() => { props.callback(); }}>
      { props.textAlign === "right" ? <View style={{flex:1}} /> : undefined }
      <Icon name={"md-arrow-dropright"} color={props.iconColor || props.textColor || colors.csBlue.hex} size={15} style={{padding:10}} />
      <Text style={[textStyle, {color: props.danger ? colors.red.hex : props.textColor}]}>{props.label}</Text>
    </TouchableOpacity>
  );
}
function TextButtonWithIcon(props) {
  return (
    <TouchableOpacity testID={props.testID} style={[buttonStyle, {
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

export function TextButtonDark({label, callback, testID="", basic=false, selected=false}) {
  return TextButton({label, callback, selected, basic, backgroundColor: colors.csBlue.rgba(0.2), textColor: colors.csBlue.hex, testID});
}

export function TextButtonSemitranslucentDark({label, callback, testID="", rounded=false,selected=false}) {
  return (
    TextButton({label, callback, selected, backgroundColor: colors.white.blend(colors.csBlue,0.25).rgba(0.6), textColor: colors.csBlue.hex, rounded, testID})
  )
}

export function TextButtonLightOnDark({label, callback, testID="", selected=false}) {
  return TextButton({label, callback, selected, backgroundColor: colors.white.rgba(0.3), textColor: colors.white.hex, testID})
}

export function TextButtonLight({label, callback, testID="", selected=false, textAlign="left", danger=false}) {
  return TextButton({label, callback, selected, backgroundColor: colors.white.rgba(1), textColor: colors.csBlue.hex, textAlign, danger, testID})
}

export function TextButtonLightWithIcon({label, icon, callback, selected=false, textAlign="left"}) {
  return TextButtonWithIcon({label, callback, icon, selected, backgroundColor: colors.white.rgba(1), textColor: colors.csBlue.hex, textAlign})
}
export function ThemedTextButtonWithIcon({label, icon, theme, callback, selected=false, textAlign="left", testID=''}) {
  if (theme === "create") {
    return TextButtonWithIcon({
      label,
      callback,
      icon,
      selected,
      backgroundColor: colors.blue.rgba(0.8),
      textColor: colors.white.hex,
      fontStyle:'italic',
      textAlign,
      testID
    })
  }
  else {
    return TextButtonWithIcon({label, callback, icon, selected, backgroundColor: colors.white.rgba(0.9), textColor: colors.csBlue.hex, textAlign, testID})
  }
}

export function InterviewPasswordInput(props: {autofocus?, placeholder, value, callback, onBlur?, focussed?, keyboardType?, testID?, autoCapitalize?}) {
  const inputElement = useRef(null)
  let [passwordSecureDisplay, setPasswordSecureDisplay] = useState(true);
  if (props.focussed === true) {
    inputElement.current.focus()
  }
  return (
    <View style={{...buttonStyle, borderRightWidth:0, borderColor: colors.blue.hex, backgroundColor: colors.white.rgba(1)}}>
      <TextEditInput
        autoCompleteType={'password'}
        autoCapitalize={"none"}
        testID={props.testID}
        secureTextEntry={Platform.OS === 'android' ? true : passwordSecureDisplay  }
        visiblePassword={Platform.OS === 'android' ? !passwordSecureDisplay : false }
        ref={inputElement}
        focussed={props.focussed}
        autoFocus={props.autofocus === undefined ? false : props.autofocus}
        style={{width: 0.8*screenWidth, padding:10}}
        placeholder={props.placeholder}
        placeholderTextColor='#888'
        autoCorrect={false}
        keyboardType={props.keyboardType || "default"}
        value={props.value}
        callback={(newValue) => { props.callback(newValue) }}
        endCallback={() => { if (props.onBlur) { props.onBlur() }}}
      />
      <TouchableOpacity
        style={{position:'absolute', top:0, right: 0, height:60, width: 40, alignItems:'center', justifyContent: 'center'}}
        onPress={() => { setPasswordSecureDisplay(!passwordSecureDisplay); }}
        testID={props.testID + "_togglePassword"}
      >
        <Icon name={'md-eye'} color={Platform.OS === 'ios' ? (passwordSecureDisplay ? colors.lightGray2.hex : colors.darkGray2.hex) : colors.lightGray2.hex} size={20} />
      </TouchableOpacity>
    </View>
  )
}


export function InterviewTextInput(props: {autofocus?, placeholder, value, callback, onBlur?, focussed?, keyboardType?, autoCapitalize?, testID?, autoCompleteType?}) {
  const inputElement = useRef(null)
  if (props.focussed === true) {
    inputElement.current.focus()
  }
  return (
    <View style={{...buttonStyle, borderRightWidth:0, borderColor: colors.blue.hex, backgroundColor: colors.white.rgba(1)}}>
      <TextEditInput
        autoCompleteType={props.autoCompleteType}
        autoCapitalize={props.autoCapitalize}
        ref={inputElement}
        focussed={props.focussed}
        autoFocus={props.autofocus === undefined ? false : props.autofocus}
        style={{width: 0.8*screenWidth, padding:10}}
        placeholder={props.placeholder}
        placeholderTextColor='#888'
        autoCorrect={false}
        keyboardType={props.keyboardType || "default"}
        value={props.value}
        callback={(newValue) => { props.callback(newValue); }}
        endCallback={() => { if (props.onBlur) { props.onBlur() }}}
        testID={props.testID}
      />
    </View>
  )
}

