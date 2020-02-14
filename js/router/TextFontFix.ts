import { Platform, Text } from "react-native";
import React from "react";

// taken from https://github.com/facebook/react-native/issues/15114

if (Platform.OS === 'android') {
  // @ts-ignore
  const oldRender = Text.render;
  // @ts-ignore
  Text.render = function(...args) {
    const origin = oldRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [{ fontFamily: 'Roboto' }, origin.props.style]
    });
  };
}