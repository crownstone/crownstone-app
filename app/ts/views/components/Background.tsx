
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Background", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';
import {
  Platform, StatusBar,
  View
} from "react-native";
// import { SafeAreaView } from 'react-navigation';

import {
  styles,
  colors,
  screenWidth,
  updateScreenHeight
} from "../styles";
import { BackgroundImage  } from "./BackgroundImage";
import { CustomKeyboardAvoidingView } from "./CustomKeyboardAvoidingView";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {getHeight} from "./animated/AnimatedBackground";


export class Background extends Component<BackgroundProps, any> {

  render() {
    let [backgroundHeight, hasTopBar, hasTabBar] = getHeight(this.props);
    let overrideStyle = this.props.style || {};

    return (
      <SafeAreaProvider style={{flex:1, backgroundColor: colors.csBlueDarker.hex}} onLayout={(event) => {
        let {x, y, width, height} = event.nativeEvent.layout;
        updateScreenHeight(height, hasTopBar, hasTabBar);
      }} testID={this.props.testID}>
        <StatusBar barStyle={this.props.lightStatusbar ? 'light-content' : 'dark-content'} />
        <CustomKeyboardAvoidingView style={{...styles.fullscreen, height:backgroundHeight, overflow:"hidden", backgroundColor:"transparent", ...overrideStyle}} behavior={Platform.OS === 'ios' ? 'position' : undefined} enabled={this.props.keyboardAvoid || false}>
          <BackgroundImage height={backgroundHeight} image={this.props.image} />
          <View style={[styles.fullscreen, {height:backgroundHeight}]}>
            <View style={{flex:1}}>
              { this.props.children }
            </View>
          </View>
        </CustomKeyboardAvoidingView>
      </SafeAreaProvider>
    );
  }
}
