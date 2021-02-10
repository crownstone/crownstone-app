
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SetupShared", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { Icon } from '../components/Icon';
import { colors, screenWidth, screenHeight } from '../styles'

let fontSize;
if (screenWidth > 370)
  fontSize = 45;
else if (screenWidth > 300)
  fontSize = 40;
else
  fontSize = 35;


let textColor = colors.csBlueDark.hex;
export const setupStyle = StyleSheet.create({
  imageDistance: {
    height:50
  },
  lineDistance: {
    height:19
  },
  smallText: {
    backgroundColor:'transparent',
    color: textColor,
    fontSize: 13,
    textAlign:'center',
    fontWeight:'400',
  },
  h0:{
    padding: 20,
    backgroundColor:'transparent',
    color: textColor,
    fontSize:fontSize,
    fontWeight:'400',
  },
  h1:{
    padding: 20,
    backgroundColor:'transparent',
    color: textColor,
    fontSize:fontSize*0.85,
    fontWeight:'400',
  },
  h2:{
    padding: 20,
    backgroundColor:'transparent',
    color: textColor,
    fontSize:fontSize*0.75,
    fontWeight:'400',
  },
  h3:{
    padding: 20,
    backgroundColor:'transparent',
    color: textColor,
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
    color: textColor,
    fontSize: fontSize*0.45,
    fontWeight:'400',
    paddingLeft: 20,
    paddingRight: 20,
  },
  information: {
    backgroundColor:'transparent',
    color: textColor,
    fontSize: fontSize*0.4,
    fontWeight:'300',
    paddingLeft: 20,
    paddingRight: 20,
  },
  buttonContainer: {
    marginBottom:15,
    width: screenWidth,
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
    borderColor: textColor,
    alignItems:'center',
    justifyContent:'center',
    margin: (screenWidth - 2*130) / 6,
    marginBottom:0,
    marginTop:0
  },
  smallButton: {
    backgroundColor:'transparent',
    height: 100,
    width: 100,
    borderRadius:50,
    borderWidth:2,
    borderColor: textColor,
    alignItems:'center',
    justifyContent:'center',
    margin: 0,
  },
  buttonText: {
    color: textColor,
    fontSize:20,
    fontWeight:'500',
    textAlign:'center',
  },
  spacer: {
    flexDirection:'column',
    flex:1,
    alignItems:'center',
    marginTop:screenHeight*0.4,
  },
  textBoxView: {
    backgroundColor: textColor,
    width:screenWidth,
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

export class NextButton extends Component<any, any> {
  render() {
    return <TouchableOpacity onPress={this.props.onPress} >
      <View style={{paddingRight:20, flexDirection:'row', height:30}}>
        <Text style={[setupStyle.buttonText]}>{ lang("Next") }</Text>
        <Icon name="ios-arrow-forward" size={30} color={colors.csBlueDark.hex} style={{position:'relative', top:-2, paddingLeft:8}} />
      </View>
    </TouchableOpacity>
  }
}
export class StartButton extends Component<any, any> {
  render() {
    return <TouchableOpacity onPress={this.props.onPress} >
      <View style={{paddingRight:20, flexDirection:'row', height:30}}>
        <Text style={[setupStyle.buttonText]}>{ lang("Start_setup") }</Text>
        <Icon name="ios-arrow-forward" size={30} color={colors.csBlueDark.hex} style={{position:'relative', top:-2, paddingLeft:8}} />
      </View>
    </TouchableOpacity>
  }
}

export class SkipButton extends Component<any, any> {
  render() {
    return <TouchableOpacity onPress={this.props.onPress} >
      <View style={{paddingLeft:20, flexDirection:'row', height:30}}>
        <Icon name="ios-remove-circle-outline" size={30} color={colors.csBlueDark.hex} style={{position:'relative', top:-2, paddingRight:8}} />
        <Text style={[setupStyle.buttonText]}>{ lang("Skip") }</Text>
      </View>
    </TouchableOpacity>
  }
}

export class CancelButton extends Component<any, any> {
  render() {
    return <TouchableOpacity onPress={this.props.onPress} >
      <View style={{paddingLeft:20, flexDirection:'row', height:30}}>
        <Icon name="ios-remove-circle-outline" size={30} color={colors.csBlueDark.hex} style={{position:'relative', top:-2, paddingRight:8}} />
        <Text style={[setupStyle.buttonText]}>{ lang("Cancel") }</Text>
      </View>
    </TouchableOpacity>
  }
}