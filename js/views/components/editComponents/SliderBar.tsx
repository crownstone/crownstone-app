
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SliderBar", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component, useState } from "react";
import {
  View, Text, Animated, TouchableOpacity
} from "react-native";
import { colors, LARGE_ROW_SIZE, MID_ROW_SIZE, NORMAL_ROW_SIZE, screenWidth, styles } from "../../styles";
import Slider from "@react-native-community/slider";
import { SlideFadeInView } from "../animated/SlideFadeInView";
import { FadeInView } from "../animated/FadeInView";
import { Icon } from "../Icon";


const EXPLANATION_HEIGHT = 40;
const SLIDER_HEIGHT = 60;

export function SliderBar(props) {
  let [sliderHidden, setSliderHidden] = useState(props.sliderHidden === true)

  let iconWidth   = 0;
  let iconPadding = 0;
  let navBarHeight = props.barHeight || NORMAL_ROW_SIZE;
  if (props.largeIcon || props.size === "large") {
    navBarHeight = LARGE_ROW_SIZE;
    iconWidth   = 80;
    iconPadding = 20;
  }
  else if (props.mediumIcon || props.size === "medium") {
    navBarHeight = MID_ROW_SIZE;
    iconWidth   = 0.15 * screenWidth;
    iconPadding = 15;
  }
  else if (props.icon) {
    navBarHeight = NORMAL_ROW_SIZE;
    iconWidth   = 0.12 * screenWidth;
    iconPadding = 15;
  }

  let content = (
    <View style={{width:screenWidth, minHeight: navBarHeight, backgroundColor: colors.white.hex, padding:15}}>
      <View style={{width:screenWidth-30, height: navBarHeight-30, flexDirection:'row',  alignItems: 'center'}}>
        { props.largeIcon  !== undefined ? <View style={[styles.centered, {width: iconWidth, paddingRight: iconPadding}]}>{props.largeIcon}</View> : undefined}
        { props.mediumIcon !== undefined ? <View style={[styles.centered, {width: iconWidth, paddingRight: iconPadding}]}>{props.mediumIcon}</View> : undefined}
        { props.icon       !== undefined ? <View style={[styles.centered, {width: iconWidth, paddingRight: iconPadding}]}>{props.icon}</View> : undefined}
        { props.label ?
          <View style={{height: navBarHeight-30, justifyContent:'center'}}>
            <Text numberOfLines={1} style={[{fontSize: 16}, props.labelStyle, props.style]}>{props.label}</Text>
          </View> : undefined}
        <View style={{flex:1}} />
        { props.sliderHidden !== undefined ?
          (sliderHidden ? <Icon name="ios-arrow-forward" size={18} color={'#888'} /> : <Icon name="ios-arrow-down" size={18} color={'#888'} />) : undefined }
      </View>
      <SlideFadeInView visible={sliderHidden === false} height={SLIDER_HEIGHT + (props.explanation ? props.explanationHeight || EXPLANATION_HEIGHT : 0)}>
        <View style={{
          flex: 1,
          marginLeft: 10 + 0.25*(iconWidth + iconPadding),
          marginRight: 10,
          alignItems: 'stretch',
          justifyContent: 'center',
          height: SLIDER_HEIGHT,
        }} >
          <Slider
            style={{ width: screenWidth - (30 + 20 + 0.25*(iconPadding + iconWidth)), height: SLIDER_HEIGHT }}
            minimumValue={props.min}
            maximumValue={props.max}
            step={props.step || 1}
            value={props.value}
            minimumTrackTintColor={colors.gray.hex}
            maximumTrackTintColor={colors.gray.hex}
            onValueChange={props.callback}
          />
        </View>
        { props.explanation &&
        <View style={{
          width: screenWidth,
          height: props.explanationHeight || EXPLANATION_HEIGHT,
          justifyContent: 'flex-end'
        }}>
          <Text style={[{
            width: screenWidth - 30,
            textAlign: 'center',
            color: colors.black.rgba(0.3),
            fontSize: 12
          }, props.explanationStyle, props.style]}>{props.explanation}</Text>
        </View>
        }
      </SlideFadeInView>
    </View>
  );

  if (props.sliderHidden !== undefined) {
    return <TouchableOpacity onPress={() => { setSliderHidden(!sliderHidden) }}>{content}</TouchableOpacity>
  }
  return content;


}
