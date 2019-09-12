
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_TypeSelector", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
   Platform
} from "react-native";

import {
  availableScreenHeight,
  colors,
  deviceStyles, screenHeight,
  screenWidth
} from "../../../styles";
import { core } from "../../../../core";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { Interview } from "../../../components/Interview";
import { AnimatedBackground } from "../../../components/animated/AnimatedBackground";
import { TopbarImitation } from "../../../components/TopbarImitation";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";

export class DeviceSmartBehaviour_TypeSelector extends Component<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  interviewData;

  _interview : Interview;
  constructor(props) {
    super(props);

    this.interviewData = {
      presence: null,
      time: null,
      timeDetails: {},
      option: null,
      switchCraft: false,
      dimming: false,
      always: false,
      locked: false,
    };
  }

  getOptions(examples : AicoreBehaviour[] | AicoreTwilight[], typeLabel, twilight=false) : interviewOption[] {
    let options = [];

    examples.forEach((ex) => {
      options.push({
        label: ex.getSentence(),
        onSelect: () => {
          NavigationUtil.navigate( "DeviceSmartBehaviour_Editor", {
            twilightRule: twilight, data: ex, sphereId: this.props.sphereId, stoneId: this.props.stoneId, ruleId: null, typeLabel: typeLabel})
        }
      })
    })

    return options;
  }

  getCards() : interviewCards {
    let presenceExamples   = this._getPresenceExamples();
    let twilightExamples   = this._getTwilightModeExamples();
    let smartTimerExamples = this._getSmartTimerExamples();

    return {
      start: {
        header:"What sort of behaviour shall I learn?",
        subHeader:"Pick a type to start with:",
        optionsBottom: true,
        options: [
          {
            label: "Presence aware",
            subLabel: '"' + presenceExamples[0].getSentence() + '"',
            image: { source: require('../../../../images/icons/presence.png'), sourceWidth: 292, sourceHeight: 399, width: 0.15*screenWidth },
            nextCard: 'presence'
          },
          {
            label: "Smart timer",
            subLabel: '"' + smartTimerExamples[0].getSentence() + '"',
            image: { source: require('../../../../images/icons/smartTimer.png'), sourceWidth: 398, sourceHeight: 398, width: 0.175*screenWidth },
            nextCard: 'smartTimer'
          },
          {
            label: "Twilight mode",
            subLabel: '"' + twilightExamples[0].getSentence() + '"',
            image: { source: require('../../../../images/icons/twilight.png'), sourceWidth: 529, sourceHeight: 398, width: 0.18*screenWidth },
            nextCard: 'twilight'
          },
        ]
      },
      presence: {
        header: "Presence Aware Behaviour",
        headerMaxNumLines: 1,
        textColor: colors.white.hex,
        backgroundImage: require('../../../../images/backgrounds/presence.png'),
        subHeader: "Pick an example and change it to your liking!",
        image: { source: require('../../../../images/icons/presence.png'), sourceWidth: 292, sourceHeight: 399, height: 0.2*screenHeight, tintColor: colors.white.hex  },
        optionsBottom: true,
        options: this.getOptions(presenceExamples, "Presence Aware")
      },
      smartTimer: {
        header: "Smart Timer",
        headerMaxNumLines: 1,
        textColor: colors.white.hex,
        backgroundImage: require('../../../../images/backgrounds/smartTimer.png'),
        subHeader: "Pick an example and change it to your liking!",
        image: { source: require('../../../../images/icons/smartTimer.png'), sourceWidth: 292, sourceHeight: 399, height: 0.2*screenHeight, tintColor: colors.white.hex },
        optionsBottom: true,
        options: this.getOptions(smartTimerExamples, "Smart Timer")
      },
      twilight: {
        header: "Twilight Mode",
        headerMaxNumLines: 1,
        textColor: colors.white.hex,
        subHeader: "Pick an example and change it to your liking!",
        backgroundImage: require('../../../../images/backgrounds/twilight.png'),
        image: { source: require('../../../../images/icons/twilight.png'), sourceWidth: 292, sourceHeight: 399, height: 0.25*screenHeight, tintColor: colors.white.hex },
        optionsBottom: true,
        options: this.getOptions(twilightExamples, "Twilight Mode", true)
      },
    }
  }


  _getLocationIds(amount) {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let activeSphere = sphereIds[0];

    let sphere = state.spheres[activeSphere];
    let locationIds = Object.keys(sphere.locations);
    let usedLocationIds = [];
    for (let i = 0; i < locationIds.length && i < amount; i++) {
      usedLocationIds.push(locationIds[i]);
    }

    return usedLocationIds;
  }

  _getPresenceExamples() {
    let examples : AicoreBehaviour[] = [];
    examples.push(new AicoreBehaviour().setPresenceInSphere().setTimeWhenDark());
    examples.push(new AicoreBehaviour().setPresenceInLocations(this._getLocationIds(2)).setTimeAllday());
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFrom(15,0).setTimeToSunset().setOptionStayOnWhilePeopleInSphere());
    return examples;
  }
  _getSmartTimerExamples() {
    let examples : AicoreBehaviour[] = [];
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFromSunset(0).setTimeTo(22,0).setOptionStayOnWhilePeopleInSphere());
    examples.push(new AicoreBehaviour().setPresenceInSphere().setTimeFromSunset(30).setTimeTo(23,0));
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFrom(15,0).setTimeToSunset().setOptionStayOnWhilePeopleInLocation());
    return examples;
  }
  _getTwilightModeExamples() {
    let examples : AicoreTwilight[] = [];
    examples.push(new AicoreTwilight().setDimAmount(0.5).setTimeWhenDark());
    examples.push(new AicoreTwilight().setDimAmount(0.35).setTimeFrom(23,30).setTimeToSunrise());
    return examples;
  }
  _getChildSafetyExamples() {
    let examples : behaviour[] = [];

    return examples;
  }


  render() {
    let backgroundImage = core.background.lightBlur;
    let textColor = colors.csBlueDark.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor = this._interview.getTextColorFromCard() || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideNotifications={true} dimStatusBar={true} hideOrangeLine={true}>
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : "Back"}
          leftAction={() => { if (this._interview.back() === false) { NavigationUtil.dismissModal(); }}}
          leftButtonStyle={{width: 300}} style={{backgroundColor:'transparent', paddingTop:0}} />
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
        />
      </AnimatedBackground>
    );
  }
}

