import React, {
  Component,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { Background } from './../components/Background'
import {stylesIOS, colors} from './../styles'
let styles = stylesIOS;

export class LoginSplash extends Component {
  render() {
    let width = Dimensions.get('window').width;
    let buttonWidth = 0.4 * width;
    let spacerWidth = 0.07 * width;

    return (
      <Background hideInterface={true} background={require('../../images/loginBackground.png')}>
        <View style={[styles.shadedStatusBar, {width}]} />
        <View style={loginStyles.loginButtonContainer}>
          <View style={{width:spacerWidth}} />
          <TouchableOpacity onPress={() => {Actions.register()}} >
            <View style={[loginStyles.loginButton, {width:buttonWidth}]}><Text style={loginStyles.loginText}>Register</Text></View>
          </TouchableOpacity>
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => {Actions.login()}} >
            <View style={[loginStyles.loginButton, {width:buttonWidth}]}><Text style={loginStyles.loginText}>Log In</Text></View>
          </TouchableOpacity>
          <View style={{width:spacerWidth}} />
        </View>
      </Background>
    )
  }
}

let transparent = {backgroundColor:'transparent'};
let loginStyles = StyleSheet.create({
  loginButtonContainer: {
    flexDirection:'row',
    flex:1,
    alignItems:'flex-end',
    justifyContent:'center',
    paddingBottom:30
  },
  loginButton: {
    backgroundColor:'transparent',
    height:50,
    borderRadius:25,
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