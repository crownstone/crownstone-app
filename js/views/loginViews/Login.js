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

import { validateEmail, getImageFileFromUser } from '../../util/util'
import { CLOUD } from '../../cloud/cloudAPI'
import { TopBar } from '../components/Topbar';
import { Processing } from '../components/Processing'
import { TextEditInput } from '../components/editComponents/TextEditInput'
import { Background } from '../components/Background'
import RNFS from 'react-native-fs'
import loginStyles from './LoginStyles'



export class Login extends Component {
  constructor() {
    super();
    // this.state = {email:'alex@dobots.nl', password:'letmein0', processing:false, processingText:'Logging in...'};
    this.state = {email:'alexdemulder@gmail.com', password:'letmein0', processing:false, processingText:'Logging in...', progress:undefined, progressText:undefined, progressAmount:0};
    this.closePopupCallback = () => {this.setState({processing:false})};
  }

  resetPopup() {
    if (validateEmail(this.state.email) === false) {
      Alert.alert('Check Email Address','Please input a valid email address in the form and press the Forgot Password button again.',[
        {text: 'OK'}
      ]);
    }
    else {
      Alert.alert('Send Password Reset Email','Would you like us to send an email to reset your password to: ' + this.state.email.toLowerCase() + '?',[
        {text: 'Cancel'},
        {text: 'OK',     onPress: () => {this.requestPasswordResetEmail()}}
      ]);
    }
  }

  requestVerificationEmail() {
    this.setState({processing:true, processingText:'Requesting new verification email...'});
    let successCallback = () => { Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Verification Email Sent'}) };
    CLOUD.requestVerificationEmail(this.state.email.toLowerCase(), successCallback, this.closePopupCallback);
  }

  requestPasswordResetEmail() {
    this.setState({processing:true, processingText:'Requesting password reset email...'});
    let successCallback = () => {Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase(), title: 'Reset Email Sent', passwordReset:true})};
    CLOUD.requestPasswordResetEmail(this.state.email.toLowerCase(), successCallback, this.closePopupCallback);
  }

  attemptLogin() {
    this.setState({processing:true, processingText:'Logging in...'});
    let successCallback = (response) => {this.finalizeLogin(response.id, response.userId)};
    let unverifiedEmailCallback = () => {
      Alert.alert('Your email address has not been verified', 'Please click on the link in the email that was sent to you. If you did not receive an email, press Resend Email to try again.', [
        {text: 'Resend Email', onPress: () => this.requestVerificationEmail()},
        {text: 'OK', onPress: this.closePopupCallback}
      ]);
    };
    let invalidLoginCallback = () => {
      Alert.alert('Incorrect Email or Password.','Could not log in.',[{text: 'OK', onPress: this.closePopupCallback}]);
    };
    CLOUD.login(
      this.state.email.toLowerCase(),
      this.state.password,
      successCallback,
      unverifiedEmailCallback,
      invalidLoginCallback,
      this.closePopupCallback
    );
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
          <TouchableHighlight style={{borderRadius:20, height:40, width:width*0.6, justifyContent:'center', alignItems:'center'}} onPress={this.resetPopup.bind(this)}><Text style={loginStyles.forgot}>Forgot Password?</Text></TouchableHighlight>
          <View style={loginStyles.loginButtonContainer}>
            <TouchableOpacity onPress={this.attemptLogin.bind(this)}>
              <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>Log In</Text></View>
            </TouchableOpacity>
          </View>
        </View>
        <Processing visible={this.state.processing} text={this.state.processingText} progress={this.state.progress} progressText={this.state.progressText} />
      </Background>
    )
  }
  
  checkForRegistrationPictureUpload(userId) {
    return new Promise((resolve, reject) => {
      let uploadingImage = false;
      
      let handleFiles = (files) => {
        files.forEach((file) => {
          // if the file belongs to this user, we want to upload it to the cloud.
          if (file.name === getImageFileFromUser(this.state.email)) {
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
    this.setState({progress: 0, progressText:'Getting user data.'});

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
        userId:userId
      }
    });
    
    this.downloadSettings(store, userId);
  }
  
  downloadSettings(store, userId) {
    // get more data on the user
    let userData = CLOUD.getUserData()
      .then((userData) => {
        store.dispatch({type:'USER_APPEND', data:{firstName: userData.firstName,lastName: userData.lastName}});
        this.setState({progress: this.state.progress + 1/3, progressText:'Received user data.'});
      });

    // check if we need to upload a picture that has been set aside during the registration process.
    let picture = this.checkForRegistrationPictureUpload(userId)
      .then((picturePath) => {
        if (picturePath !== null)
          return this.downloadImage(userId); // check if there is a picture we can download
        else
          return picturePath;
      })
      .then((picturePath) => {
        store.dispatch({type:'USER_APPEND', data:{picture: picturePath}});
        this.setState({progress: this.state.progress + 1/3, progressText:'Updated user profile picture.'});
      });
    
    let groupUpdate = CLOUD.getGroups().then((groupData) => {
      console.log(groupData)
      this.setState({progress: this.state.progress + 1/3, progressText:'Received group data.'});
    });

    Promise.all([userData, picture, groupUpdate]).then(() => {
      this.setState({progress: 1, progressText:'Done'});

      const state = store.getState();
      this.activeGroup = state.app.activeGroup;
      if (state.app.doFirstTimeSetup === true && Object.keys(state.groups).length === 0) {
        Actions.setupWelcome();
      }
      else {
        Actions.tabBar();
      }
    });
  }
}

