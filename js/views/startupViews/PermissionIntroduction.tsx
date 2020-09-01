import { LiveComponent }          from "../LiveComponent";


function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PermissionIntroduction", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { Languages } from "../../Languages";
import { Interview } from "../components/Interview";
import { Alert, View } from "react-native";
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


export class PermissionIntroduction extends LiveComponent<any, any> {

  _interview : Interview;

  constructor(props) {
    super(props);
  }

  componentWillUnmount(): void {
  }


  getCards() : interviewCards {
    return {
      start: {
        header: "Let's talk Data!",
        subHeader: "Crownstone collects location data to enable indoor localization even when the app is closed or not in use.",
        explanation: "Localization can turn on your lights when you enter the room, even if your phone is in your pocket!\n\nWe use Crownstone's Bluetooth signals to determine where in the house you are.",
        optionsBottom: true,
        options: [
          {
            label: "I understand",
            nextCard: 'notifications',
            onSelect: (result) => {
              return LocationHandler.initializeTracking()
            }
          },
        ]
      },
      notifications: {
        header: "Can we ask you something?",
        backgroundImage: require("../../images/backgrounds/kitten.jpg"),
        subHeader: "We use notifications to quickly let you know if there are changes in your house.",
        explanation: "If someone sends you a message, we can deliver it instantly!",
        optionsBottom: true,
        options: [
          {
            label: "Okay",
            nextCard: 'finished',
            onSelect: (result) => {
              LOG.info("Sync: Requesting notification permissions during Login.");
              NotificationHandler.request();
              if (this.props.showAi) {
                return 'ai'
              }
              if (this.props.followThrough) {
                return this.props.followThrough();
              }
              core.eventBus.emit("userLoggedInFinished");
              NavigationUtil.setRoot(Stacks.loggedIn());
            }
          },
        ]
      },
      ai: {
        header: "Let me introduce myself!",
        backgroundImage: require("../../images/backgrounds/lightBackground2_blur.jpg"),
        subHeader: "I'm your new smart home!\n\nWhat would you like to call me?",
        component: <View style={{...styles.centered, flex:1}}>
            <ScaledImage source={require("../../images/tutorial/Sphere_with_house.png")} sourceHeight={490} sourceWidth={490} targetHeight={0.3*availableModalHeight} />
          </View>,
        hasTextInputField: true,
        placeholder: randomAiName(),
        optionsBottom: true,
        options: [
          {
            label: "Nice to meet you!",
            nextCard: 'allSet',
            onSelect: (result) => {
              let name = result.textfieldState.trim();
              if (name.length === 0) {
                Alert.alert(
                  lang("I'd really like a name..."),
                  lang("Could you give me one?"),
                  [{text:lang("Sure!")}]
                );
                return false;
              }
              if (this.props.followThrough) {
                return this.props.followThrough();
              }
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
