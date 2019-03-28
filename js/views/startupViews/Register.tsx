
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Register", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
const sha1 = require('sha-1');
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableHighlight,
  View
} from 'react-native';

import { CLOUD } from '../../cloud/cloudAPI'

import { getImageFileFromUser, processImage } from '../../util/Util'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'

import { colors } from '../styles'

import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";

// these will inform the user of possible issues with the passwords.
let passwordStateNeutral =  lang("Your_password_must_not_be");
let passwordStateConflict =  lang("Passwords_do_not_match_");
let passwordStateOK = '';

export class Register extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: lang("Register"),
    }
  };

  inputStates : any;

  constructor(props) {
    super(props);
    this.state = {
      alwaysShowState: false,
      email: '',
      password: '',
      passwordVerification: '',
      passwordExplanation: passwordStateNeutral,
      firstName: '',
      lastName: '',
      picture: undefined,
      processing: false,
    };

    this.inputStates = {email:false, password:false, firstName:false, lastName:false};
    CLOUD.setAccess(undefined);
  }


  /**
   * Check if the passwords are valid
   * @param validationState
   * @returns {*}
   */
  setPasswordExplanation(validationState) {
    let setText = (text) => {
      if (this.state.passwordExplanation !== text) {
        this.setState({passwordExplanation:text});
      }
    };

    switch (validationState) {
      case 'errorNoMatch':
        setText(passwordStateConflict);
        break;
      case 'valid':
        setText(passwordStateOK);
        break;
      case 'errorTooShort':
      default:
        setText(passwordStateNeutral);
    }
  }

  /**
   * get the form items
   * @returns {*[]}
   */
  getItems() {
    return [
      {
        label: lang("ACCOUNT_INFORMATION"), type: 'explanation', below: false
      },
      {
        label: lang("Email"),
        type: 'textEdit',
        validation:'email',
        validationMethod:'icons',
        autoCapitalize:'none',
        keyboardType: 'email-address',
        value: this.state.email,
        validationCallback: (newState) => { this.inputStates.email = newState; },
        alwaysShowState: this.state.alwaysShowState,
        callback: (newValue) => { this.setState({email: newValue}); }
      },
      {
        label: lang("Password"),
        type: 'textEdit',
        validation:'password',
        validationMethod:'icons',
        autoCapitalize:'none',
        secureTextEntry: true,
        showExposeIcon: true,
        keyboardType: 'ascii-capable',
        value: this.state.password,
        validationCallback: (newState) => {this.inputStates.password = newState; this.setPasswordExplanation(newState)},
        alwaysShowState: this.state.alwaysShowState,
        callback: (newValue) => {this.setState({password: newValue})}
      },
      {
        label: this.state.passwordExplanation,
        style: {paddingBottom: 0},
        type: 'explanation',
        below: true
      },
      {
        label: lang("PROFILE_INFORMATION"), type: 'explanation', below: false
      },
      {
        label: lang("First_Name"),
        type: 'textEdit',
        value: this.state.firstName,
        validation:{minLength:2,numbers:{allowed:false}},
        validationMethod:'icons',
        validationCallback: (newState) => {this.inputStates.firstName = newState},
        alwaysShowState: this.state.alwaysShowState,
        callback: (newValue) => {this.setState({firstName: newValue})}
      },
      {
        label: lang("Last_Name"),
        type: 'textEdit',
        value: this.state.lastName,
        validation:{minLength:2,numbers:{allowed:false}},
        validationMethod:'icons',
        validationCallback: (newState) => {this.inputStates.lastName = newState},
        alwaysShowState: this.state.alwaysShowState,
        callback: (newValue) => { this.setState({lastName: newValue })}
      },
      {
        label: lang("Picture"),
        type:  'picture',
        value: this.state.picture,
        placeholderText: lang("Optional"),
        callback:(image) => {this.setState({picture:image});},
        removePicture:() => {this.setState({picture:undefined});}
      },
      {
        label: lang("Your_picture_is_used_so_o"),
        type:  'explanation',
        below: true
      },
      {
        type: 'explanation',
        __item: (
          <View style={{backgroundColor:'transparent',padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12}}>
            <View style={{flexDirection:'row', flexWrap: 'wrap'}}>
              <Text style={{fontSize:11, color:'#444'}}>{ lang("By_registering__you_agree") }</Text>
              <TouchableHighlight onPress={() => {
                Linking.openURL('https://crownstone.rocks/terms-of-service/').catch((err) => {})
              }}>
                <Text style={{fontSize:11, color:colors.blue.hex}}>{ lang("terms_") }</Text>
              </TouchableHighlight>
              <Text style={{fontSize:11, color:'#444'}}>{ lang("__") }</Text>
              <TouchableHighlight onPress={() => {
                Linking.openURL('https://crownstone.rocks/privacy-policy/').catch(err => {})
              }}>
                <Text style={{fontSize:11, color:colors.blue.hex}}>{ lang("privacy_policy") }</Text>
              </TouchableHighlight>
            </View>
          </View>
        )
      },
      {
        label: lang("Next"),
        type:  'button',
        style: {color:colors.blue.hex},
        callback: this.validateAndContinue.bind(this)
      },
      {
        type: 'spacer',
      },
    ]
  }


  /**
   * Final check before we send the request to the cloud. If any issues arise, the user is notified.
   */
  validateAndContinue() {
    this.setState({alwaysShowState: true});
    if (
      this.inputStates.email     === 'valid' &&
      this.inputStates.password  === 'valid' &&
      this.inputStates.firstName === 'valid' &&
      this.inputStates.lastName  === 'valid'
      ) {
      this.requestRegistration();
    }
    else {
      if (this.inputStates.email !== 'valid')
        Alert.alert(
          lang("_Invalid_Email_Address__P_header"),
          lang("_Invalid_Email_Address__P_body"),
          [{text:lang("_Invalid_Email_Address__P_left")}]);
      else if (this.inputStates.password === 'errorNoMatch')
        Alert.alert(
          lang("_Check_the_Verification_P_header"),
          lang("_Check_the_Verification_P_body",passwordStateConflict),
          [{text:lang("_Check_the_Verification_P_left")}]);
      else if (this.inputStates.password !== 'valid')
        Alert.alert(
          lang("_Invalid_Password_argumen_header"),
          lang("_Invalid_Password_argumen_body",passwordStateNeutral),
          [{text:lang("_Invalid_Password_argumen_left")}]);
      else if (this.inputStates.firstName !== 'valid')
        Alert.alert(
          lang("_You_Must_Enter_a_First_N_header"),
          lang("_You_Must_Enter_a_First_N_body"),
          [{text:lang("_You_Must_Enter_a_First_N_left")}]);
      else if (this.inputStates.lastName !== 'valid')
        Alert.alert(
          lang("_You_Must_Enter_a_Last_Na_header"),
          lang("_You_Must_Enter_a_Last_Na_body"),
          [{text:lang("_You_Must_Enter_a_Last_Na_left")}]);
    }
  }

  requestRegistration() {
    // show the processing screen
    core.eventBus.emit('showLoading', 'Sending Registration Request...');
    CLOUD.registerUser({
      email: this.state.email.toLowerCase(),
      password: sha1(this.state.password),
      firstName: this.state.firstName,
      lastName: this.state.lastName,
    })
      .then(() => {
        let imageName = getImageFileFromUser(this.state.email.toLowerCase());
        return processImage(this.state.picture, imageName);
      })
      .then(() => {
        core.eventBus.emit("hideLoading");
        core.sessionMemory.loginEmail = this.state.email.toLowerCase();
        NavigationUtil.reset("RegisterConclusion", {email:this.state.email.toLowerCase()});
      })
      .catch((reply) => {
        if (reply.data && reply.data.error && reply.data.error.message) {
          let message = reply.data.error.message.split("` ");
          message = message[message.length - 1];
          let defaultAction = () => {core.eventBus.emit('hideLoading')};
          Alert.alert(
            lang("_Registration_Error_argum_header"),
            lang("_Registration_Error_argum_body",message),
            [{text: lang("_Registration_Error_argum_left"), onPress: defaultAction}], { onDismiss: defaultAction});
        }
        return false;
      })
  }


  render() {
    return (
      <Background hasNavBar={false} image={core.background.menu}>
        <ScrollView keyboardShouldPersistTaps="never" >
          <ListEditableItems items={this.getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
