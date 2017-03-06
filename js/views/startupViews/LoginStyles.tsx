import * as React from 'react'; import { Component } from 'react';
import { Dimensions, PixelRatio, StyleSheet } from 'react-native'
import { screenWidth, screenHeight } from '../styles'

export default StyleSheet.create({
  spacer: {
    flexDirection:'column',
    flex:1,
    alignItems:'center',
    marginTop:screenHeight*0.4,
  },
  textBoxView: {
    backgroundColor:'#fff',
    height:40,
    borderRadius:3,
    alignItems:'center',
    justifyContent:'center',
    marginBottom:10,
  },
  forgot: {
    padding:5,
    color: '#93cfff',
  },
  backButton: {
    flexDirection:'row',
    alignItems:'center',
    paddingLeft:10,
    backgroundColor:'transparent',
    width:100
  },
  loginButtonContainer: {
    position:'absolute',
    bottom:30,
    flex:1,
    width: screenWidth,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'transparent',
  },
  loginButton: {
    backgroundColor:'transparent',
    height: 110,
    width:  110,
    borderRadius: 55,
    borderWidth:2,
    borderColor:'white',
    alignItems:'center',
    justifyContent:'center',
    margin: (screenWidth - 2*110) / 6,
    marginBottom:0
  },
  loginText: {
    color:'white',
    fontSize:21,
    fontWeight:'400',
  }
});

