import React, { Component } from 'react'
import { Dimensions, PixelRatio, StyleSheet, TouchableOpacity, View, Text } from 'react-native'
var Icon = require('react-native-vector-icons/Ionicons');

let { width, height } = Dimensions.get('window');

let fontSize;
if (width > 370)
  fontSize = 45;
else if (width > 300)
  fontSize = 40;
else
  fontSize = 35;

export const setupStyle = StyleSheet.create({
  imageDistance: {
    height:50
  },
  lineDistance: {
    height:19
  },
  smallText: {
    backgroundColor:'transparent',
    color:'#fff',
    fontSize: 13,
    textAlign:'center',
    fontWeight:'400',
  },
  h0:{
    padding: 20,
    backgroundColor:'transparent',
    color:'#fff',
    fontSize:fontSize,
    fontWeight:'400',
  },
  h1:{
    padding: 20,
    backgroundColor:'transparent',
    color:'#fff',
    fontSize:fontSize*0.85,
    fontWeight:'400',
  },
  h2:{
    padding: 20,
    backgroundColor:'transparent',
    color:'#fff',
    fontSize:fontSize*0.75,
    fontWeight:'400',
  },
  h3:{
    padding: 20,
    backgroundColor:'transparent',
    color:'#fff',
    fontSize: fontSize*0.5,
    fontWeight:'400',
  },
  roomBar: {
    marginTop:4,
    marginRight:20,
  },
  roomBarInner: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius:5,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'flex-start',
    padding:10,
    height:40,
  },
  text: {
    backgroundColor:'transparent',
    color:'#fff',
    fontSize: fontSize*0.45,
    fontWeight:'400',
    paddingLeft: 20,
    paddingRight: 20,
  },
  information: {
    backgroundColor:'transparent',
    color:'#fff',
    fontSize: fontSize*0.4,
    fontWeight:'300',
    paddingLeft: 20,
    paddingRight: 20,
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
  smallButton: {
    backgroundColor:'transparent',
    height: 100,
    width: 100,
    borderRadius:50,
    borderWidth:2,
    borderColor:'white',
    alignItems:'center',
    justifyContent:'center',
    margin: 0,
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

export class NextButton extends Component {
  render() {
    return <TouchableOpacity onPress={this.props.onPress} >
      <View style={{paddingRight:20, flexDirection:'row', height:30}}>
        <Text style={[setupStyle.buttonText]}>Next</Text>
        <Icon name="ios-arrow-forward" size={30} color={'#fff'} style={{position:'relative', top:-2, paddingLeft:8}} />
      </View>
    </TouchableOpacity>
  }
}
export class StartButton extends Component {
  render() {
    return <TouchableOpacity onPress={this.props.onPress} >
      <View style={{paddingRight:20, flexDirection:'row', height:30}}>
        <Text style={[setupStyle.buttonText]}>Start setup</Text>
        <Icon name="ios-arrow-forward" size={30} color={'#fff'} style={{position:'relative', top:-2, paddingLeft:8}} />
      </View>
    </TouchableOpacity>
  }
}

export class SkipButton extends Component {
  render() {
    return <TouchableOpacity onPress={this.props.onPress} >
      <View style={{paddingLeft:20, flexDirection:'row', height:30}}>
        <Icon name="ios-remove-circle-outline" size={30} color={'#fff'} style={{position:'relative', top:-2, paddingRight:8}} />
        <Text style={[setupStyle.buttonText,{fontWeight:'300'}]}>Skip</Text>
      </View>
    </TouchableOpacity>
  }
}

export class CancelButton extends Component {
  render() {
    return <TouchableOpacity onPress={this.props.onPress} >
      <View style={{paddingLeft:20, flexDirection:'row', height:30}}>
        <Icon name="ios-remove-circle-outline" size={30} color={'#fff'} style={{position:'relative', top:-2, paddingRight:8}} />
        <Text style={[setupStyle.buttonText,{fontWeight:'300'}]}>Cancel</Text>
      </View>
    </TouchableOpacity>
  }
}