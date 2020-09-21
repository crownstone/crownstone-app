import { LiveComponent }          from "../LiveComponent";


function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PermissionIntroduction", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { Languages } from "../../Languages";
import { Interview } from "../components/Interview";
import { Alert, Platform, View } from "react-native";
import {
  availableModalHeight,
  colors,
  screenHeight,
  screenWidth,
  statusBarHeight,
  styles,
  tabBarMargin
} from "../styles";
import { core } from "../../core";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Stacks } from "../../router/Stacks";
import { LocationHandler } from "../../native/localization/LocationHandler";
import { LOG } from "../../logging/Log";
import { NotificationHandler } from "../../backgroundProcesses/NotificationHandler";
import { randomAiName } from "./AiStart";
import { ScaledImage } from "../components/ScaledImage";
import { Icon } from "../components/Icon";
import { Util } from "../../util/Util";


export class PermissionIntroduction extends LiveComponent<any, any> {

  _interview : Interview;

  constructor(props) {
    super(props);
  }

  componentWillUnmount(): void {
  }

  _checkAI() {
    let state = core.store.getState();
    let showAI = false;
    if (state.user.isNew !== false) {
      let sphereIds = Object.keys(state.spheres);
      // To avoid invited users get to see the Ai Naming, check if they have 1 sphere and if they're admin and if there is no AI at the moment
      if (sphereIds.length === 1) {
        if (Util.data.getUserLevelInSphere(state, sphereIds[0]) === 'admin' && !state.spheres[sphereIds[0]].config.aiName) {
          showAI = true;
        }
      }
    }

    if (showAI) {
      return 'ai'
    }
    core.eventBus.emit("userLoggedInFinished");
    NavigationUtil.setRoot(Stacks.loggedIn());
    return false;
  }

  getCards() : interviewCards {
    return {
      start: {
        header: lang("Lets_talk_Data_"),
        subHeader: lang("Crownstone_collects_locat"),
        explanation: lang("Localization_can_turn_on_"),
        optionsBottom: true,
        options: [
          {
            label: lang("I_understand"),
            onSelect: (result) => {
              return LocationHandler.initializeTracking().then(() => {
                if (Platform.OS === 'android') {
                  return this._checkAI();
                }
                return 'notifications';
              })
            }
          },
        ]
      },
      notifications: {
        header: lang("Can_we_ask_you_something_"),
        backgroundImage: require("../../images/backgrounds/assistants.jpg"),
        subHeader: lang("We_use_notifications_switc"),
        explanation: lang("We_also_use_them_to_quick"),
        optionsBottom: true,
        options: [
          {
            label: lang("Sounds_fair"),
            onSelect: (result) => {
              LOG.info("Sync: Requesting notification permissions during Login.");
              NotificationHandler.request();
              return this._checkAI();
            }
          },
        ]
      },
      ai: {
        header: lang("Let_me_introduce_myself_"),
        backgroundImage: require("../../images/backgrounds/lightBackground2_blur.jpg"),
        subHeader: lang("Im_your_new_smart_home__n"),
        component: <View style={{...styles.centered, flex:1}}>
            <ScaledImage source={require("../../images/tutorial/Sphere_with_house.png")} sourceHeight={490} sourceWidth={490} targetHeight={0.3*availableModalHeight} />
          </View>,
        hasTextInputField: true,
        placeholder: randomAiName(),
        optionsBottom: true,
        options: [
          {
            label: lang("Nice_to_meet_you_"),
            nextCard: 'allSet',
            onSelect: (result) => {
              let name = result.textfieldState.trim();
              if (name.length === 0) {
                Alert.alert(
                  lang(lang("Id_really_like_a_name___")),
                  lang(lang("Could_you_give_me_one_")),
                  [{text:lang(lang("Sure_"))}]
                );
                return false;
              }
              let state = core.store.getState();
              let sphereIds = Object.keys(state.spheres);
              core.store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
              core.store.dispatch({type:'UPDATE_SPHERE_CONFIG', sphereId: sphereIds[0], data: {aiName: this.state.aiName}});

              core.eventBus.emit("userLoggedInFinished");
              NavigationUtil.setRoot(Stacks.loggedIn())
            }
          },
        ]
      },
    }
  }


  render() {
    let backgroundImage = require("../../images/backgrounds/houseWithView.jpg")
    let textColor = colors.csBlueDark.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor = this._interview.getTextColorFromCard() || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideOrangeLine={true} hideNotifications={true} dimStatusBar={true}>
        <Interview
          height={screenHeight - 0.5*tabBarMargin - statusBarHeight}
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
        />
      </AnimatedBackground>
    );
  }
}
