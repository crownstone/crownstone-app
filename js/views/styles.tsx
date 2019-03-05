
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("styles", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { Dimensions, PixelRatio, Platform, StyleSheet, View } from 'react-native'
import {hex2rgb, hsv2hex, rgb2hex, rgb2hsv} from '../util/ColorConverters'
const DeviceInfo = require('react-native-device-info');

export const deviceModel = DeviceInfo.getModel();

export const topBarMargin    = Platform.OS === 'android' ? 0   :  (deviceModel === 'iPhone X' ? 0 : 0 ); // Status bar in iOS is 20 high
export const tabBarMargin    = Platform.OS === 'android' ? 0   :  (deviceModel === 'iPhone X' ? 34 : 0 ); // Status bar in iOS is 20 high
export const tabBarHeight    = (Platform.OS === 'android' ? 0  :  (deviceModel === 'iPhone X' ? 49 + 34: 49));
export const statusBarHeight = Platform.OS === 'android' ? 0   :  (deviceModel === 'iPhone X' ? 44 : 20); // Status bar in iOS is 20 high
export const topBarHeight    = Platform.OS === 'android' ? 54  :  (deviceModel === 'iPhone X' ? 44 : 44 ) + statusBarHeight; // Status bar in iOS is 20 high

export const screenWidth = Dimensions.get('window').width;

export let screenHeight = Platform.OS === 'android' ?
  Dimensions.get('window').height - 24 :  // android includes the top bar in the window height but we cant draw there.
  Dimensions.get('window').height;

export const availableScreenHeight = screenHeight - topBarHeight - tabBarHeight;

export const pxRatio = PixelRatio.get();

export const EXTRA_LARGE_ROW_SIZE  = 85;
export const LARGE_ROW_SIZE  = 75;
export const MID_ROW_SIZE    = 62;
export const NORMAL_ROW_SIZE = 50;

export let colors : any = {
  darkBackground: {hex:'#4f6b84'},
  csBlue: {hex:'#003E52'},
  csBlueLight: {hex:'#006f84'},
  csOrange: {hex:'#ff8400'},
  darkCsOrange: {hex:'#d97500'},
  lightCsOrange: {hex:'#ffa94d'},
  menuBackground: {hex:'#00263e'},
  menuBackgroundDarker: {hex:'#001122'},
  menuText: {hex:'#fff'},
  menuTextSelected: {hex:'#2daeff'},
  white: {hex:'#fff'},
  black: {hex:'#000'},
  gray: {hex:'#ccc'},
  notConnected: {hex:'#64897f'},
  darkGray: {hex:'#555'},
  darkGray2: {hex:'#888'},
  lightGray2: {hex:'#dedede'},
  lightGray: {hex:'#eee'},
  purple: {hex:'#8a01ff'},
  darkPurple: {hex:'#5801a9'},
  darkerPurple: {hex:'#2a0051'},
  blue: {hex:'#0075c9'},
  blue2: {hex:'#2698e9'},
  green: {hex:'#a0eb58'},
  lightGreen: {hex:'#caff91'},
  darkGreen: {hex:'#1f4c43'},
  green2: {hex:'#4cd864'},
  orange: {hex:'#ff953a'},
  red: {hex:'#ff3c00'},
  darkRed: {hex:'#cc0900'},
  menuRed: {hex:'#e00'},
  iosBlue: {hex:'#007aff'},
  lightBlue: {hex:'#a9d0f1'},
  blinkColor1: {hex:'#2daeff'},
  blinkColor2: {hex:'#a5dcff'},
};

for (let color in colors) {
  if (colors.hasOwnProperty(color)) {
    populateColorObject(colors[color], color)
  }
}


let allColors = Object.keys(colors)

colors.random = function() {
  return colors[allColors[Math.floor(Math.random()*allColors.length)]]
}

function populateColorObject(clr, color) {
  clr.name = color;
  clr.rgb = hex2rgb(clr.hex);
  clr.hsv = rgb2hsv(clr.rgb.r,clr.rgb.g,clr.rgb.b);
  clr.rgba = (opacity) => { opacity = Math.min(1,opacity); return 'rgba(' + clr.rgb.r + ',' + clr.rgb.g + ',' + clr.rgb.b + ',' + opacity + ')'};
  /**
   * Factor 0 means fully initial color, 1 means fully other color
   * @param otherColor
   * @param factor
   * @returns {{name: string; hex: string; rgb: {r: number; g: number; b: number}; rgba: (opacity) => string}}
   */
  clr.blend = (otherColor, factor) => {
    let red   = Math.floor((1-factor) * clr.rgb.r + factor * otherColor.rgb.r);
    let green = Math.floor((1-factor) * clr.rgb.g + factor * otherColor.rgb.g);
    let blue  = Math.floor((1-factor) * clr.rgb.b + factor * otherColor.rgb.b);
    return populateColorObject({hex:rgb2hex(red, green, blue)},'blend:'+color+"_"+otherColor.name+"_"+factor)
  };
  clr.hsvBlend = (otherColor, factor) => {
    let h = (1-factor) * clr.hsv.h + factor * otherColor.hsv.h;
    let s = (1-factor) * clr.hsv.s + factor * otherColor.hsv.s;
    let v = (1-factor) * clr.hsv.v + factor * otherColor.hsv.v;

    let newColor = hsv2hex(h,s,v);
    return populateColorObject({hex:newColor},'hsv_blend:'+color+"_"+otherColor.name+"_"+factor)
  };

  // clr.hsl = rgb2hsl(clr.rgb.r,clr.rgb.g,clr.rgb.b);
  // clr.hcl = rgb2hcl(clr.rgb.r,clr.rgb.g,clr.rgb.b);

  return clr;
}

export const styles = StyleSheet.create({
  fullscreen:{
    position:'absolute',
    top:0,left:0,
    width:screenWidth,
    height:screenHeight,
  },
  centered: {
    alignItems: 'center',
    justifyContent:'center',
  },
  rowCentered: {
    flexDirection:'row',
    alignItems: 'center',
    justifyContent:'center',
  },
  columnCentered: {
    flexDirection:'column',
    alignItems: 'center',
    justifyContent:'center',
  },
  roomImageContents: {
    padding:10,
    justifyContent:'center',
    backgroundColor: 'transparent'
  },
  roomImageText:{
    fontSize:16,
    fontWeight: 'bold',
    color:'#ffffff',
    padding:8,
  },
  menuItem: {
    fontSize:9,
    color:colors.menuText.hex,
  },
  menuView: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    padding:3,
  },
  listView: {
    flexDirection: 'row',
    backgroundColor: colors.white.hex,
    paddingLeft:15,
    paddingRight:15,
    alignItems: 'center',
  },
  listText:{
    width:(1/3)*screenWidth,
    fontSize: 16,
    backgroundColor: colors.white.hex
  },
  listTextLarge:{
    flex:10,
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: colors.black.rgba(0.25),
  },
  topExplanation: {
    paddingTop:20
  },
  rightNavigationValue: {
    color:'#888',
    paddingRight:15,
    textAlign:'right'
  },
  shadedStatusBar:{
    backgroundColor:'rgba(0,0,0,0.2)',
    height: statusBarHeight,
    width:screenWidth,
  },
  button: {
    width:0.9*screenWidth,
    height:50,
    borderRadius:12,
    backgroundColor:'white',
    margin:5,
    justifyContent:'center',
    alignItems:'center',
  },
  buttonAndroid: {
    width:0.7*screenWidth,
    height:50,
    backgroundColor: colors.white.hex,
    justifyContent:'center',
    alignItems:'flex-start',
    paddingLeft: 15
  },
  joinedButton: {
    width:0.9*screenWidth,
    height:101,
    borderRadius:12,
    backgroundColor:'white',
    margin:5,
  },
  joinedButtons:{
    width:0.9*screenWidth,
    height:50,
    justifyContent:'center',
    alignItems:'center',
  },
  buttonSeparatorAndroid:{
    width:0.7*screenWidth,
    height:1,
    backgroundColor: colors.lightGray.hex,
  },
  buttonSeparatorAndroidHighlight:{
    width:0.7*screenWidth,
    height:2,
    backgroundColor: colors.csOrange.hex
  },
  joinedButtonSeparator:{
    width:0.9*screenWidth,
    height:1,
    backgroundColor: colors.gray.hex
  },
  buttonText : {
    fontSize:16,
    color: colors.blue.hex
  },
  buttonTextAndroid : {
    fontSize:15,
    color: colors.menuBackground.hex
  },
  buttonTextTitleAndroid : {
    fontSize:18,
    color: colors.white.hex,
    fontWeight:'bold'
  },
  buttonTitleAndroid : {
    width:0.7*screenWidth,
    height:55,
    backgroundColor: colors.menuBackground.hex,
    justifyContent:'center',
    alignItems:'flex-start',
    paddingLeft: 15
  },
  menuText: {
    fontSize: 16,
    color: colors.menuText.hex,
  },
  version: {
    backgroundColor:"transparent",
    color: colors.darkGray2.hex,
    textAlign:'center',
    fontSize: 10,
  }
});


export class OrangeLine extends Component<any, any> {
  render() { return <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} />; }
}