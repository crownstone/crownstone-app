import { colors, screenWidth, statusBarHeight, tabBarHeight, topBarHeight } from "../styles";
import { View, ViewStyle } from "react-native";
import {BlurView} from "@react-native-community/blur";
import * as React from "react";
import {NotificationLine} from "./NotificationLine";
import { AnimatedCircle } from "./animated/AnimatedCircle";
import { useEffect, useState } from "react";
import { SPHERE_OVERVIEW_BUTTON_ICON_SIZE, SPHERE_OVERVIEW_BUTTON_SIZE } from "../main/buttons/SphereOverviewButton";


export function NavBarBlur(props) {
  let backgroundColor = 'transparent';
  if (props.xlight) {
    backgroundColor = colors.white.rgba(0.4);
  }
  else if (props.xxlight) {
    backgroundColor = colors.white.rgba(0.6);
  }

  return (
    <BlurView blurType={'light'} blurAmount={4} style={{
      position:'absolute',
      bottom:0,
      height:tabBarHeight,
      width:screenWidth,
      backgroundColor
    }}>
      { props.line && <View style={{height:1, width: screenWidth, backgroundColor: colors.blue.rgba(0.45)}} /> }
    </BlurView>
  );
}

// export function TopBarBlur(props) {
//   let backgroundColor = 'transparent';
//   if (props.xlight) {
//     backgroundColor = colors.white.rgba(0.4);
//   }
//   else if (props.xxlight) {
//     backgroundColor = colors.white.rgba(0.6);
//   }
//
//   let style : ViewStyle = {
//     position:'absolute',
//     top:0, height: topBarHeight, width:screenWidth,
//     paddingBottom: 8,
//     backgroundColor
//   };
//
//   if (props.disabledBlur) {
//     return (
//       <View style={style}>
//         <View style={{flex:1}} />
//         { props.children }
//       </View>
//     )
//   }
//
//   return (
//     <BlurView blurType={'light'} blurAmount={4} style={style}>
//       <View style={{flex:1}} />
//       { props.children }
//     </BlurView>
//   );
// }





export function TopBarBlur(props: {xlight?: boolean, xxlight?: boolean, disabledBlur?: boolean, children?: any, showNotifications?: boolean, blink? : UIBlinkSettings}) {
  let backgroundColor = 'transparent';
  if (props.xlight) {
    backgroundColor = colors.white.rgba(0.4);
  }
  else if (props.xxlight) {
    backgroundColor = colors.white.rgba(0.6);
  }

  let style : ViewStyle = {
    height: topBarHeight, width:screenWidth,
    paddingBottom: 8,
    backgroundColor
  };

  if (props.disabledBlur) {
    return (
      <View style={{ position:'absolute', top:0 }}>
        <View style={style}>
        <View style={{flex:1}} />
        { props.children }
        </View>
        <NotificationLine showNotifications={props.showNotifications}/>
      </View>
    )
  }

  return (
    <View style={{ position:'absolute', top:0 }}>
      <BlurView blurType={'light'} blurAmount={4} style={style} />

      <View style={{position:'absolute', top:-5, left: -40}}><Blinky /></View>

      <View style={{ position:'absolute', top:statusBarHeight, width: screenWidth }}>
      <View style={{flex:1}} />
        { props.children }
      </View>
      <NotificationLine showNotifications={props.showNotifications}/>
    </View>
  );
}


class Blinky extends React.Component<any, any> {


  animationInterval = null;
  animationTimeout  = null;
  animationTimeout2  = null;

  sizes = [
    0,0,0
  ]

  colors = [
    colors.green.rgba(0.6),
    colors.white.rgba(0.3),
  ]

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.animate();
  }

  componentWillUnmount() {
    this.stopAnimation();
  }

  animate() {
    clearInterval(this.animationInterval);
    clearTimeout(this.animationTimeout);
    clearTimeout(this.animationTimeout2);

    let pulse = () => {
      this.sizes[0] = 140;
      this.sizes[1] = 90;

      this.colors[0] = colors.green.rgba(0);
      this.colors[1] = colors.white.rgba(0);
      this.forceUpdate()
      this.animationTimeout = setTimeout(() => {
        this.sizes[0] = 0;
        this.sizes[1] = 0;
        this.forceUpdate()
        this.animationTimeout2 = setTimeout(() => {
          this.colors[0] = colors.green.rgba(0.6);
          this.colors[1] = colors.white.rgba(0.5);
          this.forceUpdate()
        }, 400);

      },800)
    }
    this.animationInterval = setInterval(pulse,1600);
    pulse();
  }

  stopAnimation() {
    clearInterval(this.animationInterval);
    clearTimeout(this.animationTimeout);
    clearTimeout(this.animationTimeout2);
    this.forceUpdate();
  }

  render() {
    return (
      <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedCircle size={this.sizes[0]} color={this.colors[0]}>
          <AnimatedCircle size={this.sizes[1]} color={this.colors[1]} delay={80}>
          </AnimatedCircle>
        </AnimatedCircle>
      </View>
    );
  }
}

