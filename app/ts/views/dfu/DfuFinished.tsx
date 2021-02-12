
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuFinished", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Platform, View
} from "react-native";
import { colors, screenWidth, styles } from "../styles";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarImitation } from "../components/TopbarImitation";
import { Interview } from "../components/Interview";
import { LiveComponent } from "../LiveComponent";
import { DfuUtil } from "../../util/DfuUtil";
import { Icon } from "../components/Icon";
import { UpdateCenter } from "../../backgroundProcesses/UpdateCenter";
import { TrackingNumberManager } from "../../backgroundProcesses/TrackingNumberManager";

export class DfuFinished extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  _interview : Interview;


  componentDidMount() {
    UpdateCenter.checkForFirmwareUpdates();
  }

  close() {
    NavigationUtil.dismissModal();
    TrackingNumberManager.updateMyDeviceTrackingRegistrationInActiveSphere();
  }

  getFailedCard() : interviewCards {
    return {
      start: {
        header:lang("Something_went_wrong_whil"),
        subHeader:lang("Would_you_like_to_retry_"),
        optionsBottom: true,
        textColor: colors.white.hex,
        backgroundImage:  require('../../../assets/images/backgrounds/upgradeBackgroundFailed.jpg'),
        options: [
          {label: lang("Not_right_now___"), onSelect: () => { this.close(); }},
          {label: lang("Yes_"),     onSelect: () => { NavigationUtil.backTo("DfuScanning") }},
        ]
      },
    }
  }


  getPartialSuccessCard() : interviewCards {
    let amountOfStones = DfuUtil.getUpdatableStones(this.props.sphereId).amountOfStones;
    return {
      start: {
        header:lang("Crownstones_successfully_"),
        subHeader: amountOfStones == 1 ? lang("There_is_just___left_to_g") : lang("There_are_just__left_to_g", amountOfStones),
        optionsBottom: true,
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View style={{...styles.centered, flex:1}}>
              <Icon name="ios-checkmark-circle" size={0.5*screenWidth} color={colors.white.hex} />
            </View>
          </View>
        ),
        options: [
          {label: lang("Thats_enough_for_now___"), onSelect: () => { this.close(); }},
          {label: lang("Lets_do_the_rest_of_them_"), onSelect: () => {  NavigationUtil.backTo("DfuScanning") }},
        ]
      },
    }
  }

  getSuccessCard() : interviewCards {
    return {
      start: {
        header:lang("Crownstones_successfully_u"),
        subHeader:lang("All_your_Crownstones_are_"),
        optionsBottom: true,
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View style={{...styles.centered, flex:1}}>
              <Icon name="ios-checkmark-circle" size={0.5*screenWidth} color={colors.white.hex} />
            </View>
          </View>
        ),
        options: [
          {label: lang("Great_"), onSelect: () => { this.close(); }},
        ]
      },
    }
  }

  getCloudIssueCard() : interviewCards {
    return {
      start: {
        header: lang("I_could_not_download_the_"),
        subHeader:lang("Please_check_if_youre_con"),
        optionsBottom: true,
        textColor: colors.white.hex,
        backgroundImage:  require('../../../assets/images/backgrounds/upgradeBackgroundFailed.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-cloudy-night" size={0.7*screenWidth} color={colors.white.hex} />
            </View>
          </View>
        ),
        options: [
          {label: lang("Ill_try_again_later_"), onSelect: () => { NavigationUtil.backTo("DfuScanning") }},
        ]
      },
    }
  }


  render() {
    let amountOfStonesToUpdate = DfuUtil.getUpdatableStones(this.props.sphereId).amountOfStones;

    let getCardsCallback = () => { return this.getFailedCard() };
    if (amountOfStonesToUpdate === 0) {
      getCardsCallback = () => { return this.getSuccessCard() };
    }
    else if (this.props.cloudIssue) {
      getCardsCallback = () => { return this.getCloudIssueCard() };
    }
    else if (this.props.successCount > 0) {
      getCardsCallback = () => { return this.getPartialSuccessCard() };
    }

    let cards = getCardsCallback();
    let backgroundImage = cards.start.backgroundImage || require('../../../assets/images/backgrounds/upgradeBackgroundSoft.jpg');
    let textColor = cards.start.textColor || colors.black.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor = this._interview.getTextColorFromCard() || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideNotifications={true} hideOrangeLine={true} dimStatusBar={true}>
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : lang("Back")}
          leftAction={() => { if (this._interview.back() === false) { NavigationUtil.backTo("DfuScanning") } }}
          leftButtonStyle={{width: 300}}
          style={{backgroundColor:'transparent', paddingTop:0}}
        />
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return getCardsCallback() }}
          update={   () => { this.forceUpdate() }}
        />
      </AnimatedBackground>
    );
  }
}

