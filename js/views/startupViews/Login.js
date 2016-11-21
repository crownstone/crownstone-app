import React, { Component } from 'react'
import {
  Alert,
  Image,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
let Actions = require('react-native-router-flux').Actions;
let sha1 = require('sha-1');
import { LOG, LOGDebug, LOGError }            from '../../logging/Log'
import { SessionMemory }                      from './SessionMemory'
import { emailChecker, getImageFileFromUser } from '../../util/util'
import { prepareStoreForUser }                from '../../util/dataUtil'
import { LocalizationUtil }                   from '../../native/LocalizationUtil'
import { BleActions, Bluenet }                from '../../native/Proxy'
import { CLOUD }                              from '../../cloud/cloudAPI'
import { TopBar }                             from '../components/Topbar';
import { TextEditInput }                      from '../components/editComponents/TextEditInput'
import { Background }                         from '../components/Background'
import { styles, colors , screenWidth, screenHeight } from '../styles'
import { StoreManager }                       from '../../router/store/storeManager'
import RNFS                                   from 'react-native-fs'
import loginStyles                            from './LoginStyles'

export class Login extends Component {
  constructor() {
    super();
    // this.state = {email: SessionMemory.email || 'alex@dobots.nl', password:'letmein0'};
    this.state = {email: SessionMemory.loginEmail || '', password:''};
    // this.state = {email: SessionMemory.email || 'anne@crownstone.rocks', password:'bier'};
    // this.state = {email: 'bart@almende.org', password:'12'};
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
        {text: 'Cancel'},
        {text: 'OK', onPress: () => {this.requestPasswordResetEmail()}}
      ]);
    }
  }

  requestVerificationEmail() {
    this.props.eventBus.emit('showLoading', 'Requesting new verification email...');
    CLOUD.requestVerificationEmail({email:this.state.email.toLowerCase()})
      .then(() => {
        SessionMemory.loginEmail = this.state.email;
        this.props.eventBus.emit('hideLoading');
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Verification Email Sent'});
      })
      .catch((reply) => {
        Alert.alert("Cannot Send Email", reply.data, [{text: 'OK', onPress: () => {this.props.eventBus.emit('hideLoading')}}]);
      });
  }

  requestPasswordResetEmail() {
    this.props.eventBus.emit('showLoading', 'Requesting password reset email...');
    CLOUD.requestPasswordResetEmail({email:this.state.email.toLowerCase()})
      .then(() => {
        SessionMemory.loginEmail = this.state.email;
        this.props.eventBus.emit('hideLoading');
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Reset Email Sent', passwordReset:true});
      })
      .catch((reply) => {
        let content = "Please try again.";
        let title = "Cannot Send Email";
        if (reply.data && reply.data.error) {
          if (reply.data.error.code == "EMAIL_NOT_FOUND") {
            content = "This email is not registered in the Cloud. Please register to create an account.";
            title = "Unknown Email";
          }
        }
        Alert.alert(title, content, [{text: 'OK', onPress: () => {this.props.eventBus.emit('hideLoading')}}]);
      });
  }

  attemptLogin() {
    if (this.state.email === '' || this.state.password === '') {
      Alert.alert('Almost there!','Please input your email and password.', [{text: 'OK'}]);
      return;
    }

    this.props.eventBus.emit('showLoading', 'Logging in...');
    let unverifiedEmailCallback = () => {
      Alert.alert('Your email address has not been verified', 'Please click on the link in the email that was sent to you. If you did not receive an email, press Resend Email to try again.', [
        {text: 'Resend Email', onPress: () => this.requestVerificationEmail()},
        {text: 'OK', onPress: () => {this.props.eventBus.emit('hideLoading')}}
      ]);
    };
    let invalidLoginCallback = () => {
      Alert.alert('Incorrect Email or Password.','Could not log in.',[{text: 'OK', onPress: () => {this.props.eventBus.emit('hideLoading')}}]);
    };

    CLOUD.login({
      email: this.state.email.toLowerCase(),
      password: sha1(this.state.password),
      onUnverified: unverifiedEmailCallback,
      onInvalidCredentials: invalidLoginCallback,
    })
      .then((response) => {
        return new Promise((resolve, reject) => {
        // start the login process from the store manager.
        StoreManager.userLogIn(response.userId)
          .then(() => {
            resolve(response);
          }).catch((err) => {reject(err)})
        })
      })
      .catch((err) => {
        Alert.alert(
          "Connection Problem",
          "Could not connect to the Cloud. Please check your internet connection.",
          [{text:'OK', onPress: () => { this.props.eventBus.emit('hideLoading'); }}]
        );
        return false;
      })
      .done((response) => {
        if (response === false) {return;}
        this.finalizeLogin(response.id, response.userId);
      })
  }

  _getLoginButton() {
    if (screenHeight > 480) {
      return (
        <View style={loginStyles.loginButtonContainer}>
          <TouchableOpacity onPress={this.attemptLogin.bind(this)}>
            <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>Log In</Text></View>
          </TouchableOpacity>
        </View>
      )
    }
    else {
      return (
        <View style={{
          position:'absolute',
          bottom:20,
          flex:1,
          width: screenWidth,
          flexDirection:'row',
          alignItems:'center',
          justifyContent:'center',
          backgroundColor:'transparent'
        }}>
          <TouchableOpacity onPress={this.attemptLogin.bind(this)}>
            <View style={{
              backgroundColor:'transparent',
              height: 60,
              width:  0.6*screenWidth,
              borderRadius: 30,
              borderWidth:2,
              borderColor:'white',
              alignItems:'center',
              justifyContent:'center',
              margin: (screenWidth - 2*110) / 6,
              marginBottom:0}}>
              <Text style={{
                color:'white',
                fontSize:18,
                fontWeight:'300'
              }}>Log In</Text>
            </View>
          </TouchableOpacity>
        </View>
      )
    }
  }
  render() {
    return (
      <Background hideInterface={true} image={this.props.backgrounds.mainDarkLogo}>
        <TopBar leftStyle={{color:'#fff'}} left='Back' leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true} />
        <View style={loginStyles.spacer}>
          <View style={[loginStyles.textBoxView, {width: 0.8*screenWidth}]}>
            <TextEditInput style={{width: 0.8*screenWidth, padding:10}} placeholder='email' keyboardType='email-address' autocorrect={false} autoCapitalize="none" placeholderTextColor='#888' value={this.state.email} callback={(newValue) => {this.setState({email:newValue});}} />
          </View>
          <View style={[loginStyles.textBoxView, {width: 0.8*screenWidth}]}>
            <TextEditInput style={{width: 0.8*screenWidth, padding:10}} secureTextEntry={true} placeholder='password' placeholderTextColor='#888' value={this.state.password} callback={(newValue) => {this.setState({password:newValue});}} />
          </View>
          <TouchableHighlight style={{borderRadius:20, height:40, width:screenWidth*0.6, justifyContent:'center', alignItems:'center'}} onPress={this.resetPopup.bind(this)}><Text style={loginStyles.forgot}>Forgot Password?</Text></TouchableHighlight>
          {this._getLoginButton()}
        </View>
      </Background>
    )
  }
  
  checkForRegistrationPictureUpload(userId, filename) {
    return new Promise((resolve, reject) => {
      let uploadingImage = false;
      
      let handleFiles = (files) => {
        files.forEach((file) => {
          // if the file belongs to this user, we want to upload it to the cloud.
          if (file.name === filename) {
            uploadingImage = true;
            let newPath = RNFS.DocumentDirectoryPath + '/' + userId + '.jpg';
            CLOUD.forUser(userId).uploadProfileImage(file)
              .then(() => {return RNFS.moveFile(file.path, newPath);})
              .then(() => {resolve(newPath);})
          }
        });
        if (uploadingImage === false) {
          resolve(null);
        }
      };

      // read the document dir for files that have been created during the registration process
      RNFS.readDir(RNFS.DocumentDirectoryPath)
        .then(handleFiles)
    });
  }


  downloadImage(userId) {
    let toPath = RNFS.DocumentDirectoryPath + '/' + userId + '.jpg';
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
        email:this.state.email.toLowerCase(),
        passwordHash: sha1(this.state.password),
        accessToken:accessToken,
        userId:userId,
      }
    });
    
    this.downloadSettings(store, userId);
  }
  
  downloadSettings(store, userId) {
    let parts = 1/5;

    let promises = [];

    // get more data on the user
    promises.push(
      CLOUD.getUserData()
        .then((userData) => {
          store.dispatch({type:'USER_APPEND', data:{firstName: userData.firstName,lastName: userData.lastName}});
          this.progress += parts;
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Received user data.'});
        })
    );

    // check if we need to upload a picture that has been set aside during the registration process.
    let imageFilename = getImageFileFromUser(this.state.email);
    promises.push(this.checkForRegistrationPictureUpload(userId, imageFilename)
      .then((picturePath) => {
        if (picturePath === null)
          return this.downloadImage(userId); // check if there is a picture we can download
        else
          return picturePath;
      })
      .then((picturePath) => {
        store.dispatch({type:'USER_APPEND', data:{picture: picturePath}});
        this.progress += parts;
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Handle profile picture.'});
      })
      .catch((err) => {
        // likely a 404, ignore
        LOGDebug("Could be a problem downloading profile picture: ", err);
      })
      .then(() => {
        this.progress += parts;
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Syncing with the Cloud.'});
        return CLOUD.sync(store, false);
      })
      .catch((err) => {
        Alert.alert("An error has occurred at Login", err.message, [{text:'OK'}])
      })
      .then(() => {
        this.progress += parts;
        this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Syncing with the Cloud.'});
        let state = store.getState();
        if (Object.keys(state.spheres).length == 0 && state.user.isNew === true) {
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Creating first Sphere.'});
          return CLOUD.createNewSphere(store, state.user.firstName, this.props.eventBus);
        }
        else {
          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Sphere available.'});
        }
      })
      .catch((err) => {
        LOGDebug("Error creating first Sphere.", err);
      })
    );


    Promise.all(promises).then(() => {
      this.props.eventBus.emit('updateProgress', {progress: 1, progressText:'Done'});

      // finalize the login due to successful download of data. Enables persistence.
      StoreManager.finalizeLogIn(userId);

      // start listening to the ibeacons
      LocalizationUtil.trackSpheres(store);

      // start scanning
      BleActions.isReady().then(() => {Bluenet.startScanningForCrownstonesUniqueOnly()});

      let state = store.getState();
      // set a small delay so the user sees "done"
      setTimeout(() => {
        this.props.eventBus.emit('hideProgress');
        prepareStoreForUser(store);

        if (state.user.isNew === true) {
          store.dispatch({type: 'USER_UPDATE', data:{isNew:false}});
          Actions.aiStart({type: 'reset'});
        }
        else {
          Actions.tabBar();
        }
      }, 50);
    });
  }



}

