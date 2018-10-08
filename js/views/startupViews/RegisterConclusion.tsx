import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Background } from './../components/Background'
const Actions = require('react-native-router-flux').Actions;
import loginStyles from './LoginStyles'


export class RegisterConclusion extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: Languages.title("RegisterConclusion", "Almost_Done_")()}
  };

  render() {
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.mainDark} safeView={true}>
        <View style={{flex:1}}>
          <View style={{flex:4}} />
          <View style={style.viewContainer}>
            <Text style={style.text}>{ Languages.text("RegisterConclusion", "An_email_has_been_sent_to")() }</Text>
          </View>
          <View style={[style.viewContainer]}>
            <Text style={[style.text, {fontSize:21, fontWeight:'500'}]}>{this.props.email}</Text>
          </View>
          <View style={[style.viewContainer]}>
            <Text style={style.text}>{ Languages.text("RegisterConclusion", "Please_click_the_link_in_")(this.props.passwordReset) }</Text>
            <Text style={style.smallText}>{ Languages.text("RegisterConclusion", "It_can_take_up_to_a_minut")() }</Text>
          </View>
          <View style={{flex:0.5}} />
          <View style={{alignItems:'center', justifyContent:'center', paddingBottom: 30}}>
            <TouchableOpacity onPress={ () => { Actions.login() }}>
              <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>{ Languages.text("RegisterConclusion", "OK")() }</Text></View>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    );
  }
}

let style = StyleSheet.create({
  viewContainer: {
    backgroundColor:'transparent',
    alignItems:'center',
    justifyContent:'center',
    paddingLeft:15,
    paddingRight:15,
    padding:10
  },
  text: {
    textAlign:'center',
    color: '#fff',
    fontSize: 18
  },
  smallText: {
    paddingTop:15,
    textAlign:'center',
    color: '#fff',
    fontSize: 13
  }
});
