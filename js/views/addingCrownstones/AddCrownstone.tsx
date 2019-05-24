
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddCrownstone", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Linking,
  Platform,
} from "react-native";
import { colors} from "../styles";
import { core } from "../../core";
import { Pagination } from 'react-native-snap-carousel';
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { ScanningForSetupCrownstones } from "./ScanningForSetupCrownstones";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarImitation } from "../components/TopbarImitation";
import { Interview } from "../components/Interview";
import { LiveComponent } from "../LiveComponent";


export class AddCrownstone extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false }
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

  getCards() : interviewCards {
    return {
      start: {
        header:"Let's add a Crownstone!",
        subHeader:"What sort of Crownstone would you like to add?",
        optionsCenter: true,
        options: [
          {label: lang("Plug"),          image: require('../../images/addCrownstone/plugs.png'),      nextCard: 'installingPlug',              response: "A Plug it is!"},
          {label: lang("Built_in_One"),  image: require('../../images/addCrownstone/builtin-v2.png'), nextCard: 'installingBuiltinOne_step1',  response: "Let's add a Built-in One!"},
          {label: lang("Built_in_Zero"), image: require('../../images/addCrownstone/builtin-v1.png'), nextCard: 'installingBuiltinZero_step1', response: "Let's add a Built-in Zero!"},
          {label: lang("I_dont_have_nCrownstones_y"), image: require('../../images/addCrownstone/buy.png'), nextCard: 'buy',             response: "Let's buy Crownstones!"},
        ]
      },
      buy: {
        textColor: colors.white.hex,
        subHeader: "Tap the button below to go to the shop!",
        backgroundImage: require('../../images/backgrounds/builtinDarkBackground.png'),
        optionsBottom: true,
        options: [
          {label: lang("Visit_the_Shop_"), textAlign:'right', onSelect: () => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}); }},
        ]
      },
      installingPlug: {
        subHeader:"Insert the plug into a power outlet and hold your phone close by. Tap next when you're ready!",
        backgroundImage: require('../../images/backgrounds/plugBackground.png'),
        options: [
          {label: lang("Next"), textAlign:'right', onSelect: () => { NavigationUtil.navigate( "ScanningForSetupCrownstones", { sphereId: this.props.sphereId }) }},
        ]
      },
      installingBuiltinZero_step1: {
        subHeader: "Is the Built-in Zero already installed?",
        backgroundImage: require('../../images/backgrounds/builtinZeroBackground.png'),
        options: [
          {label: lang("Yes__behind_a_socket_"),    nextCard: "installingBuiltin_endSocket"},
          {label: lang("Yes__at_a_ceiling_light_"), nextCard: "installingBuiltin_endLight"},
          {label: lang("Not_yet_"),                 nextCard: "installingBuiltin_step2"},
        ]
      },
      installingBuiltinOne_step1: {
        subHeader: "Is your Built-in One already installed?",
        backgroundImage: require('../../images/backgrounds/builtinOneBackground.png'),
        options: [
          {label: lang("Yes__behind_a_socket_"),    nextCard: "installingBuiltin_endSocket"},
          {label: lang("Yes__at_a_ceiling_light_"), nextCard: "installingBuiltin_endLight"},
          {label: lang("Not_yet_"),                 nextCard: "installingBuiltin_step2"},
        ]
      },
      installingBuiltin_step2: {
        header: "Installation",
        subHeader: "Do you wish to use this Crownstone behind a power socket or with a ceiling light?",
        backgroundImage: require('../../images/backgrounds/installationBackground.png'),
        options: [
          {label: lang("Behind_a_socket_"),      image: require('../../images/addCrownstone/socket.png'),        nextCard: "installingBuiltin_instructions_socket"},
          {label: lang("With_a_ceiling_light_"), image: require('../../images/addCrownstone/ceilingLights.png'), nextCard: "installingBuiltin_instructions_light"},
        ]
      },
      installingBuiltin_instructions_socket: {
        header: "Installing behind a socket",
        subHeader: "Please follow the instructions in the manual for the installation.\n\nIn future releases, we will have a complete install guide here.",
        backgroundImage: require('../../images/backgrounds/socketBackground.png'),
        options: [
          {label: lang("OK__I_have_installed_it_"),    nextCard: "installingBuiltin_endSocket"},
        ]
      },
      installingBuiltin_instructions_light: {
        header: "Installing in a ceiling light",
        subHeader: "Please follow the instructions in the manual for the installation.\n\nIn future releases, we will have a complete install guide here.",
        backgroundImage: require('../../images/backgrounds/ceilingLightBackground.png'),
        options: [
          {label: lang("OK__I_have_installed_it_"),    nextCard: "installingBuiltinOne_endLight"},
        ]
      },
      installingBuiltinOne_endSocket: {
        header: "Let's get close!",
        subHeader: "Hold your phone close to the socket with the Crownstone.\n\nMake sure the power is back on and press next to continue!",
        backgroundImage: require('../../images/backgrounds/socketBackground.png'),
        options: [
          {label: lang("Next"), textAlign:'right', onSelect: () => { NavigationUtil.navigate( "ScanningForSetupCrownstones", { sphereId: this.props.sphereId }) }},
        ]
      },
      installingBuiltinOne_endLight: {
        header: "Let's get close!",
        subHeader: "Hold your phone near the ceiling light with the Crownstone.\n\nMake sure the power is back on and press next to continue!",
        backgroundImage: require('../../images/backgrounds/ceilingLightBackground.png'),
        options: [
          {label: lang("Next"), textAlign:'right', onSelect: () => { NavigationUtil.navigate( "ScanningForSetupCrownstones", { sphereId: this.props.sphereId }) }},
        ]
      },
    }
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
          leftAction={() => { if (this._interview.back() === false) { NavigationUtil.dismissAllModals(); }}}
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
