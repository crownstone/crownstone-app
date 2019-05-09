
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Register", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
const sha1 = require('sha-1');
import {
  Alert, Linking,
  Platform, Text, TouchableHighlight,
  View
} from "react-native";

import { CLOUD } from '../../cloud/cloudAPI'

import { emailChecker, getImageFileFromUser, processImage } from "../../util/Util";

import { colors, screenHeight, screenWidth, styles } from "../styles";

import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Interview } from "../components/Interview";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { TopbarImitation } from "../components/TopbarImitation";
import { PictureCircle } from "../components/PictureCircle";
import { InterviewTextInput } from "../components/InterviewComponents";
import { FileUtil } from "../../util/FileUtil";
import { Icon } from "../components/Icon";


export class Register extends Component<any, any> {
  static navigationOptions = {
    header: null
  };

  user;

  _interview : Interview;

  removePictureQueue = [];
  focussingIndex = null;

  constructor(props) {
    super(props);

    CLOUD.setAccess(undefined);

    this.user = {
      firstName: null,
      lastName: null,
      email: null,
      password: null,
      picture: null,
    }
  }

  componentWillUnmount(): void {
    this.cancelEdit();
  }

  cancelEdit() {
    // clean up any pictures that were taken
    this._removeUnusedPictures();
    this._removePicture(this.user.picture);
    NavigationUtil.back();
  }

  _removeUnusedPictures() {
    this.removePictureQueue.forEach((pic) => {
      this._removePicture(pic);
    })
    this.removePictureQueue = [];
  }

  _removePicture(image) {
    if (image) {
      FileUtil.safeDeleteFile(image).catch(() => {});
    }
  }

  getCards() : interviewCards {
    return {
      start: {
        header:"Welcome!",
        subHeader:"What should I call you?",
        optionsBottom: true,
        editableItem: (state, setState) => {
          return (
            <View style={{flex:1, width:screenWidth}}>
              <InterviewTextInput
                autofocus={true}
                focussed={this.focussingIndex === 0 || undefined}
                placeholder={"First name"}
                value={state && state.firstName || this.user.firstName}
                callback={(newValue) => {
                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  newState["firstName"] = newValue;
                  setState(newState);
                }}
                onBlur={() => { this.focussingIndex = 1; this.forceUpdate(); }}
              />
              <InterviewTextInput
                autofocus={false}
                placeholder={"Last name"}
                focussed={this.focussingIndex === 1 || undefined}
                value={state && state.lastName || this.user.lastName}
                callback={(newValue) => {
                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  newState["lastName"] = newValue;
                  setState(newState);}
                }
                onBlur={() => { this.focussingIndex = null; this.forceUpdate(); }}
              />
            </View>
          );
        },
        options: [
          {
            label: "That's me!",
            nextCard: 'picture',
            onSelect: (result) => {
              if (!result.customElementState.firstName && !result.customElementState.lastName && !this.user.firstName && !this.user.lastName) {
                Alert.alert("What should I call you?", "I'd really like to know your name!", [{text:"Fine..."}]);
                return false;
              }
              else if (!result.customElementState.firstName && !this.user.firstName) {
                Alert.alert("How should I adress you?", "Could you tell me your first name?", [{text:"Fine..."}]);
                return false;
              }

              this.user.firstName = result.customElementState.firstName || this.user.firstName;
              this.user.lastName = result.customElementState.lastName || this.user.lastName || null;

              this.focussingIndex = null;
              return true;
            }
          },
        ]
      },
      picture: {
        header: "Nice to meet you " + this.user.firstName + "!",
        subHeader: "Would you like to add a profile picture?",
        editableItem: (state, setState) => {
          return (
            <View style={{...styles.centered, flex:1}}>
              <PictureCircle
                root={true}
                value={state && state.picture || this.user.picture}
                callback={(pictureUrl) => {
                  this.user.picture = pictureUrl;

                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  newState["picture"] = pictureUrl;
                  setState(newState);
                  this.forceUpdate();
                }}
                removePicture={() => {
                  this.removePictureQueue.push(this.user.picture);
                  this.user.picture = null;
                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  newState["picture"] = null;
                  setState(newState);
                  this.forceUpdate();
                }}
                size={0.22*screenHeight}
              />
            </View>
          )
        },
        options: [{
          label: this.user.picture ? "You bet I do!" : "Not just yet...",
          textAlign:'right',
          nextCard:"email",
        }]
      },
      email: {
        header: this.user.picture ? "Fantastic picture!" : "You're almost done!",
        subHeader: this.user.picture ? "Now let's create your account!" : "Let's create your account!",
        optionsBottom: true,
        editableItem: (state, setState) => {
          return (
            <View style={{flex:1, width:screenWidth}}>
              <InterviewTextInput
                autofocus={true}
                focussed={this.focussingIndex === 0 || undefined}
                placeholder={"Email address"}
                keyboardType={"email-address"}
                value={state && state.email || this.user.email}
                callback={(newValue) => {
                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  newState["email"] = newValue;
                  this.user.email = newValue;
                  setState(newState);}
                }
                onBlur={() => { this.focussingIndex = 1; this.forceUpdate(); }}
              />
              <InterviewTextInput
                autofocus={false}
                placeholder={"Password"}
                keyboardType={'ascii-capable'}
                focussed={this.focussingIndex === 1 || undefined}
                value={state && state.password || this.user.password}
                callback={(newValue) => {
                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  newState["password"] = newValue;
                  this.user.password = newValue;
                  setState(newState);}
                }
                onBlur={() => { this.focussingIndex = null; this.forceUpdate(); }}
              />
              <View style={{backgroundColor:'transparent',padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12}}>
                <View style={{flexDirection:'row', flexWrap: 'wrap'}}>
                  <Text style={{fontSize:13, color:'#444'}}>{ lang("By_registering__you_agree") }</Text>
                  <TouchableHighlight onPress={() => {
                    Linking.openURL('https://crownstone.rocks/terms-of-service/').catch((err) => {})
                  }}>
                    <Text style={{fontSize:13, color:colors.blue.hex}}>{ lang("terms_") }</Text>
                  </TouchableHighlight>
                  <Text style={{fontSize:13, color:'#444'}}>{ lang("__") }</Text>
                  <TouchableHighlight onPress={() => {
                    Linking.openURL('https://crownstone.rocks/privacy-policy/').catch(err => {})
                  }}>
                    <Text style={{fontSize:13, color:colors.blue.hex}}>{ lang("privacy_policy") }</Text>
                  </TouchableHighlight>
                </View>
              </View>
            </View>
          );
        },
        options: [
          {
            label: "I'm ready!",
            onSelect: (result) => {
              if (!result.customElementState.email && !this.user.email) {
                Alert.alert("How can I reach you?", "I'd really like to know your email address!", [{ text: "OK" }]);
                return false;
              }
              else if ((result.customElementState.email && emailChecker(result.customElementState.email) === false) ||
                (this.user.email && emailChecker(this.user.email) === false)) {
                Alert.alert("I don't understand...", "That does not seem to be a valid email address!", [{ text: "I'll fix it!" }]);
                return false;
              }
              else if (!result.customElementState.password && !this.user.password) {
                Alert.alert("I want to be secure...", "Please set a password for your account!", [{ text: "OK" }]);
                return false;
              }

              this.user.email = result.customElementState.email || this.user.email;
              this.user.password = result.customElementState.password || this.user.password;

              this.focussingIndex = null;
              this.requestRegistration();
            }
          },
        ]
      },
      finished: {
        header:"That's it!",
        subHeader: "We have sent an email to:\n\n" +
          (this.user.email || "" ).toLowerCase() + "\n\n" +
          "Please tap the link in the email to activate your account and log in!",
        backgroundImage: require('../../images/backgrounds/fadedLightBackgroundGreen.png'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <Icon name="ios-checkmark-circle" size={0.5*screenWidth} color={colors.white.rgba(0.8)} />
          </View>
        ),
        optionsBottom: true,
        options: [
          {
            label: "I'll validate my account and log in!",
            onSelect: () => {
              NavigationUtil.backTo("Login");
            }
          },
        ]
      },
    }
  }

  requestRegistration() {
    // show the processing screen
    core.eventBus.emit('showLoading', 'Sending Registration Request...');
    CLOUD.registerUser({
      email: this.user.email.toLowerCase(),
      password: sha1(this.user.password),
      firstName: this.user.firstName,
      lastName: this.user.lastName,
    })
      .then(() => {
        let imageName = getImageFileFromUser(this.user.email.toLowerCase());
        return processImage(this.user.picture, imageName);
      })
      .then(() => {
        core.eventBus.emit("hideLoading");
        core.sessionMemory.loginEmail = this.user.email.toLowerCase();
        this._interview.setLockedCard("finished");
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
    let backgroundImage = core.background.light;
    let textColor = colors.csBlueDark.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor = this._interview.getTextColorFromCard() || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideOrangeBar={true} dimStatusBar={true}>
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : "Back"}
          leftAction={() => { if (this._interview.back() === false) {NavigationUtil.back();} }}
          leftButtonStyle={{width: 300}}
          style={{backgroundColor:'transparent', paddingTop:0}}
        />
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
        />
      </AnimatedBackground>
    );
  }
}
