import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
const sha1 = require('sha-1');
import {
  Alert,
  Linking,
  ScrollView,
  Switch,
  Text,
  TouchableHighlight,
  View
} from 'react-native';

import { CLOUD } from '../../cloud/cloudAPI'

import { getImageFileFromUser, processImage } from '../../util/Util'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
const Actions = require('react-native-router-flux').Actions;
import { colors } from '../styles'

import { SessionMemory } from '../../util/SessionMemory'

// these will inform the user of possible issues with the passwords.
let passwordStateNeutral =  Languages.label("Register", "Your_password_must_not_be")();
let passwordStateConflict =  Languages.label("Register", "Passwords_do_not_match_")();
let passwordStateOK = '';

export class Register extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: Languages.title("Register", "Register")(),
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
        label: Languages.label("Register", "ACCOUNT_INFORMATION")(), type: 'explanation', below: false
      },
      {
        label: Languages.label("Register", "Email")(),
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
        label: Languages.label("Register", "Password")(),
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
        label: Languages.label("Register", "PROFILE_INFORMATION")(), type: 'explanation', below: false
      },
      {
        label: Languages.label("Register", "First_Name")(),
        type: 'textEdit',
        value: this.state.firstName,
        validation:{minLength:2,numbers:{allowed:false}},
        validationMethod:'icons',
        validationCallback: (newState) => {this.inputStates.firstName = newState},
        alwaysShowState: this.state.alwaysShowState,
        callback: (newValue) => {this.setState({firstName: newValue})}
      },
      {
        label: Languages.label("Register", "Last_Name")(),
        type: 'textEdit',
        value: this.state.lastName,
        validation:{minLength:2,numbers:{allowed:false}},
        validationMethod:'icons',
        validationCallback: (newState) => {this.inputStates.lastName = newState},
        alwaysShowState: this.state.alwaysShowState,
        callback: (newValue) => { this.setState({lastName: newValue })}
      },
      {
        label: Languages.label("Register", "Picture")(),
        type:  'picture',
        value: this.state.picture,
        placeholderText: 'Optional',
        callback:(image) => {this.setState({picture:image});},
        removePicture:() => {this.setState({picture:undefined});}
      },
      {
        label: Languages.label("Register", "Your_picture_is_used_so_o")(),
        type:  'explanation',
        below: true
      },
      {
        type: 'explanation',
        __item: (
          <View style={{backgroundColor:'transparent',padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12}}>
            <View style={{flexDirection:'row', flexWrap: 'wrap'}}>
              <Text style={{fontSize:11, color:'#444'}}>{ Languages.text("Register", "By_registering__you_agree")() }</Text>
              <TouchableHighlight onPress={() => {
                Linking.openURL('https://crownstone.rocks/terms-of-service/').catch((err) => {})
              }}>
                <Text style={{fontSize:11, color:colors.blue.hex}}>{ Languages.text("Register", "terms_")() }</Text>
              </TouchableHighlight>
              <Text style={{fontSize:11, color:'#444'}}>{ Languages.text("Register", "__")() }</Text>
              <TouchableHighlight onPress={() => {
                Linking.openURL('https://crownstone.rocks/privacy-policy/').catch(err => {})
              }}>
                <Text style={{fontSize:11, color:colors.blue.hex}}>{ Languages.text("Register", "privacy_policy")() }</Text>
              </TouchableHighlight>
            </View>
          </View>
        )
      },
      {
        label: Languages.label("Register", "Next")(),
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
Languages.alert("Register", "_Invalid_Email_Address__P_header")(),
Languages.alert("Register", "_Invalid_Email_Address__P_body")(),
[{text:Languages.alert("Register", "_Invalid_Email_Address__P_left")()}]);
      else if (this.inputStates.password === 'errorNoMatch')
        Alert.alert(
Languages.alert("Register", "_Check_the_Verification_P_header")(),
Languages.alert("Register", "_Check_the_Verification_P_body")(passwordStateConflict),
[{text:Languages.alert("Register", "_Check_the_Verification_P_left")()}]);
      else if (this.inputStates.password !== 'valid')
        Alert.alert(
Languages.alert("Register", "_Invalid_Password_argumen_header")(),
Languages.alert("Register", "_Invalid_Password_argumen_body")(passwordStateNeutral),
[{text:Languages.alert("Register", "_Invalid_Password_argumen_left")()}]);
      else if (this.inputStates.firstName !== 'valid')
        Alert.alert(
Languages.alert("Register", "_You_Must_Enter_a_First_N_header")(),
Languages.alert("Register", "_You_Must_Enter_a_First_N_body")(),
[{text:Languages.alert("Register", "_You_Must_Enter_a_First_N_left")()}]);
      else if (this.inputStates.lastName !== 'valid')
        Alert.alert(
Languages.alert("Register", "_You_Must_Enter_a_Last_Na_header")(),
Languages.alert("Register", "_You_Must_Enter_a_Last_Na_body")(),
[{text:Languages.alert("Register", "_You_Must_Enter_a_Last_Na_left")()}]);
    }
  }

  requestRegistration() {
    // show the processing screen
    this.props.eventBus.emit('showLoading', 'Sending Registration Request...');
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
        this.props.eventBus.emit("hideLoading");
        SessionMemory.loginEmail = this.state.email.toLowerCase();
        Actions.registerConclusion({type:'reset', email:this.state.email.toLowerCase()});
      })
      .catch((reply) => {
        if (reply.data && reply.data.error && reply.data.error.message) {
          let message = reply.data.error.message.split("` ");
          message = message[message.length - 1];
          let defaultAction = () => {this.props.eventBus.emit('hideLoading')};
          Alert.alert(
Languages.alert("Register", "_Registration_Error_argum_header")(),
Languages.alert("Register", "_Registration_Error_argum_body")(message),
[{text: Languages.alert("Register", "_Registration_Error_argum_left")(), onPress: defaultAction}], { onDismiss: defaultAction});
        }
        return false;
      })
  }


  render() {
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.menu}>
        <ScrollView keyboardShouldPersistTaps="never" >
          <ListEditableItems items={this.getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
