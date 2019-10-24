
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

export class DfuFinished extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  _interview : Interview;


  componentDidMount() {
    UpdateCenter.checkForFirmwareUpdates();
  }

  getFailedCard() : interviewCards {
    return {
      start: {
        header:"Something went wrong while updating the Crownstones...",
        subHeader:"Would you like to retry?",
        optionsBottom: true,
        textColor: colors.white.hex,
        backgroundImage:  require('../../images/backgrounds/upgradeBackgroundFailed.png'),
        options: [
          {label: lang("Not_right_now___"), onSelect: () => { NavigationUtil.dismissModal() }},
          {label: lang("Yes_"),     onSelect: () => { NavigationUtil.backTo("DfuScanning") }},
        ]
      },
    }
  }


  getPartialSuccessCard() : interviewCards {
    let amountOfStones = DfuUtil.getUpdatableStones(this.props.sphereId).amountOfStones;
    return {
      start: {
        header:"Crownstones successfully updated!",
        subHeader: amountOfStones == 1 ? "There is just " + amountOfStones + " left to go!" :  "There are just " + amountOfStones + " left to go!",
        optionsBottom: true,
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View style={{...styles.centered, flex:1}}>
              <Icon name="ios-checkmark-circle" size={0.5*screenWidth} color={colors.white.hex} />
            </View>
          </View>
        ),
        options: [
          {label: lang("Thats_enough_for_now___"), onSelect: () => { NavigationUtil.dismissModal()}},
          {label: lang("Lets_do_the_rest_of_them_"), onSelect: () => {  NavigationUtil.backTo("DfuScanning") }},
        ]
      },
    }
  }

  getSuccessCard() : interviewCards {
    return {
      start: {
        header:"Crownstones successfully updated!",
        subHeader:"All your Crownstones are now up to date! Enjoy!",
        optionsBottom: true,
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View style={{...styles.centered, flex:1}}>
              <Icon name="ios-checkmark-circle" size={0.5*screenWidth} color={colors.white.hex} />
            </View>
          </View>
        ),
        options: [
          {label: lang("Great_"), onSelect: () => { NavigationUtil.dismissModal() }},
        ]
      },
    }
  }

  getCloudIssueCard() : interviewCards {
    return {
      start: {
        header: "I could not download the new versions...",
        subHeader:"Please check if you're connected to the internet and try again.",
        optionsBottom: true,
        textColor: colors.white.hex,
        backgroundImage:  require('../../images/backgrounds/upgradeBackgroundFailed.png'),
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
    let backgroundImage = cards.start.backgroundImage || require('../../images/backgrounds/upgradeBackgroundSoft.png');
    let textColor = cards.start.textColor || colors.black.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor = this._interview.getTextColorFromCard() || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideOrangeBar={true} dimStatusBar={true}>
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : "Back"}
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

