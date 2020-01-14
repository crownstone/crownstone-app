
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_TypeSelector", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Platform
} from "react-native";

import { colors, screenHeight, screenWidth } from "../../styles";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Interview } from "../../components/Interview";
import { AnimatedBackground } from "../../components/animated/AnimatedBackground";
import { TopbarImitation } from "../../components/TopbarImitation";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";
import { DataUtil } from "../../../util/DataUtil";
import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from "../../../ExternalConfig";
import { AicoreUtil } from "./supportCode/AicoreUtil";

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

    examples.forEach((rule) => {
      options.push({
        label: rule.getSentence(this.props.sphereId),
        onSelect: () => {
          if (AicoreUtil.canBehaviourUseIndoorLocalization(this.props.sphereId, "Pick a different example as a starting point.", rule) === false) {
            return false;
          }

          NavigationUtil.navigate( "DeviceSmartBehaviour_Editor", {
            twilightRule: twilight, data: rule, sphereId: this.props.sphereId, stoneId: this.props.stoneId, ruleId: null, typeLabel: typeLabel})
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
        textColor: colors.white.hex,
        options: [
          {
            label: "Presence aware",
            subLabel: '"' + presenceExamples[0].getSentence(this.props.sphereId) + '"',
            image: { source: require('../../../images/icons/presence.png'), sourceWidth: 292, sourceHeight: 399, width: 0.15*screenWidth },
            nextCard: 'presence'
          },
          {
            label: "Smart timer",
            subLabel: '"' + smartTimerExamples[0].getSentence(this.props.sphereId) + '"',
            image: { source: require('../../../images/icons/smartTimer.png'), sourceWidth: 398, sourceHeight: 398, width: 0.175*screenWidth },
            nextCard: 'smartTimer'
          },
          {
            label: "Twilight mode",
            subLabel: '"' + twilightExamples[0].getSentence(this.props.sphereId) + '"',
            image: { source: require('../../../images/icons/twilight.png'), sourceWidth: 529, sourceHeight: 398, width: 0.18*screenWidth },
            onSelect: () => {
              let state = core.store.getState();
              let sphere = state.spheres[this.props.sphereId];
              let stone = sphere.stones[this.props.stoneId]
              if (stone.abilities.dimming.enabledTarget === true) {
                return 'twilight';
              }
              return "dimmingRequired";
            },
          }],
      },
      presence: {
        header: "Presence Aware Behaviour",
        headerMaxNumLines: 1,
        textColor: colors.white.hex,
        backgroundImage: require('../../../images/backgrounds/presence.png'),
        subHeader: "Pick an example and change it to your liking!",
        image: { source: require('../../../images/icons/presence.png'), sourceWidth: 292, sourceHeight: 399, height: 0.2*screenHeight, tintColor: colors.white.hex  },
        optionsBottom: true,
        options: this.getOptions(presenceExamples, "Presence Aware")
      },
      smartTimer: {
        header: "Smart Timer",
        headerMaxNumLines: 1,
        textColor: colors.white.hex,
        backgroundImage: require('../../../images/backgrounds/smartTimer.png'),
        subHeader: "Pick an example and change it to your liking!",
        image: { source: require('../../../images/icons/smartTimer.png'), sourceWidth: 292, sourceHeight: 399, height: 0.2*screenHeight, tintColor: colors.white.hex },
        optionsBottom: true,
        options: this.getOptions(smartTimerExamples, "Smart Timer")
      },
      dimmingRequired: {
        header: "Dimming required",
        headerMaxNumLines: 1,
        textColor: colors.white.hex,
        subHeader: "Twilight requires me to be able to dim. Would you like to enable the dimming ability on this Crownstone?",
        backgroundImage: require('../../../images/backgrounds/twilight.png'),
        optionsBottom: true,
        options: [
          {
            label: "Yes, enable dimming!",
            onSelect: () => {
              core.store.dispatch({type:'UPDATE_ABILITY_DIMMER', sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: {enabledTarget: true}});
              return "twilight";
            }
          },
          {
            label: "Not right now..",
            onSelect: () => {
              setTimeout(() => {this._interview.back()},100)
              return false;
            }
          },
        ]
      },
      twilight: {
        header: "Twilight Mode",
        headerMaxNumLines: 1,
        textColor: colors.white.hex,
        subHeader: "Pick an example and change it to your liking!",
        backgroundImage: require('../../../images/backgrounds/twilight.png'),
        image: { source: require('../../../images/icons/twilight.png'), sourceWidth: 292, sourceHeight: 399, height: 0.25*screenHeight, tintColor: colors.white.hex },
        optionsBottom: true,
        options: this.getOptions(twilightExamples, "Twilight Mode", true)
      },
    }
  }


  _getLocationUids(amount) {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let locationIds = Object.keys(sphere.locations);
    let usedLocationIds = [];
    for (let i = 0; i < locationIds.length && i < amount; i++) {
      usedLocationIds.push(sphere.locations[locationIds[i]].config.uid);
    }

    return usedLocationIds;
  }

  _getPresenceExamples() {
    let examples : AicoreBehaviour[] = [];
    examples.push(new AicoreBehaviour().setPresenceInSphere().setTimeWhenDark());
    examples.push(new AicoreBehaviour().setPresenceInLocations(this._getLocationUids(2)).setTimeAllday());
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFrom(15,0).setTimeToSunset().setEndConditionWhilePeopleInSphere());
    return examples;
  }
  _getSmartTimerExamples() {
    let locationId = DataUtil.getLocationIdFromStone(this.props.sphereId, this.props.stoneId);

    let examples : AicoreBehaviour[] = [];
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFromSunset(0).setTimeTo(22,0).setEndConditionWhilePeopleInSphere());
    examples.push(new AicoreBehaviour().setPresenceInSphere().setTimeFromSunset(30).setTimeTo(23,0));
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFrom(15,0).setTimeToSunset().setEndConditionWhilePeopleInLocation(DataUtil.locationIdToUid(this.props.sphereId,locationId)));
    return examples;
  }
  _getTwilightModeExamples() {
    let examples : AicoreTwilight[] = [];
    examples.push(new AicoreTwilight().setDimAmount(0.5).setTimeWhenDark());
    examples.push(new AicoreTwilight().setDimAmount(0.3).setTimeFrom(23,30).setTimeToSunrise());
    return examples;
  }


  render() {
    let backgroundImage = require('../../../images/backgrounds/behaviourMix.png');
    let textColor = colors.white.hex;
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

