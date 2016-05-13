import React, { Dimensions, PixelRatio, StyleSheet } from 'react-native'

let { width, height } = Dimensions.get('window');

export const setupStyle = StyleSheet.create({
  header:{
    padding:20,
    backgroundColor:'transparent',
    color:'#fff',
    fontSize:45,
    fontWeight:'400',
  },
  text: {
    backgroundColor:'transparent',
    color:'#fff',
    fontSize:22,
    fontWeight:'400',
    padding:20,
    paddingBottom:0,
  },
  information: {
    backgroundColor:'transparent',
    color:'#fff',
    fontSize:18,
    fontWeight:'300',
    padding:20,
    paddingBottom:0,
  },
  buttonContainer: {
    marginBottom:30,
    width: width,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'transparent',
  },
  button: {
    backgroundColor:'transparent',
    height: 130,
    width: 130,
    borderRadius:65,
    borderWidth:2,
    borderColor:'white',
    alignItems:'center',
    justifyContent:'center',
    margin: (width - 2*130) / 6,
    marginBottom:0,
    marginTop:0
  },
  buttonText: {
    color:'white',
    fontSize:20,
    fontWeight:'500',
    textAlign:'center',
  },
  spacer: {
    flexDirection:'column',
    flex:1,
    alignItems:'center',
    marginTop:height*0.4,
  },
  textBoxView: {
    backgroundColor:'#fff',
    width:width,
    height:40,
    borderRadius:3,
    alignItems:'center',
    justifyContent:'center',
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
});