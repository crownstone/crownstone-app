import React, { Component } from 'react'
import { Dimensions, PixelRatio, StyleSheet, TouchableOpacity, View, Text } from 'react-native'

export const width = Dimensions.get('window').width;
export const height = Dimensions.get('window').height;
export const pxRatio = PixelRatio.get();

export const colors = {
  menuBackground: {h:'#1c202a', r:28, g:32, b:42},
  menuText: {h:'#ffffff', r:255, g:255, b:255},
  menuTextSelected: {h:'#2daeff', r:2, g:222, b:255},
  gray: {h:'#cccccc', r:204, g:204, b:204},
  blue: {h:'#0075c9', r:0, g:137, b:241},
  green: {h:'#a0eb58', r:160, g:235, b:88},
  red: {h:'#ff3c00', r:255, g:60, b:0},
  iosBlue: {h:'#007aff', r:0, g:122, b:255},
};

export const styles = StyleSheet.create({
  fullscreen:{
    position:'absolute',
    top:0,left:0,
    width:width,
    height:height,
  },
  centered: {
    alignItems: 'center',
    justifyContent:'center',
  },
  roomImageContents: {
    padding:10,
    justifyContent:'center',
    backgroundColor: 'transparent'
  },
  roomImageText:{
    fontSize:17,
    fontWeight: 'bold',
    color:'#ffffff',
    padding:8,
  },
  menuItem: {
    fontSize:9,
    color:colors.menuText.h,
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
    width:130,
    fontSize: 17,
  },
  listTextLarge:{
    width:250,
    fontSize: 17,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray.h,
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
    width:width,
  },
  button: {
    width:0.9*width,
    height:50,
    borderRadius:12,
    backgroundColor:'white',
    margin:5,
    justifyContent:'center',
    alignItems:'center',
  },
  joinedButton: {
    width:0.9*width,
    height:101,
    borderRadius:12,
    backgroundColor:'white',
    margin:5,
  },
  joinedButtons:{
    width:0.9*width,
    height:50,
    justifyContent:'center',
    alignItems:'center',
  },
  joinedButtonSeparator:{
    width:0.9*width,
    height:1,
    backgroundColor: colors.gray.h
  },
  buttonText : {
    fontSize:17,
    color: colors.blue.h
  },
  menuText: {
    fontSize: 17,
    color: colors.menuText.h,
  }
});