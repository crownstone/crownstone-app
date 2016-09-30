import React, { Component } from 'react'
import { Dimensions, PixelRatio, StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { hex2rgb, rgb2hsv, rgb2hsl, rgb2hcl } from '../util/colorConverters'

export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;
export const pxRatio = PixelRatio.get();

export let barHeight = 21*pxRatio;
export let barHeightLarge = 40*pxRatio;

export let colors = {
  menuBackground: {hex:'#00263e'},
  menuText: {hex:'#fff'},
  menuTextSelected: {hex:'#2daeff'},
  gray: {hex:'#ccc'},
  notConnected: {hex:'#64897f'},
  darkGray: {hex:'#555'},
  lightGray: {hex:'#ddd'},
  purple: {hex:'#8a01ff'},
  blue: {hex:'#0075c9'},
  green: {hex:'#a0eb58'},
  green2: {hex:'#4cd864'},
  orange: {hex:'#ff953a'},
  red: {hex:'#ff3c00'},
  darkRed: {hex:'#cc0900'},
  menuRed: {hex:'#e00'},
  iosBlue: {hex:'#0077ff'},
  blinkColor1: {hex:'#2daeff'},
  blinkColor2: {hex:'#a5dcff'},
};

for (let color in colors) {
  if (colors.hasOwnProperty(color)) {
    colors[color].rgb = hex2rgb(colors[color].hex);
    // colors[color].hsv = rgb2hsv(colors[color].rgb.r,colors[color].rgb.g,colors[color].rgb.b);
    // colors[color].hsl = rgb2hsl(colors[color].rgb.r,colors[color].rgb.g,colors[color].rgb.b);
    // colors[color].hcl = rgb2hcl(colors[color].rgb.r,colors[color].rgb.g,colors[color].rgb.b);
  }
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
    backgroundColor: '#ffffff',
    paddingLeft:15,
    paddingRight:15,
    alignItems: 'center',
  },
  listText:{
    width:(1/3)*screenWidth,
    fontSize: 16,
  },
  listTextLarge:{
    width:(2/3)*screenWidth,
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray.hex,
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
    height:20,
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
  joinedButtonSeparator:{
    width:0.9*screenWidth,
    height:1,
    backgroundColor: colors.gray.hex
  },
  buttonText : {
    fontSize:16,
    color: colors.blue.hex
  },
  menuText: {
    fontSize: 16,
    color: colors.menuText.hex,
  }
});

