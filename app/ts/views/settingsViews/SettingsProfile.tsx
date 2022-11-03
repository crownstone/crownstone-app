import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsProfile", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert, Linking,
  ScrollView, Text, TouchableHighlight, TouchableWithoutFeedback,
  View
} from "react-native";

import { PictureCircle } from './../components/PictureCircle'
import { ListEditableItems } from './../components/ListEditableItems'
import { processImage } from '../../util/Util'
import { AppUtil } from '../../util/AppUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
import {background, colors, screenWidth, tabBarHeight, topBarHeight} from "./../styles";
import { IconButton } from "../components/IconButton";
import { FileUtil } from "../../util/FileUtil";
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { SettingsNavbarBackground} from "../components/SettingsBackground";
import { DataUtil } from "../../util/DataUtil";
import { SettingsScrollbar } from "../components/SettingsScrollbar";

export class SettingsProfile extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("My_Account")});
  }

  unsubscribe : any;
  renderState : any;
  validationState : any;

  count = 0;
  lastCountTime = 0;

  constructor(props) {
    super(props);
    this.renderState = {};
    this.validationState = {firstName: undefined, lastName: undefined, email: undefined};

    const store = core.store;
    const state = store.getState();
    let user = state.user;

    this.state = {
      picture: user.picture,
      firstName: user.firstName,
      lastName: user.lastName,
      showDevMenu: DataUtil.isDeveloper()
    };
  }

  _countSecret() {
    let now = Date.now();
    if (now - this.lastCountTime > 1000) {
      this.count = 1
    }
    else {
      this.count++;
      if (this.count >= 8 && this.state.showDevMenu === false) {
        this.setState({showDevMenu: true})
      }
    }

    this.lastCountTime = now;
  }

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeUserData || change.changeUserDeveloperStatus) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems(user) {
    const store = core.store;
    const state = store.getState();
    let sphereIds = Object.keys(state.spheres);
    let items = [];

    items.push({type:'spacer'});
    items.push({
      label: lang("First_Name"),
      type: 'textEdit',
      testID:'firstName',
      value: this.state.firstName,
      validation:{minLength:1, numbers:{allowed:false}},
      validationCallback: (result) => {this.validationState.firstName = result;},
      callback: (newText) => {
        this.setState({firstName: newText});
      },
      endCallback: (newText) => {
        if (this.validationState.firstName === 'valid') {
          store.dispatch({type: 'USER_UPDATE', data: {firstName: newText}});
          // update your settings in every sphere that you belong to.
          sphereIds.forEach((sphereId) => { store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data:{firstName: newText}}); });
        }
        else {
          Alert.alert(
            lang("_First_name_must_be_at_le_header"),
            lang("_First_name_must_be_at_le_body"),
            [{text: lang("_First_name_must_be_at_le_left")}]);
        }
      }
    });
    items.push({
      label: lang("Last_Name"), 
      type: 'textEdit',
      value: this.state.lastName,
      testID:'lastName',
      callback: (newText) => {
        this.setState({lastName: newText});
      },
      endCallback: (newText) => {
        store.dispatch({type: 'USER_UPDATE', data: {lastName: newText}});
        // update your settings in every sphere that you belong to.
        sphereIds.forEach((sphereId) => { store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data:{lastName: newText}}); });
      }
    });

    items.push({
      label: lang("Email"),
      type: 'info',
      value: user.email,
    });
    items.push({
      label: lang("Change_Password"),
      type: 'button',
      testID:'changePassword',
      style: {color:colors.blue3.hex},
      callback: () => {
        Alert.alert(
          lang("_Are_you_sure_you_want_to_header"),
          lang("_Are_you_sure_you_want_to_body",user.email),
          [{text: lang("_Are_you_sure_you_want_to_left"), style: 'cancel'},
            {text: lang("_Are_you_sure_you_want_to_right"), onPress: () => {this.requestPasswordResetEmail(user.email)}}
          ]
        )
      }
    });
    items.push({
      type: 'explanation',
      __item: (
        <View style={{backgroundColor:'transparent'}}>
          <View style={{flexDirection:'row', padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12}}>
            <TouchableHighlight
              testID={"DataManagement"}
              onPress={() => { Linking.openURL(`https://next.crownstone.rocks/user-data`).catch(err => {})}}
            >
              <Text style={{fontSize:12, color:colors.blue3.hex}}>{ lang("DELETE_USER") }</Text>
            </TouchableHighlight>
          </View>
        </View>
      )
    });

    items.push({type:'spacer'});

    if (this.state.showDevMenu) {
      if (!DataUtil.isDeveloper()) {
        items.push({
          label: lang("Enable_Developer_Mode"),
          value: false,
          icon: <IconButton name={"md-code-working"} size={25} color={colors.white.hex}
                            buttonStyle={{ backgroundColor: colors.csOrange.hex }}/>,
          type: 'switch',
          callback: (newValue) => {
            setTimeout(() => {
              store.dispatch({
                type: 'SET_DEVELOPER_MODE',
                data: { developer: newValue }
              });
            }, 300)
          }
        });
        items.push({ label: lang("This_will_enable_certain_"), type: 'explanation', below: true });
      }
      else {
        items.push({
          label: lang("Developer_Menu"),
          icon: <IconButton name={"md-code-working"} size={25} color={colors.white.hex}
                            buttonStyle={{ backgroundColor: colors.menuRed.hex }}/>,
          type: 'navigation',
          callback: () => {
            NavigationUtil.navigate("SettingsDeveloper");
          }
        });
        items.push({ type: 'spacer' });
      }
    }

    return items;
  }


  requestPasswordResetEmail(email) {
    core.eventBus.emit('showLoading', 'Requesting password reset email...');
    CLOUD.requestPasswordResetEmail({email: email.toLowerCase()})
      .then(() => {
        let defaultAction = () => {
          AppUtil.logOut(core.store);
        };
        core.eventBus.emit('showLoading', 'Email sent!');
        setTimeout(() => {core.eventBus.emit('hideLoading');},200)
        setTimeout(() => {Alert.alert(
          lang("_Reset_email_has_been_sen_header"),
          lang("_Reset_email_has_been_sen_body"),
          [{text: lang("_Reset_email_has_been_sen_left"), onPress: defaultAction}],
          { onDismiss: defaultAction }
        );},800)

      })
      .catch((reply) => {
        core.eventBus.emit('hideLoading');
        Alert.alert(
          lang("_Cannot_Send_Email_argume_header"),
          lang("_Cannot_Send_Email_argume_body",reply.data),
          [{text: lang("_Cannot_Send_Email_argume_left")}]);
      });
  }


  render() {
    const store = core.store;
    const state = store.getState();
    let sphereIds = Object.keys(state.spheres);
    let user = state.user;

    return (
      <SettingsNavbarBackground testID={"SettingsProfile"}>
        <SettingsScrollbar keyboardShouldPersistTaps="always" contentContainerStyle={{flexGrow:1}}>
          <View style={{alignItems:'center', justifyContent:'center', width: screenWidth, paddingTop:40}}>
            <PictureCircle
              isSquare={true}
              value={this.state.picture}
              callback={(pictureUrl) => {
                let newFilename = user.userId + '.jpg';
                processImage(pictureUrl, newFilename)
                  .then((newPicturePath) => {
                    this.setState({picture:newPicturePath});
                    store.dispatch({type:'USER_UPDATE', data:{picture:newPicturePath, pictureId: null}});
                    // update your settings in every sphere that you belong to.
                    sphereIds.forEach((sphereId) => {
                      store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data: {picture: newPicturePath, pictureId: null}});
                    });
                  })
                  .catch((err) => {
                    LOG.info("PICTURE ERROR ",err)
                  })
              }}
              removePicture={() => {
                FileUtil.safeDeleteFile(this.state.picture).catch(() => {});
                store.dispatch({type:'USER_UPDATE', data:{picture:null, pictureId: null}});
                // update your settings in every sphere that you belong to.
                sphereIds.forEach((sphereId) => {
                  store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data:{picture: null, pictureId: null}});
                });
                this.setState({picture:null});
              }}
              size={120} />
          </View>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
          { !this.state.showDevMenu &&
            <TouchableWithoutFeedback onPress={() => { this._countSecret() }} >
              <View style={{flex:1, width: screenWidth, backgroundColor: 'transparent'}} />
            </TouchableWithoutFeedback>
          }
        </SettingsScrollbar>
      </SettingsNavbarBackground>
    );
  }
}
