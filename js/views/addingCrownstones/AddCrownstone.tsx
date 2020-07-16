
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
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { ScanningForSetupCrownstones } from "./ScanningForSetupCrownstones";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarImitation } from "../components/TopbarImitation";
import { Interview } from "../components/Interview";
import { LiveComponent } from "../LiveComponent";


export class AddCrownstone extends LiveComponent<any, any> {
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

  getCards() : interviewCards {
    return {
      start: {
        header:lang("Lets_add_a_Crownstone_"),
        subHeader:lang("What_sort_of_Crownstone_w"),
        optionsCenter: true,
        options: [
          {label: lang("Plug"),                       image: {source: require('../../images/addCrownstone/plugs.png')},      nextCard: 'installingPlug',              response: "A Plug it is!"},
          {label: lang("Built_in_One"),               image: {source: require('../../images/addCrownstone/builtin-v2.png')}, nextCard: 'installingBuiltinOne_step1',  response: "Let's add a Built-in One!"},
          {label: lang("Built_in_Zero"),              image: {source: require('../../images/addCrownstone/builtin-v1.png')}, nextCard: 'installingBuiltinZero_step1', response: "Let's add a Built-in Zero!"},
          {label: lang("I_dont_have_nCrownstones_y"), image: {source: require('../../images/addCrownstone/buy.png')},        nextCard: 'buy',                         response: "Let's buy Crownstones!"},
        ]
      },
      buy: {
        textColor: colors.white.hex,
        subHeader: lang("Tap_the_button_below_to_g"),
        backgroundImage: require('../../images/backgrounds/builtinDarkBackground.png'),
        optionsBottom: true,
        options: [
          {label: lang("Visit_the_Shop_"), textAlign:'right', onSelect: () => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}); }},
        ]
      },
      installingPlug: {
        subHeader:lang("Insert_the_plug_into_a_po"),
        backgroundImage: require('../../images/backgrounds/plugBackground.png'),
        options: [
          {label: lang("Next"), textAlign:'right', onSelect: () => { NavigationUtil.navigate( "ScanningForSetupCrownstones", { sphereId: this.props.sphereId }) }},
        ]
      },
      installingBuiltinZero_step1: {
        subHeader: lang("Is_the_Built_in_Zero_alre"),
        backgroundImage: require('../../images/backgrounds/builtinZeroBackground.png'),
        options: [
          {label: lang("Yes__behind_a_socket_"),    nextCard: "installingBuiltin_endSocket"},
          {label: lang("Yes__at_a_ceiling_light_"), nextCard: "installingBuiltin_endLight"},
          {label: lang("Not_yet_"),                 nextCard: "installingBuiltin_step2"},
        ]
      },
      installingBuiltinOne_step1: {
        subHeader: lang("Is_your_Built_in_One_alre"),
        backgroundImage: require('../../images/backgrounds/builtinOneBackground.png'),
        options: [
          {label: lang("Yes__behind_a_socket_"),    nextCard: "installingBuiltin_endSocket"},
          {label: lang("Yes__at_a_ceiling_light_"), nextCard: "installingBuiltin_endLight"},
          {label: lang("Not_yet_"),                 nextCard: "installingBuiltin_step2"},
        ]
      },
      installingBuiltin_step2: {
        header: lang("Installation"),
        subHeader: lang("Do_you_wish_to_use_this_C"),
        backgroundImage: require('../../images/backgrounds/installationBackground.png'),
        options: [
          {label: lang("Behind_a_socket_"),      image: {source: require('../../images/addCrownstone/socket.png')},        nextCard: "installingBuiltin_instructions_socket"},
          {label: lang("With_a_ceiling_light_"), image: {source: require('../../images/addCrownstone/ceilingLights.png')}, nextCard: "installingBuiltin_instructions_light"},
        ]
      },
      installingBuiltin_instructions_socket: {
        header: lang("Installing_behind_a_socke"),
        subHeader: lang("Please_follow_the_instruc"),
        backgroundImage: require('../../images/backgrounds/socketBackground.png'),
        options: [
          {label: lang("OK__I_have_installed_it_"),    nextCard: "installingBuiltin_endSocket"},
        ]
      },
      installingBuiltin_instructions_light: {
        header: lang("Installing_in_a_ceiling_l"),
        subHeader: lang("Please_follow_the_instruct"),
        backgroundImage: require('../../images/backgrounds/ceilingLightBackground.png'),
        options: [
          {label: lang("OK__I_have_installed_it_"),    nextCard: "installingBuiltin_endLight"},
        ]
      },
      installingBuiltin_endSocket: {
        header: lang("Lets_get_close_"),
        subHeader: lang("Hold_your_phone_close_to_"),
        backgroundImage: require('../../images/backgrounds/socketBackground.png'),
        options: [
          {label: lang("Next"), textAlign:'right', onSelect: () => { NavigationUtil.navigate( "ScanningForSetupCrownstones", { sphereId: this.props.sphereId }) }},
        ]
      },
      installingBuiltin_endLight: {
        header: lang("Lets_get_close_"),
        subHeader: lang("Hold_your_phone_near_the_"),
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
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideNotifications={true} hideOrangeLine={true} dimStatusBar={true}>
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : lang("Back")}
          leftAction={() => {
            if (this._interview.back() === false) { NavigationUtil.dismissModal(); }}}
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
