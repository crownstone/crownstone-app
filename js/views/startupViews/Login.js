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
var Actions = require('react-native-router-flux').Actions;

import { emailChecker, getImageFileFromUser } from '../../util/util'
import { CLOUD } from '../../cloud/cloudAPI'
import { TopBar } from '../components/Topbar';
import { TextEditInput } from '../components/editComponents/TextEditInput'
import { Background } from '../components/Background'
import { styles, colors , width, height, pxRatio } from '../styles'
import RNFS from 'react-native-fs'
import loginStyles from './LoginStyles'

export class Login extends Component {
  constructor() {
    super();
    this.state = {email:'alex@dobots.nl', password:'letmein0'};
    this.progress = 0;
    // this.state = {email:'', password:''};
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
        this.props.eventBus.emit('hideLoading');
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Reset Email Sent', passwordReset:true});
      })
      .catch((reply) => {
        Alert.alert("Cannot Send Email", reply.data, [{text: 'OK', onPress: () => {this.props.eventBus.emit('hideLoading')}}]);
      });
  }

  attemptLogin() {
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
      password: this.state.password,
      onUnverified: unverifiedEmailCallback,
      onInvalidCredentials: invalidLoginCallback,
    }).then((response) => {this.finalizeLogin(response.id, response.userId);})
  }

  render() {
    return (
      <Background hideInterface={true} background={require('../../images/loginBackground.png')}>
        <TopBar left='Back' leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true} />
        <View style={loginStyles.spacer}>
          <View style={[loginStyles.textBoxView, {width: 0.8*width}]}>
            <TextEditInput style={{flex:1, padding:10}} placeholder='email' placeholderTextColor='#888' value={this.state.email} callback={(newValue) => {this.setState({email:newValue});}} />
          </View>
          <View style={[loginStyles.textBoxView, {width: 0.8*width}]}>
            <TextEditInput style={{flex:1, padding:10}} secureTextEntry={true} placeholder='password' placeholderTextColor='#888' value={this.state.password} callback={(newValue) => {this.setState({password:newValue});}} />
          </View>
          <TouchableHighlight style={{borderRadius:20, height:40, width:width*0.6, justifyContent:'center', alignItems:'center'}} onPress={this.resetPopup.bind(this)}><Text style={loginStyles.forgot}>Forgot Password?</Text></TouchableHighlight>
          <View style={loginStyles.loginButtonContainer}>
            <TouchableOpacity onPress={this.attemptLogin.bind(this)}>
              <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>Log In</Text></View>
            </TouchableOpacity>
          </View>
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
    console.log("here", toPath)
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


    // sync groups
    promises.push(
      CLOUD.getGroups()
        .then((groupData) => {
          this.progress += parts;
          let groupDataPromises = [];
          groupData.forEach((group) => {
            // add the group to the local db
            store.dispatch({type:'ADD_GROUP', groupId: group.id, data:{name: group.name, iBeaconUUID: group.uuid}});

            // sync all the data from the group to the phone
            groupDataPromises.push(CLOUD.forGroup(group.id).syncGroup({}, userId).then((result) => {
              // load all data in the database
              result.locations.forEach((location) => {
                store.dispatch({type:'ADD_LOCATION', groupId: group.id, locationId: location.id, data:{name: location.name, icon: location.icon}});
              });
              Object.keys(result.admins).forEach((userId) => {
                let user = result.admins[userId];
                console.log("USER",user)
                store.dispatch({type: 'ADD_USER', groupId: group.id, userId: user.id, data:{picture: user.picture, firstName: user.firstName, lastName: user.lastName, email: user.email, emailVerified: user.emailVerified, accessLevel: 'admin'}});
              });
              Object.keys(result.members).forEach((userId) => {
                let user = result.members[userId];
                store.dispatch({type: 'ADD_USER', groupId: group.id, userId: user.id, data:{picture: user.picture, firstName: user.firstName, lastName: user.lastName, email: user.email, emailVerified: user.emailVerified, accessLevel: 'member'}});
              });
              Object.keys(result.guests).forEach((userId) => {
                let user = result.guests[userId];
                store.dispatch({type: 'ADD_USER', groupId: group.id, userId: user.id, data:{picture: user.picture, firstName: user.firstName, lastName: user.lastName, email: user.email, emailVerified: user.emailVerified, accessLevel: 'guest'}});
              });
            }));
          });

          this.props.eventBus.emit('updateProgress', {progress: this.progress, progressText:'Receiving group data.'});

          return Promise.all(groupDataPromises);
        })
    );



    // check if we need to upload a picture that has been set aside during the registration process.
    let imageFilename = getImageFileFromUser(this.state.email);
    promises.push(
      this.checkForRegistrationPictureUpload(userId, imageFilename)
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
    );
    

    Promise.all(promises).then(() => {
      this.props.eventBus.emit('updateProgress', {progress: 1, progressText:'Done'});

      // small delay so the user sees "done"
      setTimeout(() => {
        this.props.eventBus.emit('hideProgress');

        const state = store.getState();
        this.activeGroup = state.app.activeGroup;

        if (state.app.doFirstTimeSetup === true && Object.keys(state.groups).length === 0) {
          Actions.setupWelcome();
        }
        else {
          if (state.app.doFirstTimeSetup === true) {
             store.dispatch({type:'UPDATE_APP_STATE', data: {doFirstTimeSetup: false}})
          }
          Actions.tabBar();
        }
      }, 50);
    });
  }
}

