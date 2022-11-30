import * as React from 'react';
import {Dimensions, PixelRatio, Platform, StyleSheet, TextStyle} from 'react-native'
import {hex2rgb, hsv2hex, rgb2hex, rgb2hsv} from '../util/ColorConverters'
import DeviceInfo from 'react-native-device-info';
import {LOG, LOGi} from "../logging/Log";
import { Navigation } from "react-native-navigation";

export const deviceModel    = DeviceInfo.getModel();
export const deviceId       = DeviceInfo.getDeviceId();
export let isModernIosModel = deviceModel.indexOf('iPhone X') !== -1 || deviceModel.indexOf('iPhone 1') !== -1;

export let topBarMargin    = 0
export let tabBarMargin    = isModernIosModel ? 34 : 0 ; // Status bar in iOS is 20 high
export let tabBarHeight    = isModernIosModel ? 49 + 34: 49;
export let statusBarHeight = Platform.OS === 'android' ? 24  :  (isModernIosModel ? 44 : 20); // Status bar in iOS is 20 high
export let topBarHeight    = Platform.OS === 'android' ? 54  :  (isModernIosModel ? 44 : 44) + statusBarHeight; // Status bar in iOS is 20 high

export let screenWidth  = Dimensions.get('window').width;
export let screenHeight = Dimensions.get('window').height; // initial guess

export let availableScreenHeight = screenHeight - topBarHeight - tabBarHeight;
export let availableModalHeight  = screenHeight - topBarHeight;

export let viewPaddingTop = Platform.OS === 'android' ? topBarHeight : topBarHeight;


/**
 * This method will set the safe areas for the iPhones X and above.
 * @param insets
 */
export function setInsets(insets: {bottom: number, left:number,right:number, top:number}) {
  if (Platform.OS === 'ios') {
    topBarMargin    = 0;
    tabBarMargin    = insets.bottom;
    tabBarHeight    = insets.bottom > 0 ? 49 + 34: 49; // use the insets to determine if we are on an iPhone X or above
    statusBarHeight = (insets.top > 0 ? insets.top : 20); // Status bar in iOS is 20 high
    topBarHeight    = 44 + statusBarHeight; // Status bar in iOS is 20 high

    availableScreenHeight = screenHeight - topBarHeight - tabBarHeight;
    availableModalHeight  = screenHeight - topBarHeight;

    console.log("SET INSETS", insets, topBarHeight, tabBarHeight, availableScreenHeight, availableModalHeight);
  }
}



export function updateScreenHeight(height, topBarAvailable, tabBarAvailable) {
  if (Platform.OS === 'android') {
    let heightOffset = 0;
    if (topBarAvailable) { heightOffset += topBarHeight; }
    if (tabBarAvailable) { heightOffset += tabBarHeight; }

    let totalHeight = height + heightOffset;
    if (totalHeight > 0 && totalHeight !== screenHeight && totalHeight > 0.5 * Dimensions.get('screen').height) {
      let prevScreenHeight = screenHeight;
      let prevAvailableScreenHeight = availableScreenHeight;
      let prevAvailableModalHeight = availableModalHeight;

      screenHeight = totalHeight;

      availableScreenHeight = screenHeight - topBarHeight - tabBarHeight;
      availableModalHeight = screenHeight - topBarHeight - 0.5 * tabBarMargin;

      console.log("updateScreenHeight Screen height changed from " + prevScreenHeight + " to " + screenHeight + " (available: " + availableScreenHeight + ") (modal: " + availableModalHeight + ")");
    }
  }
}

export const stylesUpdateConstants = () =>  {
  let constants = Navigation.constantsSync()
  let tmpStatusBarHeight = constants.statusBarHeight > 0 ? constants.statusBarHeight : statusBarHeight;
  statusBarHeight = tmpStatusBarHeight;

  topBarHeight = constants.topBarHeight > 0 ? constants.topBarHeight : topBarHeight;
  tabBarHeight = constants.bottomTabsHeight > 0 ? constants.bottomTabsHeight : tabBarHeight;

  topBarHeight += statusBarHeight;
  viewPaddingTop = Platform.OS === 'android' ? topBarHeight : topBarHeight - statusBarHeight;

  availableScreenHeight = screenHeight - topBarHeight - tabBarHeight;
  availableModalHeight = screenHeight - topBarHeight - 0.5 * tabBarMargin;

  LOG.info('screenHeightData', screenHeight, "window", Dimensions.get('window'), "screen", Dimensions.get('screen'), 'constants', constants)
  console.log('stylesUpdateConstants screenHeightData', screenHeight, "window", Dimensions.get('window'), "screen", Dimensions.get('screen'), 'constants', constants)
}



export const pxRatio = PixelRatio.get();

export const EXTRA_LARGE_ROW_SIZE  = 85;
export const LARGE_ROW_SIZE  = 75;
export const MID_ROW_SIZE    = 62;
export const NORMAL_ROW_SIZE = 54;

export let colors : colorInterface = {
  csBlue:            {hex:'#003E52'},
  csBlueDark:        {hex:'#00283c'},
  csBlueDarker:      {hex:'#00212b'},
  csBlueDarkerDesat: {hex:'#7f9095'},
  csBlueLight:       {hex:'#006f84'},
  csBlueLighter:     {hex:'#00b6cd'},
  csBlueLightDesat:  {hex:'#2c9aa8'},
  csOrange:          {hex:'#ff8400'},
  lightCsOrange:     {hex:'#ffa94d'},
  menuBackground:    {hex:'#00212b'},
  menuText:          {hex:'#fff'},
  white:             {hex:'#fff'},
  black:             {hex:'#000'},
  gray:              {hex:'#ccc'},
  darkGray:          {hex:'#555'},
  darkGray2:         {hex:'#888'},
  lightGray2:        {hex:'#dedede'},
  lightGray:         {hex:'#eee'},
  purple:            {hex:'#8a01ff'},
  darkPurple:        {hex:'#5801a9'},
  darkerPurple:      {hex:'#2a0051'},
  blue:              {hex:'#2daeff'},
  blueDark:          {hex:'#2472ad'},
  blue3:             {hex:'#0075c9'},
  green:             {hex:'#a0eb58'},
  lightGreen2:       {hex:'#bae97b'},
  lightGreen:        {hex:'#caff91'},
  green2:            {hex:'#4cd864'},
  darkGreen:         {hex:'#1f4c43'},
  red:               {hex:'#ff3c00'},
  darkRed:           {hex:'#cc0900'},
  menuRed:           {hex:'#e00'},
  iosBlue:           {hex:'#3478f6'},
  iosBlueDark:       {hex:'#002e5c'},
  lightBlue:         {hex:'#a9d0f1'},
  lightBlue2:        {hex:'#77c2f7'},
  blinkColor1:       {hex:'#41b5ff'},
  blinkColor2:       {hex:'#a5dcff'},
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
    right:0, bottom:0,
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
    backgroundColor: colors.white.rgba(0.5),
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
    width: screenWidth,
  },
  statusBarPadding:{
    backgroundColor:'rgba(0,0,0,0.0)',
    height: statusBarHeight,
    width: screenWidth,
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
  blueButton: {alignItems: 'center', justifyContent:'center', padding:20, backgroundColor: colors.blue.hex, borderRadius: 10, marginHorizontal: 15},
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
    color: colors.blue3.hex
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
  boldLeftExplanation: {fontSize:15, padding: 15, paddingTop:10, paddingBottom:10, textAlign:'left', fontWeight:'bold'},
  header: { padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center', fontSize:18, fontWeight:'bold'},
  title: { padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center', fontSize:30, fontWeight:'bold'},
  legendText: {fontSize:12, textAlign:'center', paddingTop:10},
  viewHeader: { fontSize: 30, fontWeight: 'bold', color: colors.black.hex,      maxWidth: screenWidth - 50 - 50},
  viewHeaderLight: { fontSize: 30, fontWeight: 'bold', color: colors.white.hex, maxWidth: screenWidth - 50 - 50},
  viewButton: { fontSize:16, fontWeight: 'bold', color: colors.white.hex },
});

let textColor = colors.csBlueDark;

export const menuStyles = StyleSheet.create({
  disabledListView: {
    backgroundColor: colors.lightGray.rgba(0.5),
    color: colors.black.rgba(0.3)
  },
  listView: {
    flexDirection: 'row',
    backgroundColor: colors.white.rgba(0.7),
    paddingHorizontal:15,
    alignItems: 'center',
  },
  collapsableContent: {
    fontSize: 15,
    paddingLeft:25,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  listText:{
    width:(1/3)*screenWidth,
    fontSize: 16,
  },
  valueText:{
    fontSize: 16,
  },
  listTextLarge:{
    flex:10,
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: colors.black.rgba(0.03),
  },
  subText: {
    fontSize:12,
    color:colors.iosBlue.hex
  },
  explanationText: {
    fontSize:13,
    color: colors.darkGray.hex,
  },
  largeExplanationText: {
    fontSize:15,
    color: colors.darkGray.hex,
  }
});

export const appStyleConstants = {
  roundness:10,
};


export const rowstyles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight:'bold',
    color: colors.black.hex,
  }
});


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


export const background = {
  main: require('../../assets/images/backgrounds/lightBackground3_blur.jpg'),
  menu: require('../../assets/images/backgrounds/lightBackground3_blur.jpg'), //require('../../assets/images/backgrounds/menuBackground.jpg'),
  dark: require('../../assets/images/backgrounds/darkBackground3.jpg'),
}

export const RoomStockBackground = {
  darkRed    : require('../../assets/images/backgrounds/locationBackgrounds/darkRed.jpg'),
  red        : require('../../assets/images/backgrounds/locationBackgrounds/red.jpg'),
  orange     : require('../../assets/images/backgrounds/locationBackgrounds/orange.jpg'),
  yellow     : require('../../assets/images/backgrounds/locationBackgrounds/yellow.jpg'),
  blue       : require('../../assets/images/backgrounds/locationBackgrounds/blue.jpg'),
  csBlue     : require('../../assets/images/backgrounds/locationBackgrounds/csBlue.jpg'),
  darkBlue   : require('../../assets/images/backgrounds/locationBackgrounds/darkBlue.jpg'),
  darkGreen  : require('../../assets/images/backgrounds/locationBackgrounds/darkGreen.jpg'),
  green2     : require('../../assets/images/backgrounds/locationBackgrounds/green2.jpg'),
  green      : require('../../assets/images/backgrounds/locationBackgrounds/green.jpg'),
  lightGreen : require('../../assets/images/backgrounds/locationBackgrounds/lightGreen.jpg'),

  base       : require('../../assets/images/backgrounds/lightBackground3_blur.jpg'),
}


export function getRoomStockImage(key) {
  return RoomStockBackground[key] ?? RoomStockBackground.base;
}
