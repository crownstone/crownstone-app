import React, {
  Alert,
  Component,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { CLOUD } from '../../util/cloud'

import { validateEmail, getImageFileFromUser } from '../../util/util'
import { PictureOptions } from '../components/PictureOptions'
import { Processing } from '../components/Processing'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from '../styles'
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs'

// these will inform the user of possible issues with the passwords.
let passwordStateNeutral = 'Your password must be at least 8 characters long, one of which being a number.';
let passwordStateNumber = 'Your password must contain at least one number.';
let passwordStateCharacter = 'Your password must contain at least one letter.';
let passwordStateConflict = 'Passwords do not match.';

export class Register extends Component {
  constructor() {
    super();
    this.state = {
      email: {value: '', state: ''},
      password: {value: '', state: ''},
      passwordVerification: {value: '', state: ''},
      passwordExplanation: passwordStateNeutral,
      firstName: {value: '', state: ''},
      lastName: {value: '', state: ''},
      picture: undefined,
      processing: false,
    };

    this.characterChecker = /[\D]/g;
    this.numberChecker = /[0-9]/g;
  }

  /**
   * Check if the email address is valid
   * @param email
   * @returns {*}
   */
  getEmailState(email)  {
    if (validateEmail(email)) {
      return 'valid';
    }
    return 'error';
  }


  /**
   * Check if the passwords are valid
   * @param password
   * @param index
   * @returns {*}
   */
  getPasswordState(password,index) {
    let setText = (text) => {
      if (this.state.passwordExplanation !== text) {
        this.setState({passwordExplanation:text});
      }
    };

    if (password.length >= 8) {
      if (index === 1) {
        // check if number requirement is met
        if (this.numberChecker.test(password) === false) {
          setText(passwordStateNumber);
          return 'error';
        }
        // check if there is at least one letter
        else if (this.characterChecker.test(password) === false) {
          setText(passwordStateCharacter);
          return 'error';
        }
      }
      else {
        // check if the verification matches the
        if (password !== this.state.password.value) {
          setText(passwordStateConflict);
          return 'error';
        }
      }
      setText(passwordStateNeutral);
      return 'valid';
    }
    else {
      setText(passwordStateNeutral);
      return 'error';
    }
  }


  /**
   * Check if the first and last name are valid
   * @param name
   * @returns {*}
   */
  getNameState(name) {
    if (name.length >= 3 && this.numberChecker.test(name) === false) {
      return 'valid';
    }
    return 'error';
  }


  /**
   * get the form items
   * @returns {*[]}
   */
  getItems() {
    return [
      {
        label: 'ACCOUNT INFORMATION', type: 'explanation', below: false
      },
      {
        label: 'Email',
        type: 'textEdit',
        keyboardType: 'email-address',
        value: this.state.email.value,
        state: this.state.email.state,
        callback: (newValue) => {this.setState({email: {value:newValue, state: this.getEmailState(newValue)}})}
      },
      {
        label: 'Password',
        type: 'textEdit',
        secureTextEntry: true,
        value: this.state.password.value,
        state: this.state.password.state,
        callback: (newValue) => {this.setState({password: {value:newValue, state: this.getPasswordState(newValue,1)}})}
      },
      {
        label: 'Password',
        type: 'textEdit',
        secureTextEntry: true,
        placeholder: 'Verification',
        value: this.state.passwordVerification.value,
        state: this.state.passwordVerification.state,
        callback: (newValue) => {this.setState({passwordVerification: {value:newValue, state: this.getPasswordState(newValue,2)}})}
      },
      {
        label: this.state.passwordExplanation,
        style: {paddingBottom: 0},
        type: 'explanation',
        below: true
      },
      {
        label: 'PROFILE INFORMATION', type: 'explanation', below: false
      },
      {
        label: 'First Name',
        type: 'textEdit',
        value: this.state.firstName.value,
        state: this.state.firstName.state,
        callback: (newValue) => {this.setState({firstName: {value:newValue, state: this.getNameState(newValue)}})}
      },
      {
        label: 'Last Name',
        type: 'textEdit',
        value: this.state.lastName.value,
        state: this.state.lastName.state,
        callback: (newValue) => {this.setState({lastName: {value:newValue, state: this.getNameState(newValue)}})}
      },
      {
        label: 'Picture',
        type:  'picture',
        value: this.state.picture,
        placeholderText: 'Optional',
        callback: (newValue) => {},
        triggerOptions:() => {this.pictureOptions.show();}, // picture options are a ref
        removePicture:() => {this.setState({picture:undefined});}
      },
      {
        label: 'Your picture is used so other people can see your face when you\'re in a room.',
        type:  'explanation',
        below: true
      },
      {
        label: 'Next',
        type:  'button',
        style: {color:colors.blue.h},
        callback: this.validateAndContinue.bind(this)
      },
      {
        label: 'By tapping Next, you agree to be awesome.',
        type: 'explanation',
        below: true
      },
    ]
  }


  /**
   * Final check before we send the request to the cloud. If any issues arise, the user is notified.
   */
  validateAndContinue() {
    let s1 = this.getEmailState(this.state.email.value);
    let s2 = this.getPasswordState(this.state.password.value,1);
    let s3 = this.getPasswordState(this.state.passwordVerification.value,2);
    let s4 = this.getNameState(this.state.firstName.value);
    let s5 = this.getNameState(this.state.lastName.value);
    if (s1 == s2 && s2 == s3 && s3 == s4 && s4 == s5 && s5 == 'valid') {
      this.requestRegistration();
    }
    else {
      if (s1 === 'error')
        Alert.alert("Invalid Email Address", "Please double check the supplied address", [{text:'OK'}]);
      else if (s2 === 'error')
        Alert.alert("Invalid Password", passwordStateNeutral, [{text:'OK'}]);
      else if (s3 === 'error')
        Alert.alert("Check the Verification Password.", passwordStateConflict, [{text:'OK'}]);
      else if (s4 === 'error')
        Alert.alert("You Must Enter a First Name.", 'Without numbers.', [{text:'OK'}]);
      else if (s5 === 'error')
        Alert.alert("You Must Enter a Last Name.", 'Without numbers.', [{text:'OK'}]);
      this.setState({email: {state: s1},
        password: {state: s2},
        passwordVerification: {state: s3},
        firstName: {state: s4},
        lastName: {state: s5}
      });
    }
  }

  requestRegistration() {
    // show the processing screen
    this.setState({processing:true});

    let closePopupCallback = () => {this.setState({processing:false})};
    let successCallback = () => {
      this.processImage().then(() => {
        Actions.registerConclusion({type:'reset', email:this.state.email.value.toLowerCase()});
      });
    };
    let errorHandleCallback = (response) => {
      let message = response.error.message.split("` ");
      message = message[message.length - 1];
      Alert.alert("Registration Error", message, [{text: 'OK', onPress: closePopupCallback}]);
    };
    let data = {
      email: this.state.email.value.toLowerCase(),
      password: this.state.password.value,
      firstName: this.state.firstName.value,
      lastName: this.state.lastName.value,
    };
    CLOUD.post({endPoint:'users', data, type:'body'}, successCallback, errorHandleCallback, closePopupCallback);
  }


  processImage() {
    let pxRatio = PixelRatio.get();
    return new Promise((resolve, reject) => {
      if (this.state.picture !== undefined) {
        let { width, height } = Dimensions.get('window');
        ImageResizer.createResizedImage(this.state.picture, width * pxRatio * 0.5, height * pxRatio * 0.5, 'JPEG', 80)
          .then((resizedImageUri) => {
            let imageName = getImageFileFromUser(this.state.email.value);
            let path = RNFS.DocumentDirectoryPath + '/' + imageName;
            return RNFS.moveFile(resizedImageUri, path);
          })
          .then((moveState) => {
            resolve();
          })
          .catch((err) => {
            reject("picture resizing error:" + err.message);
          });
      }
      else {
        resolve();
      }
    })
  }


  render() {
    return (
      <View>
        <Background hideTabBar={true}>
          <ScrollView>
            <ListEditableItems items={this.getItems()} separatorIndent={true} />
          </ScrollView>
        </Background>
        <PictureOptions ref={(pictureOptions) => {this.pictureOptions = pictureOptions;}} selectCallback={(image) => {this.setState({picture:image});}}/>
        <Processing visible={this.state.processing} text="Sending Registration Request..." />
      </View>
    );
  }
}
