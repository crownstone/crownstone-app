import React, {
  Component,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import initialStateActionList from './../../router/store/initialState'
import { Background } from './../components/Background'
var Icon = require('react-native-vector-icons/Ionicons');
import {stylesIOS, colors} from './../styles'
import loginStyles from './LoginStyles'
let styles = stylesIOS;


export class Login extends Component {
  constructor() {
    super();
    this.state = {username:undefined, password:undefined};
  }

  _login() {
    const store = this.props.store;
    store.dispatch({
      type:'USER_LOG_IN',
      data:{
        name:this.state.username,
        tokens:[{owner:'fs3ertfh34'}],
      }
    });
    initialStateActionList.forEach((action) => {
      store.dispatch(action);
    });
    Actions.tabBar();
  }

  render() {
    let width = Dimensions.get('window').width;
    let buttonWidth = 0.5 * width;
//<TextInput placeholder="password" value={this.state.password} onChange={(newValue) => {this.setState({password:newValue});}} secureTextEntry={true} />
    return (
      <Background hideInterface={true} background={require('../../images/loginBackground.png')}>
        <View style={[styles.shadedStatusBar, {width}]} />
        <TouchableOpacity onPress={Actions.pop} style={loginStyles.backButton}>
          <Icon name="ios-arrow-back" size={25} color={'#ffffff'} style={{marginTop:2,paddingRight:6}} />
          <Text style={styles.topBarLeft}>Back</Text>
        </TouchableOpacity>
        <View style={loginStyles.spacer}>
          <View style={[loginStyles.textBoxView, {width: 0.8*width}]}>
            <TextInput style={{flex:1, padding:10}} placeholder="username" placeholderTextColor="#888" value={this.state.username} onChange={(newValue) => {this.setState({userName:newValue});}} />
          </View>
          <View style={[loginStyles.textBoxView, {width: 0.8*width}]}>
            <TextInput style={{flex:1, padding:10}} secureTextEntry={true} placeholder="password" placeholderTextColor="#888" value={this.state.password} onChange={(newValue) => {this.setState({password:newValue});}} />
          </View>
          <View style={transparent}><Text style={loginStyles.forgot}>Forgot Password?</Text></View>
          <View style={loginStyles.loginButtonContainer}>
            <TouchableOpacity onPress={this._login.bind(this)}>
              <View style={[loginStyles.loginButton, {width:buttonWidth}]}><Text style={loginStyles.loginText}>Log In</Text></View>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    )
  }
}

let transparent = {backgroundColor:'transparent'};
