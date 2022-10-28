import {BlurView} from "@react-native-community/blur";
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  View
} from "react-native";


export function Blur(props) {
  if (Platform.OS === 'android') {
    return <View {...props} />
  }

  return <BlurView {...props} />;
}