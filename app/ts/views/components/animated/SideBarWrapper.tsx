import * as React from 'react'; import { Component } from 'react';
import {
  Animated, Platform, SafeAreaView, StatusBar,
  View, Text
} from "react-native";

import {
  styles,
  screenHeight,
  screenWidth,
  colors,
  updateScreenHeight, availableScreenHeight, availableModalHeight
} from "../../styles";
import {BackgroundImage} from "../BackgroundImage";
import { NotificationLine } from "../NotificationLine";
import { CustomKeyboardAvoidingView } from "../CustomKeyboardAvoidingView";


export class SideBarWrapper extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {fade: new Animated.Value(0)};
  }


  shouldComponentUpdate(nextProps){

    return true
  }

  render() {
    return (
      <View style={{flexGrow:1, backgroundColor: "#f00"}}>
        {/*<Animated.View style={{flex:1}}>*/}

        {/*</Animated.View>*/}
      </View>
    );
  }
}
