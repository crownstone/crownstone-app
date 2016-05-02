import React, {
  Alert,
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

import { CLOUD_ADDRESS } from '../../router/store/externalConfig'
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
  }

  _resetProcessing() {
    this.setState({processing:false, processingText:'Logging in...'});
  }

  _requestNewEmail() {
    this.setState({processingText:'Requesting new verification email...'});
    let handleInitialReply = (response) => {
      if (response.status === 204) {
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title:'Verification Email Sent'})
      }
      else {
        return response.json();
      }
    };

    let handleProblems = (jsonResponse) => {
      // We should only get here when there is a problem with the jsonResponse status (ie. not 200).
      // Only then do we return a promise which means jsonResponse will not be undefined.
      if (jsonResponse && jsonResponse.error) {
        if (jsonResponse.error.code === "LOGIN_FAILED_EMAIL_NOT_VERIFIED") {
          Alert.alert('Cannot resend confirmation',jsonResponse.error.message,[
            {text: 'OK', onPress: () => this.setState({processing:false})}
          ])
        }
      }
    };

    let handleErrors = (err) => {
      Alert.alert("App Error", err.message, [{text:'OK', onPress: () => {
        this._resetProcessing();
      }}]);
    };

    let requestConfig = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    this.setState({processing:true});
    fetch(CLOUD_ADDRESS + "users/resendVerification?email=" + this.state.email.toLowerCase(), requestConfig)
      .then(handleInitialReply)
      .then(handleProblems)
      .catch(handleErrors)
  }

  _login() {
    let handleInitialReply = (response) => {
      console.log('initial:', response);
      return response.json();
    };

    let handleJSON = (jsonResponse) => {
      console.log("jsonresponse", jsonResponse)
      // We should only get here when there is a problem with the jsonResponse status (ie. not 200).
      // Only then do we return a promise which means jsonResponse will not be undefined.
      if (jsonResponse && jsonResponse.error) {
        if (jsonResponse.error.code === "LOGIN_FAILED_EMAIL_NOT_VERIFIED") {
          Alert.alert('Your email address has not been verified','Please click on the link in the email that was sent to you. If you did not receive an email, press Resend Email to try again.',[
            {text: 'Resend Email', onPress: () => this._requestNewEmail()},
            {text: 'OK', onPress: () => this.setState({processing:false})}
          ])
        }
        else if (jsonResponse.error.code === "LOGIN_FAILED") {
          Alert.alert('Could Not Log In','Incorrect email or password.',[
            {text: 'OK', onPress: () => this.setState({processing:false})}
          ])
        }
        else {
          Alert.alert('Login Error',jsonResponse.error.message,[
            {text: 'OK', onPress: () => this.setState({processing:false})}
          ])
        }
      }
      else if (jsonResponse && jsonResponse.userId) {
        this._processLogin(jsonResponse.id, jsonResponse.userId)
      }
    };

    let handleErrors = (err) => {
      Alert.alert("App Error", err.message, [{text:'OK', onPress: () => {
        this.setState({processing:false});
      }}]);
    };

    let requestConfig = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.state.email.toLowerCase(),
        password: this.state.password,
      })
    };

    this.setState({processing:true});
    fetch(CLOUD_ADDRESS + "users/login", requestConfig)
      .then(handleInitialReply)
      .then(handleJSON)
      .catch(handleErrors)
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
          <View style={transparent}><Text style={loginStyles.forgot}>Forgot Password?</Text></View>
          <View style={loginStyles.loginButtonContainer}>
            <TouchableOpacity onPress={this._login.bind(this)}>
              <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>Log In</Text></View>
            </TouchableOpacity>
          </View>
        </View>
        <Processing visible={this.state.processing}>
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <Text style={styles.menuText}>{this.state.processingText}</Text>
          </View>
        </Processing>
      </Background>
    )
  }
}

let transparent = {backgroundColor:'transparent'};
