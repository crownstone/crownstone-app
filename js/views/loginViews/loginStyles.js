import React, { StyleSheet } from 'react-native'

export default StyleSheet.create({
  spacer: {
    flexDirection:'column',
    flex:1,
    alignItems:'center',
    paddingTop:280
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
    flexDirection:'row',
    flex:1,
    alignItems:'flex-end',
    justifyContent:'center',
    paddingBottom:30
  },
  loginButton: {
    backgroundColor:'transparent',
    height:60,
    borderRadius:30,
    borderWidth:2,
    borderColor:'white',
    alignItems:'center',
    justifyContent:'center'
  },
  loginText: {
    color:'white',
    fontSize:21,
    fontWeight:'400',
  }
});

