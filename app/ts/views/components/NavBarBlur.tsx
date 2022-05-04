import {colors, screenWidth, tabBarHeight} from "../styles";
import {View} from "react-native";
import {BlurView} from "@react-native-community/blur";
import * as React from "react";


export function NavBarBlur(props) {
  return (
    <BlurView
      blurType={'light'}
      blurAmount={4}
      style={{position:'absolute', bottom:0, height:tabBarHeight, width:screenWidth, backgroundColor: props.xlight ? colors.white.rgba(0.5) : 'transparent'}}
    >
      { props.line && <View style={{height:1, width: screenWidth, backgroundColor: colors.blue.rgba(0.45)}} /> }
    </BlurView>
  );
}