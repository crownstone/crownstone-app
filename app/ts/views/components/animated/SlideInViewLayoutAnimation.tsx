
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SlideInView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component, useEffect } from "react";
import {
  Animated, LayoutAnimation, Platform, UIManager, View, ViewStyle
} from "react-native";


if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function SlideInViewLayoutAnimation(props) {
  useEffect(() => {
    LayoutAnimation.configureNext({...LayoutAnimation.Presets.easeInEaseOut, duration: props.duration ?? 200});
  }, [props.visible])

  let style : ViewStyle = {
    ...props.style,
    overflow: "hidden",
  }

  if (!props.visible) {
    style.height = 0;
  }

  return (
    <View style={style}>{props.children}</View>
  );
}
