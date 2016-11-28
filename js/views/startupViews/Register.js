import React, { Component } from 'react'
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

import { getImageFileFromUser, processImage } from '../../util/util'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
const Actions = require('react-native-router-flux').Actions;
import { styles, colors , screenWidth, screenHeight } from '../styles'

import { SessionMemory } from './SessionMemory'

// these will inform the user of possible issues with the passwords.
let passwordStateNeutral = 'Your password must not be empty.';
let passwordStateConflict = 'Passwords do not match.';
let passwordStateOK = '';

export class Register extends Component {
  constructor() {
    super();
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
        label: 'ACCOUNT INFORMATION', type: 'explanation', below: false
      },
      {
        label: 'Email',
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
        label: 'Password',
        type: 'textEdit',
        validation:'password',
        validationMethod:'icons',
        verification: true,
        secureTextEntry: true,
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
        label: 'PROFILE INFORMATION', type: 'explanation', below: false
      },
      {
        label: 'First Name',
        type: 'textEdit',
        value: this.state.firstName,
        validation:{minLength:2,numbers:{allowed:false}},
        validationMethod:'icons',
        validationCallback: (newState) => {this.inputStates.firstName = newState},
        alwaysShowState: this.state.alwaysShowState,
        callback: (newValue) => {this.setState({firstName: newValue})}
      },
      {
        label: 'Last Name',
        type: 'textEdit',
        value: this.state.lastName,
        validation:{minLength:2,numbers:{allowed:false}},
        validationMethod:'icons',
        validationCallback: (newState) => {this.inputStates.lastName = newState},
        alwaysShowState: this.state.alwaysShowState,
        callback: (newValue) => {this.setState({lastName: newValue })}
      },
      {
        label: 'Picture',
        type:  'picture',
        value: this.state.picture,
        placeholderText: 'Optional',
        callback:(image) => {this.setState({picture:image});},
        removePicture:() => {this.setState({picture:undefined});}
      },
      {
        label: 'Your picture is used so other people can see your face when you\'re in a room.',
        type:  'explanation',
        below: true
      },
      {
        type: 'explanation',
        __item: (
          <View style={{backgroundColor:'transparent',padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12}}>
            <View style={{flexDirection:'row', flexWrap: 'wrap'}}>
              <Text style={{fontSize:11, color:'#444'}}>By registering, you agree to our </Text>
              <TouchableHighlight onPress={() => {
                Linking.openURL('http://crownstone.rocks/terms-of-service/').catch((err) => {})
              }}>
                <Text style={{fontSize:11, color:colors.blue.hex}}>terms </Text>
              </TouchableHighlight>
              <Text style={{fontSize:11, color:'#444'}}>& </Text>
              <TouchableHighlight onPress={() => {
                Linking.openURL('http://crownstone.rocks/privacy-policy/').catch(err => {})
              }}>
                <Text style={{fontSize:11, color:colors.blue.hex}}>privacy policy</Text>
              </TouchableHighlight>
            </View>
          </View>
        )
      },
      {
        label: 'Next',
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
        Alert.alert("Invalid Email Address", "Please double check the supplied email address.", [{text:'OK'}]);
      else if (this.inputStates.password === 'errorNoMatch')
        Alert.alert("Check the Verification Password.", passwordStateConflict, [{text:'OK'}]);
      else if (this.inputStates.password !== 'valid')
        Alert.alert("Invalid Password", passwordStateNeutral, [{text:'OK'}]);
      else if (this.inputStates.firstName !== 'valid')
        Alert.alert("You Must Enter a First Name.", 'Without numbers and at least 2 letters.', [{text:'OK'}]);
      else if (this.inputStates.lastName !== 'valid')
        Alert.alert("You Must Enter a Last Name.", 'Without numbers and at least 2 letters.', [{text:'OK'}]);
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
        let imageName = getImageFileFromUser(this.state.email);
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
          Alert.alert("Registration Error", message, [{text: 'OK', onPress: () => {this.props.eventBus.emit('hideLoading')}}]);
        }
        return false;
      })
  }


  render() {
    return (
      <Background hideTabBar={true} image={this.props.backgrounds.menu}>
        <ScrollView>
          <ListEditableItems items={this.getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
