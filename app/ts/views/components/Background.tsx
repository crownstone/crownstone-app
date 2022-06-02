
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
  updateScreenHeight,
  background
} from "../styles";
import { BackgroundImage  } from "./BackgroundImage";
import { CustomKeyboardAvoidingView } from "./CustomKeyboardAvoidingView";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {getHeight} from "./animated/AnimatedBackground";
import {StatusBarWatcher} from "../../backgroundProcesses/StatusBarWatcher";
import {NavBarBlur, TopBarBlur} from "./NavBarBlur";


export class BaseBackground extends Component<BackgroundProps, any> {

  render() {
    let [backgroundHeight, hasTopBar, hasTabBar] = getHeight(this.props);
    let overrideStyle = this.props.style || {};

    if (this.props.lightStatusbar) {
      StatusBarWatcher.setLightStatusBar();
    }
    else {
      StatusBarWatcher.setDarkStatusBar();
    }

    return (
      <SafeAreaProvider style={{flex:1, backgroundColor: colors.csBlueDarker.hex}} onLayout={(event) => {
        let {x, y, width, height} = event.nativeEvent.layout;
        updateScreenHeight(height, hasTopBar, hasTabBar);
      }} testID={this.props.testID}>
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


export function Background(props: BackgroundProps) {
  return (
    <BaseBackground
      {...{ fullScreen:true, image: background.main, ...props}}
    >
      {props.children}
      <TopBarBlur />
      { props.hasNavBar && <NavBarBlur /> }
    </BaseBackground>
  );
}

export function BackgroundCustomTopBar(props: BackgroundProps) {
  return (
    <BaseBackground
      {...{ fullScreen:true, image: background.main, ...props}}
    >
      {props.children}
      { props.hasNavBar && <NavBarBlur /> }
    </BaseBackground>
  );
}

export function BackgroundCustomTopBarNavbar(props: BackgroundProps) {
  return (
    <BackgroundCustomTopBar
      {...{ fullScreen:true, image: background.main, hasNavBar:true, ...props}}
    >
      {props.children}
    </BackgroundCustomTopBar>
  );
}
