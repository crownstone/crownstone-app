import React, {
  Alert,
  Component,
  Dimensions,
  Image,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { emailCheckRegex } from './../../util/util'
import { CLOUD } from '../../util/cloud'
import initialStateActionList from './../../router/store/initialState'
import { TopBar } from './../components/Topbar';
import { Processing } from './../components/Processing'
import { TextEditInput } from './../components/editComponents/TextEditInput'
import { Background } from './../components/Background'
var Icon = require('react-native-vector-icons/Ionicons');
import { styles, colors} from './../styles'
import loginStyles from './LoginStyles'



export class Login extends Component {
  constructor() {
    super();
    this.state = {email:'Alexdemulder@gmail.com', password:'letmein0', processing:false, processingText:'Logging in...'};
    this.closePopupCallback = () => {this.setState({processing:false})};
  }

  _resetPopup() {
    if (emailCheckRegex.test(this.state.email) === false) {
      Alert.alert('Check Email Address','Please input a valid email address in the form and press the Forgot Password button again.',[
        {text: 'OK'}
      ]);
    }
    else {
      Alert.alert('Send Password Reset Email','Would you like us to send an email to reset your password to: ' + this.state.email.toLowerCase() + '?',[
        {text: 'Cancel'},
        {text: 'OK',     onPress: () => {this._requestPasswordResetEmail()}}
      ]);
    }
  }

  _requestVerificationEmail() {
    this.setState({processing:true, processingText:'Requesting new verification email...'});
    let successCallback = () => { Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Verification Email Sent'}) };
    let errorHandleCallback = (response) => {
      Alert.alert('Cannot Resend Confirmation.',response.error.message,[{text: 'OK', onPress: this.closePopupCallback}]);
    };

    let data = { email: this.state.email.toLowerCase() };
    CLOUD.post({ endPoint:'users/resendVerification', data, type:'query'}, successCallback, errorHandleCallback, this.closePopupCallback);
  }

  _requestPasswordResetEmail() {
    this.setState({processing:true, processingText:'Requesting password reset email...'});
    let successCallback = (response) => {
      Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Reset Email Sent', passwordReset:true})
    };
    let errorHandleCallback = (response) => {
      Alert.alert('Cannot Send Reset Email.',response.error.message,[{text: 'OK', onPress: this.closePopupCallback}]);
    };

    let data = { email: this.state.email.toLowerCase() };
    CLOUD.post({endPoint:'users/reset', data, type:'body'}, successCallback, errorHandleCallback, this.closePopupCallback);
  }

  _login() {
    this.setState({processing:true, processingText:'Logging in...'});
    let successCallback = (response) => {this._processLogin(response.id, response.userId)};
    let errorHandleCallback = (response) => {
      switch (response.error.code) {
        case "LOGIN_FAILED_EMAIL_NOT_VERIFIED":
          Alert.alert('Your email address has not been verified','Please click on the link in the email that was sent to you. If you did not receive an email, press Resend Email to try again.',[
            {text: 'Resend Email', onPress: () => this._requestVerificationEmail()},
            {text: 'OK', onPress: this.closePopupCallback}
          ]);
          break;
        case "LOGIN_FAILED":
          Alert.alert('Incorrect Email or Password.','Could not log in.',[{text: 'OK', onPress: this.closePopupCallback}]);
          break;
        default:
          Alert.alert('Login Error',response.error.message,[{text: 'OK', onPress: this.closePopupCallback}]);
      }
    };
    let data = { email: this.state.email.toLowerCase(), password: this.state.password };
    CLOUD.post({endPoint:'users/login', data, type:'body'}, successCallback, errorHandleCallback, this.closePopupCallback);
  }

  render() {
    let width = Dimensions.get('window').width;
    return (
      <Background hideInterface={true} background={require('../../images/loginBackground.png')}>
        <TopBar left="Back" leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true} />
        <View style={loginStyles.spacer}>
          <View style={[loginStyles.textBoxView, {width: 0.8*width}]}>
            <TextEditInput style={{flex:1, padding:10}} placeholder="email" placeholderTextColor="#888" value={this.state.email} callback={(newValue) => {this.setState({email:newValue});}} />
          </View>
          <View style={[loginStyles.textBoxView, {width: 0.8*width}]}>
            <TextEditInput style={{flex:1, padding:10}} secureTextEntry={true} placeholder="password" placeholderTextColor="#888" value={this.state.password} callback={(newValue) => {this.setState({password:newValue});}} />
          </View>
          <TouchableHighlight style={{borderRadius:20, height:40, width:width*0.6, justifyContent:'center', alignItems:'center'}} onPress={this._resetPopup.bind(this)}><Text style={loginStyles.forgot}>Forgot Password?</Text></TouchableHighlight>
          <View style={loginStyles.loginButtonContainer}>
            <TouchableOpacity onPress={this._login.bind(this)}>
              <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>Log In</Text></View>
            </TouchableOpacity>
          </View>
        </View>
        <Processing visible={this.state.processing} text={this.state.processingText} />
      </Background>
    )
  }

  _processLogin(token, userId) {
    //TODO: check for and upload picture
    //TODO: get first and last name

    const store = this.props.store;
    store.dispatch({
      type:'USER_LOG_IN',
      data:{
        name:this.state.email.toLowerCase(),
        tokens:[{owner:token}],
        userId:userId
      }
    });
    initialStateActionList.forEach((action) => {
      store.dispatch(action);
    });
    Actions.tabBar();
  }
}

let transparent = {backgroundColor:'transparent'};
