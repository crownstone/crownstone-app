
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Login", key)(a,b,c,d,e);
}
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
import { FileUtil } from "../../util/FileUtil";


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
      Alert.alert(
        lang("_Check_Email_Address__Ple_header"),
        lang("_Check_Email_Address__Ple_body"),
        [{text: lang("_Check_Email_Address__Ple_left")}
      ]);
    }
    else {
      Alert.alert(
        lang("_Send_Password_Reset_Emai_header"),
        lang("_Send_Password_Reset_Emai_body",this.state.email.toLowerCase()),
        [
          {text: lang("_Send_Password_Reset_Emai_left"),  style: 'cancel'},
          {text: lang("_Send_Password_Reset_Emai_right"), onPress: () => { this.requestPasswordResetEmail(); }}
        ]
      );
    }
  }

  requestVerificationEmail() {
    this.props.eventBus.emit('showLoading', 'Requesting new verification email...');
    CLOUD.requestVerificationEmail({email:this.state.email.toLowerCase()})
      .then(() => {
        SessionMemory.loginEmail = this.state.email.toLowerCase();
        this.props.eventBus.emit('hideLoading');
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: lang("Verification_Email_Sent")});
      })
      .catch((reply) => {
        let defaultAction = () => {this.props.eventBus.emit('hideLoading')};
        Alert.alert(
lang("_Cannot_Send_Email_argume_header"),
lang("_Cannot_Send_Email_argume_body",reply.data),
[{text: lang("_Cannot_Send_Email_argume_left"), onPress: defaultAction}], { onDismiss: defaultAction });
      });
  }

  requestPasswordResetEmail() {
    this.props.eventBus.emit('showLoading', 'Requesting password reset email...');
    CLOUD.requestPasswordResetEmail({email:this.state.email.toLowerCase()})
      .then(() => {
        SessionMemory.loginEmail = this.state.email.toLowerCase();
        this.props.eventBus.emit('hideLoading');
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: lang("Reset_Email_Sent"), passwordReset:true});
      })
      .catch((reply) => {
        let content = "Please try again.";
        let title =  lang("Cannot_Send_Email");
        let validationLink = false;
        if (reply.data && reply.data.error) {
          if (reply.data.error.code == "EMAIL_NOT_FOUND") {
            content = "This email is not registered in the Cloud. Please register to create an account.";
            title =  lang("Unknown_Email");
          }
          else if (reply.data.error.code == 'RESET_FAILED_EMAIL_NOT_VERIFIED') {
            validationLink = true;
          }
        }
        let defaultAction = () => {this.props.eventBus.emit('hideLoading')};

        if (validationLink) {
          Alert.alert(
lang("_Your_email_address_has_n_header"),
lang("_Your_email_address_has_n_body"),
[{text: lang("_Your_email_address_has_n_left"), style:'cancel', onPress: () => this.requestVerificationEmail()},
            {
text: lang("_Your_email_address_has_n_right"), onPress: defaultAction}
          ], { onDismiss: defaultAction });
        }
        else {
          Alert.alert(
lang("arguments___arguments___O_header",title),
lang("arguments___arguments___O_body",content),
[{text: lang("arguments___arguments___O_left"), onPress: defaultAction}], {onDismiss: defaultAction});
        }
      });
  }

  attemptLogin() {
    if (this.state.email === '' || this.state.password === '') {
      Alert.alert(
lang("_Almost_there___Please_in_header"),
lang("_Almost_there___Please_in_body"),
[{text: lang("_Almost_there___Please_in_left")}]);
      return;
    }

    this.props.eventBus.emit('showLoading', lang("Logging_in___"));
    let defaultAction = () => {this.props.eventBus.emit('hideLoading')};
    let unverifiedEmailCallback = () => {
      Alert.alert(
lang("_Your_email_address_has_no_header"),
lang("_Your_email_address_has_no_body"),
[{text: lang("_Your_email_address_has_no_left"), onPress: () => this.requestVerificationEmail()},
        {
text: lang("_Your_email_address_has_no_right"), onPress: defaultAction}
      ],
      { onDismiss: defaultAction });
    };
    let invalidLoginCallback = () => {
      Alert.alert(
lang("_Incorrect_Email_or_Passw_header"),
lang("_Incorrect_Email_or_Passw_body"),
[{text: lang("_Incorrect_Email_or_Passw_left"), onPress: defaultAction}], { onDismiss: defaultAction });
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
              lang("_Connection_Problem__Coul_header"),
              lang("_Connection_Problem__Coul_body"),
              [{text: lang("_Connection_Problem__Coul_left"), onPress: defaultAction}],
              {onDismiss: defaultAction}
            );
          }
        }
        throw err;
      })
      .then((response) => {
        // console.log("This is the reponse from the cloud", response);
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
        // console.log("This is the reponse from the SM", response);
        this.finalizeLogin(response.id, response.userId);
      })
      .catch((err) => { LOGe.info("Error during login.", err); })
  }

  render() {
    let factor = 0.24;
    if (screenHeight < 500) {
      factor = 0.15
    }
    return (
      <Background fullScreen={true} image={this.props.backgrounds.mainDark} shadedStatusBar={true} safeView={true}>
        <TopBar leftStyle={{color:'#fff'}} left={Platform.OS === 'android' ? null : lang("Back")} leftAction={() => {Actions.loginSplash({type:'reset'})}} style={{backgroundColor:'transparent', paddingTop:0}} />
        <ScrollView keyboardShouldPersistTaps="never" style={{width: screenWidth, height:screenHeight - topBarHeight}}>
          <View style={{flexDirection:'column', alignItems:'center', justifyContent: 'center', height: screenHeight - topBarHeight, width: screenWidth}}>
            <View style={{flex:2, width:screenWidth}} />
            <Image source={require('../../images/crownstoneLogoWithText.png')} style={{width:factor * 998, height: factor*606}}/>
            <View style={{flex:3, width:screenWidth}} />
            <View style={[loginStyles.textBoxView, {width: 0.8*screenWidth}]}>
              <TextEditInput
                ref={(input) => { this.emailInputRef = input; }}
                style={{width: 0.8*screenWidth, padding:10}}
                placeholder={lang("emailemail_address")}
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
                placeholder={lang("password____")}
                placeholderTextColor='#888'
                autoCorrect={false}
                value={this.state.password}
                callback={(newValue) => { this.setState({password:newValue});}}
              />
              <TouchableOpacity style={{position:'absolute', top:0, right: 0, height:40, width: 40, alignItems:'center', justifyContent: 'center'}} onPress={() => { this.setState({passwordSecureDisplay: !this.state.passwordSecureDisplay })}}>
                <Icon name={'md-eye'} color={Platform.OS === 'ios' ? (this.state.passwordSecureDisplay ? colors.lightGray2.hex : colors.darkGray2.hex) : colors.lightGray2.hex} size={20} />
              </TouchableOpacity>
            </View>
            <TouchableHighlight style={{borderRadius:20, height:40, width:screenWidth*0.6, justifyContent:'center', alignItems:'center'}} onPress={this.resetPopup.bind(this)}>
            <Text style={{color: '#93cfff'}}>{ lang("Forgot_Password_") }</Text></TouchableHighlight>
            <LoginButton loginCallback={() => {this.attemptLogin()}} />
            <View style={{flex: 1, width:screenWidth, minHeight:30}} />
          </View>
        </ScrollView>
      </Background>
    );
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
            let newPath = FileUtil.getPath(userId + '.jpg');
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
      RNFS.readDir(FileUtil.getPath())
        .then(handleFiles)
    });
  }


  downloadImage(userId) {
    let toPath = FileUtil.getPath(userId + '.jpg');
    return CLOUD.forUser(userId).downloadProfileImage(toPath);
  }

  finalizeLogin(accessToken, userId) {
    this.progress = 0;
    this.props.eventBus.emit('showProgress', {progress: 0, progressText: lang("Getting_user_data_")});

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
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText: lang("Received_user_data_")});
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
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText: lang("Handle_profile_picture_")});
      })
      .catch((err) => {
        // likely a 404, ignore
        LOGd.info("Could be a problem downloading profile picture: ", err);
      })
      .then(() => {
        LOG.info("Login: step 3");
        this.progress += parts;
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText: lang("Syncing_with_the_Cloud_")});
        return CLOUD.sync(store, false);
      })
      .then(() => {
        LOG.info("Login: step 4");
        this.progress += parts;
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText: lang("Syncing_with_the_Cloud_")});
        let state = store.getState();
        if (Object.keys(state.spheres).length == 0 && state.user.isNew !== false) {
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText: lang("Creating_first_Sphere_")});
          return CLOUD.createNewSphere(store, state.user.firstName + "'s Sphere", this.props.eventBus);
        }
        else {
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText: lang("Sphere_available_")});
        }
      })
      .catch((err) => {
        LOGe.info("Login: Failed to login.", err);
        let defaultAction = () => {this.props.eventBus.emit('hideProgress')};
        Alert.alert(
lang("_Whoops___An_error_has_oc_header"),
lang("_Whoops___An_error_has_oc_body"),
[{text:lang("_Whoops___An_error_has_oc_left"), onPress: defaultAction}], { onDismiss: defaultAction});


        if (DEBUG_MODE_ENABLED) {
          let stringifiedError = '' + JSON.stringify(err);
          Alert.alert(
lang("_DEBUG__err__arguments____header"),
lang("_DEBUG__err__arguments____body",stringifiedError),
[{text:lang("_DEBUG__err__arguments____left")}]);
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
        this.props.eventBus.emit('updateProgress', {progress: 1, progressText: lang("Done")});

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
          else {
            this.props.eventBus.emit("userLoggedInFinished");
            if (Platform.OS === 'android') { Actions.drawer({type: 'reset'}); }
            else                           { Actions.tabBar({type: 'reset'}); }
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
            <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>{ lang("Log_In") }</Text></View>
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
              }}>{ lang("Log_In") }</Text>
            </View>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      )
    }
  }
}

