import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;
const sha1    = require('sha-1');
const RNFS    = require('react-native-fs');
const DeviceInfo = require('react-native-device-info');

import {LOG, LOGd, LOGe, LOGi} from '../../logging/Log'
import { emailChecker, getImageFileFromUser, Util } from '../../util/Util'
import { SessionMemory }      from '../../util/SessionMemory'
import { CLOUD }              from '../../cloud/cloudAPI'
import { TextEditInput }      from '../components/editComponents/TextEditInput'
import { Background }         from '../components/Background'
import { StoreManager }       from '../../router/store/storeManager'
import loginStyles            from './LoginStyles'
import {screenWidth, screenHeight, colors, availableScreenHeight, topBarHeight} from '../styles'
import { DEBUG_MODE_ENABLED } from '../../ExternalConfig';
import { TopBar }             from "../components/Topbar";
import { Icon }               from "../components/Icon";
import { Sentry }             from "react-native-sentry";


export class Login extends Component<any, any> {
  progress : number;

  emailInputRef    = null;
  passwordInputRef = null;


  constructor(props) {
    super(props);
    this.state = {email: SessionMemory.loginEmail || '', password:'', passwordSecureDisplay: true};
    this.progress = 0;
  }

  resetPopup() {
    if (emailChecker(this.state.email) === false) {
      Alert.alert('Check Email Address','Please input a valid email address in the form and press the Forgot Password button again.',[
        {text: 'OK'}
      ]);
    }
    else {
      Alert.alert('Send Password Reset Email','Would you like us to send an email to reset your password to: ' + this.state.email.toLowerCase() + '?',[
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => { this.requestPasswordResetEmail(); }}
      ]);
    }
  }

  requestVerificationEmail() {
    this.props.eventBus.emit('showLoading', 'Requesting new verification email...');
    CLOUD.requestVerificationEmail({email:this.state.email.toLowerCase()})
      .then(() => {
        SessionMemory.loginEmail = this.state.email.toLowerCase();
        this.props.eventBus.emit('hideLoading');
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Verification Email Sent'});
      })
      .catch((reply) => {
        let defaultAction = () => {this.props.eventBus.emit('hideLoading')};
        Alert.alert("Cannot Send Email", reply.data, [{text: 'OK', onPress: defaultAction}], { onDismiss: defaultAction });
      });
  }

  requestPasswordResetEmail() {
    this.props.eventBus.emit('showLoading', 'Requesting password reset email...');
    CLOUD.requestPasswordResetEmail({email:this.state.email.toLowerCase()})
      .then(() => {
        SessionMemory.loginEmail = this.state.email.toLowerCase();
        this.props.eventBus.emit('hideLoading');
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Reset Email Sent', passwordReset:true});
      })
      .catch((reply) => {
        let content = "Please try again.";
        let title = "Cannot Send Email";
        let validationLink = false;
        if (reply.data && reply.data.error) {
          if (reply.data.error.code == "EMAIL_NOT_FOUND") {
            content = "This email is not registered in the Cloud. Please register to create an account.";
            title = "Unknown Email";
          }
          else if (reply.data.error.code == 'RESET_FAILED_EMAIL_NOT_VERIFIED') {
            validationLink = true;
          }
        }
        let defaultAction = () => {this.props.eventBus.emit('hideLoading')};

        if (validationLink) {
          Alert.alert(
            'Your email address has not been verified.',
            'Please click on the link in the email that was sent to you. If you did not receive an email, press Resend Email to try again.', [
            {text: 'Resend Email', style:'cancel', onPress: () => this.requestVerificationEmail()},
            {text: 'OK', onPress: defaultAction}
          ], { onDismiss: defaultAction });
        }
        else {
          Alert.alert(title, content, [{text: 'OK', onPress: defaultAction}], {onDismiss: defaultAction});
        }
      });
  }

  attemptLogin() {
    if (this.state.email === '' || this.state.password === '') {
      Alert.alert('Almost there!','Please input your email and password.', [{text: 'OK'}]);
      return;
    }

    this.props.eventBus.emit('showLoading', 'Logging in...');
    let defaultAction = () => {this.props.eventBus.emit('hideLoading')};
    let unverifiedEmailCallback = () => {
      Alert.alert('Your email address has not been verified', 'Please click on the link in the email that was sent to you. If you did not receive an email, press Resend Email to try again.', [
        {text: 'Resend Email', onPress: () => this.requestVerificationEmail()},
        {text: 'OK', onPress: defaultAction}
      ],
      { onDismiss: defaultAction });
    };
    let invalidLoginCallback = () => {
      Alert.alert('Incorrect Email or Password.','Could not log in.',[{text: 'OK', onPress: defaultAction}], { onDismiss: defaultAction });
    };

    CLOUD.login({
      email: this.state.email.toLowerCase(),
      password: sha1(this.state.password),
      onUnverified: unverifiedEmailCallback,
      onInvalidCredentials: invalidLoginCallback,
    })
      .catch((err) => {
        let handledError = false;
        if (err.data && err.data.error && err.data.error.code) {
          switch (err.data.error.code) {
            case 'LOGIN_FAILED_EMAIL_NOT_VERIFIED':
              handledError = true;
              unverifiedEmailCallback();
              break;
            case 'LOGIN_FAILED':
              handledError = true;
              invalidLoginCallback();
              break;
          }
        }

        if (handledError === false) {
          // do not show a popup if it is a failed request: this has its own pop up
          if (err.message && err.message === 'Network request failed') {
            this.props.eventBus.emit('hideLoading');
          }
          else {
            let defaultAction = () => {
              this.props.eventBus.emit('hideLoading')
            };
            Alert.alert(
              "Connection Problem",
              "Could not connect to the Cloud. Please check your internet connection.",
              [{text: 'OK', onPress: defaultAction}],
              {onDismiss: defaultAction}
            );
          }
        }
        throw err;
      })
      .then((response) => {
        return new Promise((resolve, reject) => {
          // start the login process from the store manager.
          StoreManager.userLogIn(response.userId)
            .then(() => {
              resolve(response);
            })
            .catch((err) => {reject(err)})
        })
      })
      .then((response) => {
        this.finalizeLogin(response.id, response.userId);
      })
      .catch((err) => { LOGe.info("Error during login.", err); })
  }

  render() {
    let factor = 0.25;
    if (screenHeight < 500) {
      factor = 0.15
    }
    return (
      <Background fullScreen={true} image={this.props.backgrounds.mainDark} shadedStatusBar={true} safeView={true}>
        <TopBar leftStyle={{color:'#fff'}} left={Platform.OS === 'android' ? null : 'Back'} leftAction={() => {Actions.loginSplash({type:'reset'})}} style={{backgroundColor:'transparent', paddingTop:0}} />
        <ScrollView keyboardShouldPersistTaps="never" style={{width: screenWidth, height:screenHeight - topBarHeight}}>
          <View style={{flexDirection:'column', alignItems:'center', justifyContent: 'center', height: screenHeight - topBarHeight, width: screenWidth}}>
            <View style={{flex:2, width:screenWidth}} />
            <Image source={require('../../images/crownstoneLogoWithText.png')} style={{width:factor * 998, height: factor*606}}/>
            <View style={{flex:3, width:screenWidth}} />
            <View style={[loginStyles.textBoxView, {width: 0.8*screenWidth}]}>
              <TextEditInput
                ref={(input) => { this.emailInputRef = input; }}
                style={{width: 0.8*screenWidth, padding:10}}
                placeholder='email'
                keyboardType='email-address'
                autocorrect={false}
                autoCapitalize="none"
                placeholderTextColor='#888'
                value={this.state.email}
                callback={(newValue) => { this.setState({email:newValue});}}
                endCallback={() => { this.passwordInputRef.focus() }}
              />
            </View>
            <View style={{height:10, width:screenWidth}} />
            <View style={[loginStyles.textBoxView, {width: 0.8*screenWidth}]}>
              <TextEditInput
                ref={(input) => { this.passwordInputRef = input; }}
                style={{width: 0.8*screenWidth, padding:10}}
                secureTextEntry={Platform.OS === 'android' ? true : this.state.passwordSecureDisplay  }
                visiblePassword={Platform.OS === 'android' ? !this.state.passwordSecureDisplay : false }
                placeholder='password'
                placeholderTextColor='#888'
                autoCorrect={false}
                value={this.state.password}
                callback={(newValue) => { this.setState({password:newValue});}}
              />
              <TouchableOpacity style={{position:'absolute', top:0, right: 0, height:40, width: 40, alignItems:'center', justifyContent: 'center'}} onPress={() => { this.setState({passwordSecureDisplay: !this.state.passwordSecureDisplay })}}>
                <Icon name={'md-eye'} color={Platform.OS === 'ios' ? (this.state.passwordSecureDisplay ? colors.lightGray2.hex : colors.darkGray2.hex) : colors.lightGray2.hex} size={20} />
              </TouchableOpacity>
            </View>
            <TouchableHighlight style={{borderRadius:20, height:50, width:screenWidth*0.6, paddingBottom: 10, justifyContent:'center', alignItems:'center'}} onPress={this.resetPopup.bind(this)}>
              <Text style={{color: '#93cfff'}}>Forgot Password?</Text>
            </TouchableHighlight>
            <LoginButton loginCallback={() => {this.attemptLogin()}} />
            <View style={{flex: 1, width:screenWidth, minHeight:30}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
  
  checkForRegistrationPictureUpload(userId, filename) {
    LOGi.info("Login: checkForRegistrationPictureUpload", userId, filename);
    return new Promise((resolve, reject) => {
      let uploadingImage = false;
      
      let handleFiles = (files) => {
        files.forEach((file) => {
          LOGi.info("Login: check file", file);
          // if the file belongs to this user, we want to upload it to the cloud.
          if (file.name === filename) {
            uploadingImage = true;
            let newPath = Util.getPath(userId + '.jpg');
            LOGi.info("Login: new path", newPath);
            CLOUD.forUser(userId).uploadProfileImage(file.path)
              .then(() => {
                LOGi.info("Login: uploadedImage. Now start moving.");
                return RNFS.moveFile(file.path, newPath);
              })
              .then(() => {
                LOGi.info("Login: moved image.");
                resolve(newPath);
              })
              .catch((err) => {
                LOGe.info("Login: failed checkForRegistrationPictureUpload", err);
                reject(err);
              })
          }
        });
        if (uploadingImage === false) {
          resolve(null);
        }
      };

      // read the document dir for files that have been created during the registration process
      RNFS.readDir(Util.getPath())
        .then(handleFiles)
    });
  }


  downloadImage(userId) {
    let toPath = Util.getPath(userId + '.jpg');
    return CLOUD.forUser(userId).downloadProfileImage(toPath);
  }

  finalizeLogin(accessToken, userId) {
    this.progress = 0;
    this.props.eventBus.emit('showProgress', {progress: 0, progressText:'Getting user data.'});

    // give the access token and the userId to the cloud api 
    CLOUD.setAccess(accessToken);
    CLOUD.setUserId(userId);

    // load the user into the database
    const store = this.props.store;
    store.dispatch({
      type:'USER_LOG_IN',
      data:{
        email:        this.state.email.toLowerCase(),
        passwordHash: sha1(this.state.password),
        accessToken:  accessToken,
        userId:       userId,
      }
    });
    
    this.downloadSettings(store, userId);
  }
  
  downloadSettings(store, userId) {
    let parts = 1/5;

    let promises = [];

    // get more data on the user
    promises.push(
      CLOUD.forUser(userId).getUserData()
        .then((userData) => {
          store.dispatch({type:'USER_APPEND', data:{
            firstName: userData.firstName,
            lastName: userData.lastName,
            isNew: userData.new,
            updatedAt : userData.updatedAt
          }});
          this.progress += parts;
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Received user data.'});
        })
    );

    Sentry.captureBreadcrumb({
      category: 'login',
      data: {
        state: 'downloading settings'
      }
    });

    // check if we need to upload a picture that has been set aside during the registration process.
    let imageFilename = getImageFileFromUser(this.state.email.toLowerCase());
    promises.push(this.checkForRegistrationPictureUpload(userId, imageFilename)
      .then((picturePath) => {
        LOG.info("Login: step 1");
        if (picturePath === null) {
          LOG.info("Login: step 1, downloading..");
          return this.downloadImage(userId); // check if there is a picture we can download
        }
        else {
          return picturePath;
        }
      })
      .then((picturePath) => {
        LOG.info("Login: step 2");
        store.dispatch({type:'USER_APPEND', data:{picture: picturePath}});
        this.progress += parts;
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Handle profile picture.'});
      })
      .catch((err) => {
        // likely a 404, ignore
        LOGd.info("Could be a problem downloading profile picture: ", err);
      })
      .then(() => {
        LOG.info("Login: step 3");
        this.progress += parts;
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Syncing with the Cloud.'});
        return CLOUD.sync(store, false);
      })
      .then(() => {
        LOG.info("Login: step 4");
        this.progress += parts;
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Syncing with the Cloud.'});
        let state = store.getState();
        if (Object.keys(state.spheres).length == 0 && state.user.isNew !== false) {
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Creating first Sphere.'});
          return CLOUD.createNewSphere(store, state.user.firstName + "'s Sphere", this.props.eventBus);
        }
        else {
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Sphere available.'});
        }
      })
      .catch((err) => {
        LOGe.info("Login: Failed to login.", err);
        let defaultAction = () => {this.props.eventBus.emit('hideProgress')};
        Alert.alert("Whoops!", "An error has occurred while syncing with the Cloud. Please try again later.", [{text:'OK', onPress: defaultAction}], { onDismiss: defaultAction});


        if (DEBUG_MODE_ENABLED) {
          let stringifiedError = '' + JSON.stringify(err);
          Alert.alert("DEBUG: err:", stringifiedError, [{text:'OK'}]);
        }

        throw err;
      })
    );


    Promise.all(promises)
      .then(() => {

        Sentry.captureBreadcrumb({
          category: 'login',
          data: {
            state:'finished'
          }
        });

        LOG.info("Login: finished promises");
        this.props.eventBus.emit('updateProgress', {progress: 1, progressText:'Done'});

        // finalize the login due to successful download of data. Enables persistence.
        StoreManager.finalizeLogIn(userId).catch(() => {});

        let state = store.getState();
        if (state.user.isNew !== false) {
          // new users do not need to see the "THIS IS WHATS NEW" popup.
          this.props.store.dispatch({
            type: "UPDATE_APP_SETTINGS",
            data: {shownWhatsNewVersion: DeviceInfo.getReadableVersion()}
          });
        }

        // this starts scanning, tracking spheres and prepping the database for the user
        this.props.eventBus.emit("userLoggedIn");

        // set a small delay so the user sees "done"
        setTimeout(() => {
          state = store.getState();
          this.props.eventBus.emit('hideProgress');

          if (state.user.isNew !== false) {
            Actions.tutorial({type: 'reset'});
          }
          else if (Platform.OS === 'android') {
            this.props.eventBus.emit("userLoggedInFinished");
            Actions.drawer({type: 'reset'});
          }
          else {
            this.props.eventBus.emit("userLoggedInFinished");
            Actions.tabBar({type: 'reset'});
          }
        }, 100);
      })
      .catch((err) => {
        LOGe.info("Login: ERROR during login.", err);
        this.props.eventBus.emit('hideProgress');
      });
  }
}



class LoginButton extends Component<any, any> {
  render() {
    if (screenHeight > 500) {
      return (
        <View style={{flex:1, minHeight: 130}}>
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => { this.props.loginCallback() }}>
            <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>Log In</Text></View>
          </TouchableOpacity>
          <View style={{flex:1.5}} />
        </View>
      )
    }
    else {
      return (
        <View style={{flex:1}}>
          <View style={{flex:1}} />
          <TouchableOpacity style={{height:60, width: 0.6*screenWidth}} onPress={() => { this.props.loginCallback() }}>
            <View style={{
              backgroundColor:'transparent',
              height: 60,
              width:  0.6*screenWidth,
              borderRadius: 30,
              borderWidth:2,
              borderColor:'white',
              alignItems:'center',
              justifyContent:'center',
            }}>
              <Text style={{
                color:'white',
                fontSize:18,
                fontWeight:'bold'
              }}>Log In</Text>
            </View>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      )
    }
  }
}

