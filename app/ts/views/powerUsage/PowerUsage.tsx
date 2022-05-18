import * as React from 'react';
import {Component} from "react";
import {colors} from "../styles";
import {View} from "react-native";

export class PowerUsage extends Component<any, any> {

  render() {
    return <View style={{flex:1, backgroundColor: colors.blue.rgba(0.2)}} />;
  }
}