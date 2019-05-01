import * as React from 'react'; import { Component } from 'react';
import {
  Linking,
  Platform, ScrollView, StatusBar,
  Text, TextStyle,
  View, ViewStyle
} from "react-native";
import { availableModalHeight, availableScreenHeight, colors, screenHeight, screenWidth } from "../styles";
import { AicoreUtil } from "../deviceViews/elements/smartBehaviour/supportCode/AicoreUtil";
import { core } from "../../core";
import { Background } from "../components/Background";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { FadeIn } from "../components/animated/FadeInView";
import {
  TextButtonLight,
  TextButtonSemitranslucentDark,
  TimeButtonWithImage,
  TextButtonWithLargeImage
} from "../components/InterviewComponents";
import { ScaledImage } from "../components/ScaledImage";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { ScanningForSetupCrownstones } from "./ScanningForSetupCrownstones";
import { TopbarBackButton } from "../components/topbar/TopbarButton";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarImitation } from "../components/TopbarImitation";
import { Interview } from "../components/Interview";
import { LiveComponent } from "../LiveComponent";

let headerStyle : TextStyle = {
  paddingLeft: 15,
  paddingRight: 15,
  marginTop: 20,
  fontSize: 28,
  fontWeight: "bold",
  color: colors.csBlueDark.hex
};

let subHeaderStyle : TextStyle = {
  padding: 15,
  marginTop: 20,
  fontSize: 21,
  fontWeight: "bold",
  color: colors.csBlueDark.hex
};

export class AddCrownstone extends LiveComponent<any, any> {
  static navigationOptions = {
    header: null
  };

  interviewState
  interviewData

  _interview
  responseHeaders : any;
  selectedOptions = [];
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


    this.state = { activeSlide : 0, slides: [this.getCards().start], slideIds: ['start'], finished: false, transitioningToSlide: undefined };

    this.selectedOptions = [];
    this.responseHeaders = {};
  }

  getCards() : interviewCards {
    return {
      start: {
        header:"Let's add a Crownstone!",
        subHeader:"What sort of Crownstone would you like to add?",
        optionsCenter: true,
        options: [
          {label: "Plug",          image: require('../../images/addCrownstone/plugs.png'),      nextCard: 'installingPlug',              response: "A Plug it is!"},
          {label: "Built-in One",  image: require('../../images/addCrownstone/builtin-v2.png'), nextCard: 'installingBuiltinOne_step1',  response: "Let's add second generation Built-in!"},
          {label: "Built-in Zero", image: require('../../images/addCrownstone/builtin-v1.png'), nextCard: 'installingBuiltinZero_step1', response: "Let's add a Built-in!"},
          {label: "I don't have\nCrownstones yet...", image: require('../../images/addCrownstone/buy.png'), nextCard: 'buy',             response: "Let's buy Crownstones!"},
        ]
      },
      buy: {
        textColor: colors.white.hex,
        subHeader: "Tap the button below to go to the shop!",
        backgroundImage: require('../../images/backgrounds/builtinDarkBackground.png'),
        optionsBottom: true,
        options: [
          {label: "Visit the Shop!", textAlign:'right', onSelect: () => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}); }},
        ]
      },
      installingPlug: {
        subHeader:"Insert the plug into a power outlet and hold your phone close by. Tap next when you're ready!",
        backgroundImage: require('../../images/backgrounds/plugBackground.png'),
        options: [
          {label: "Next", textAlign:'right', onSelect: () => { NavigationUtil.navigate("ScanningForSetupCrownstones", { sphereId: this.props.sphereId }) }},
        ]
      },
      installingBuiltinZero_step1: {
        subHeader: "Is the Built-in Zero already installed?",
        backgroundImage: require('../../images/backgrounds/builtinZeroBackground.png'),
        options: [
          {label: "Yes, behind a socket.", nextCard: "installingBuiltin_endSocket"},
          {label: "Yes, at a ceiling light.", nextCard: "installingBuiltin_endLight"},
          {label: "Not yet!", nextCard: "installingBuiltinZero_step2"},
        ]
      },
      installingBuiltinOne_step1: {
        subHeader: "Is your Built-in One already installed?",
        backgroundImage: require('../../images/backgrounds/builtinOneBackground.png'),
        options: [
          {label: "Yes, behind a socket.", nextCard: "installingBuiltinOne_endSocket"},
          {label: "Yes, at a ceiling light.", nextCard: "installingBuiltinOne_endLight"},
          {label: "Not yet!", nextCard: "installingBuiltinOne_step2"},
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
        <TopbarImitation leftStyle={{color: textColor}} left={Platform.OS === 'android' ? null : "Back to overview"} leftAction={() => { NavigationUtil.back(); }} leftButtonStyle={{width: 300}} style={{backgroundColor:'transparent', paddingTop:0}} />
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
        />
      </AnimatedBackground>
    );
  }
}
