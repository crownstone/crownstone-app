import * as React from 'react';
import { Dimensions, PixelRatio, Platform, StyleSheet} from 'react-native'
import {hex2rgb, hsv2hex, rgb2hex, rgb2hsv} from '../util/ColorConverters'
import DeviceInfo from 'react-native-device-info';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import { Navigation } from "react-native-navigation";

export const deviceModel = DeviceInfo.getModel();

export let isIPhoneX = deviceModel.indexOf('iPhone X') !== -1;

export let topBarMargin    = 0
export let tabBarMargin    = isIPhoneX ? 34 : 0 ; // Status bar in iOS is 20 high
export let tabBarHeight    = isIPhoneX ? 49 + 34: 49;
export let statusBarHeight = Platform.OS === 'android' ? 24  :  (isIPhoneX ? 44 : 20); // Status bar in iOS is 20 high
export let topBarHeight    = Platform.OS === 'android' ? 54  :  (isIPhoneX ? 44 : 44) + statusBarHeight; // Status bar in iOS is 20 high

export let screenWidth = Dimensions.get('window').width;

export let screenHeight = Dimensions.get('window').height;
if (Platform.OS === 'android') {
  screenHeight = ExtraDimensions.getRealWindowHeight() - ExtraDimensions.getStatusBarHeight() - ExtraDimensions.getSoftMenuBarHeight()
}

export let availableScreenHeight = screenHeight - topBarHeight - tabBarHeight;
export let availableModalHeight  = screenHeight - topBarHeight - 0.5 * tabBarMargin;

export const stylesUpdateConstants = () =>  {
  Navigation.constants()
    .then((constants) => {
      let tmpStatusBarHeight = constants.statusBarHeight > 0 ? constants.statusBarHeight : statusBarHeight;
      statusBarHeight = tmpStatusBarHeight;

      topBarHeight = constants.topBarHeight > 0 ? constants.topBarHeight : topBarHeight;
      tabBarHeight = constants.bottomTabsHeight > 0 ? constants.bottomTabsHeight : tabBarHeight;

      availableScreenHeight = screenHeight - topBarHeight - tabBarHeight;
      availableModalHeight = screenHeight - topBarHeight - 0.5 * tabBarMargin;
    })
}



export const pxRatio = PixelRatio.get();

export const EXTRA_LARGE_ROW_SIZE  = 85;
export const LARGE_ROW_SIZE  = 75;
export const MID_ROW_SIZE    = 62;
export const NORMAL_ROW_SIZE = 50;

export let colors : colorInterface = {
  csBlue:               {hex:'#003E52'},
  csBlueDark:           {hex:'#00283c'},
  csBlueDarker:         {hex:'#00212b'},
  csBlueLight:          {hex:'#006f84'},
  csBlueLighter:        {hex:'#00b6cd'},
  csBlueLightDesat:     {hex:'#2c9aa8'},
  csOrange:             {hex:'#ff8400'},
  darkCsOrange:         {hex:'#d97500'},
  lightCsOrange:        {hex:'#ffa94d'},
  // menuBackground:       {hex:'#00263e'},
  menuBackground:       {hex:'#00283c'},
  menuBackgroundDarker: {hex:'#00172c'},
  // menuBackgroundDarker: {hex:'#001122'},
  menuText:             {hex:'#fff'},
  menuTextSelected:     {hex:'#2daeff'},
  menuTextSelectedDark: {hex:'#2472ad'},
  white:                {hex:'#fff'},
  black:                {hex:'#000'},
  gray:                 {hex:'#ccc'},
  notConnected:         {hex:'#00283c'},
  darkGray:             {hex:'#555'},
  darkGray2:            {hex:'#888'},
  lightGray2:           {hex:'#dedede'},
  lightGray:            {hex:'#eee'},
  purple:               {hex:'#8a01ff'},
  darkPurple:           {hex:'#5801a9'},
  darkerPurple:         {hex:'#2a0051'},
  blue:                 {hex:'#0075c9'},
  blue2:                {hex:'#2698e9'},
  green:                {hex:'#a0eb58'},
  green2:               {hex:'#4cd864'},
  lightGreen2:          {hex:'#bae97b'},
  lightGreen:           {hex:'#caff91'},
  darkGreen:            {hex:'#1f4c43'},
  orange:               {hex:'#ff953a'},
  red:                  {hex:'#ff3c00'},
  darkRed:              {hex:'#cc0900'},
  menuRed:              {hex:'#e00'},
  iosBlue:              {hex:'#007aff'},
  iosBlueDark:          {hex:'#002e5c'},
  lightBlue:            {hex:'#a9d0f1'},
  lightBlue2:           {hex:'#77c2f7'},
  blinkColor1:          {hex:'#2daeff'},
  blinkColor2:          {hex:'#a5dcff'},
  random: () => {}
};

for (let color in colors) {
  if (colors.hasOwnProperty(color)) {
    if (color !== "random") {
      populateColorObject(colors[color], color)
    }
  }
}


let allColors = Object.keys(colors);

colors.random = function() {
  return colors[allColors[Math.floor(Math.random()*allColors.length)]]
};
~``;
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
    factor = Math.max(0,Math.min(1,factor));
    let red   = Math.floor((1-factor) * clr.rgb.r + factor * otherColor.rgb.r);
    let green = Math.floor((1-factor) * clr.rgb.g + factor * otherColor.rgb.g);
    let blue  = Math.floor((1-factor) * clr.rgb.b + factor * otherColor.rgb.b);
    return populateColorObject({hex:rgb2hex(red, green, blue)},'blend:'+color+"_"+otherColor.name+"_"+factor)
  };
  clr.hsvBlend = (otherColor, factor) => {
    factor = Math.max(0,Math.min(1,factor));
    let h = (1-factor) * clr.hsv.h + factor * otherColor.hsv.h;``;
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
  row: {flexDirection: 'row'},
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
  },
  explanation: {fontSize:15, padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center'},
  boldExplanation: {fontSize:15, padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center', fontWeight:'bold'},
  header: { padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center', fontSize:18, fontWeight:'bold'},
  title: { padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center', fontSize:30, fontWeight:'bold'},
  legendText: {fontSize:12, textAlign:'center', paddingTop:10}
});

let textColor = colors.csBlueDark;


export const deviceStyles = StyleSheet.create({
  header: {
    color: textColor.hex,
    fontSize: 25,
    fontWeight:'bold',
    textAlign:'center',
  },
  subHeader: {
    paddingTop:10,
    color: textColor.hex,
    fontSize: 22,
    fontWeight:'bold'
  },
  text: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  specification: {
    color: textColor.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:15,
    padding:15,
  },
  explanation: {
    width: screenWidth,
    paddingLeft:10, paddingRight:10,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  },
  explanationText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  },
  errorText: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
  },
});


export const overviewStyles = StyleSheet.create({
  mainText: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: colors.menuBackground.hex,
    fontSize: 25,
    fontWeight: 'bold',
    padding: 15,
    paddingBottom: 0
  },
  subText: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: colors.menuBackground.hex,
    fontSize: 15,
    padding: 15,
    paddingBottom: 0
  },
  subTextSmall: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: colors.menuBackground.rgba(0.4),
    fontSize: 12,
    padding: 30,
    paddingBottom: 0
  },
  bottomText: {
    backgroundColor:'transparent',
    color: colors.csBlue.hex,
    fontSize:12,
    padding:3
  },
  swipeButtonText: {
    backgroundColor: 'transparent',
    fontSize: 40,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});