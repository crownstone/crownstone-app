import { LiveComponent } from "../LiveComponent";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PermissionIntroduction", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Languages } from "../../Languages";
import { Interview } from "../components/Interview";
import { Platform, View } from "react-native";
import {
  availableModalHeight,
  colors,
  screenHeight,
  statusBarHeight,
  styles,
  tabBarMargin
} from "../styles";
import { core } from "../../Core";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Stacks } from "../Stacks";
import { LocationHandler } from "../../native/localization/LocationHandler";
import { LOG } from "../../logging/Log";
import { NotificationHandler } from "../../backgroundProcesses/NotificationHandler";
import { ScaledImage } from "../components/ScaledImage";
import { Util } from "../../util/Util";
import { SafeAreaView } from "react-native-safe-area-context";


export class PermissionIntroduction extends LiveComponent<any, any> {

  _interview : Interview;

  constructor(props) {
    super(props);
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
            testID: "permission_i_understand",
            onSelect: (result) => {
              return LocationHandler.initializeTracking().then(() => {
                if (Platform.OS === 'android') {
                  core.store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
                  core.eventBus.emit("userLoggedInFinished");
                  this.props.setAppState(true, true);
                  return;
                }
                return 'notifications';
              })
            }
          },
        ]
      },
      notifications: {
        header: lang("Can_we_ask_you_something_"),
        backgroundImage: require("../../../assets/images/backgrounds/assistants.jpg"),
        subHeader: lang("We_use_notifications_switc"),
        explanation: lang("We_also_use_them_to_quick"),
        optionsBottom: true,
        testID:'permission_Notifications_view',
        options: [
          {
            label: lang("Sounds_fair"),
            testID: "permission_sounds_fair",
            onSelect: (result) => {
              LOG.info("Sync: Requesting notification permissions during Login.");
              NotificationHandler.request();
              core.store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
              core.eventBus.emit("userLoggedInFinished");
              this.props.setAppState(true, true);
            }
          },
        ]
      },
    }
  }


  render() {
    let backgroundImage = require("../../../assets/images/backgrounds/houseWithView.jpg")
    let textColor = colors.csBlueDark.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor       = this._interview.getTextColorFromCard()  || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideOrangeLine={true} hideNotifications={true} testID={"PermissionIntroduction"}>
        <SafeAreaView>
        <Interview
          backButtonOverrideViewNameOrId={this.props.componentId}
          height={screenHeight - 0.5*tabBarMargin - statusBarHeight}
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
        />
        </SafeAreaView>
      </AnimatedBackground>
    );
  }
}
