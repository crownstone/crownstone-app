
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuIntroduction", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Platform,
} from "react-native";
import { colors} from "../styles";
import { Pagination } from 'react-native-snap-carousel';
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarImitation } from "../components/TopbarImitation";
import { Interview } from "../components/Interview";
import { LiveComponent } from "../LiveComponent";
import { core } from "../../core";
import { DfuUtil } from "../../util/DfuUtil";

export class DfuIntroduction extends LiveComponent<any, any> {
  static navigationOptions = {
    header: null
  };

  interviewData;
  _interview : Interview;
  constructor(props) {
    super(props);

    this.state = { releaseNotes: "Downloading..." }
    this.interviewData = {};
  }

  componentWillMount() {
    let state = core.store.getState();
    let sphereId = this.props.sphereId || Object.keys(state.spheres)[0];

    DfuUtil.getReleaseNotes(sphereId, state.user.config)
      .then((notes) => {
        this.setState({ releaseNotes: notes });
      })
  }


  getCards() : interviewCards {
    return {
      start: {
        header:"There is an update available for your Crownstones!",
        subHeader:"This process can take a few minutes. Would you like to start now?",
        optionsBottom: true,
        options: [
          {label: lang("Not_right_now___"), onSelect: () => { NavigationUtil.back() }},
          {label: lang("Lets_do_it_"),     nextCard: 'updateInformation'},
        ]
      },
      updateInformation: {
        header:"Here's what's new!",
        subHeader: this.state.releaseNotes,
        optionsBottom: true,
        options: [
          {label: lang("Start_the_update_"), onSelect: () => { NavigationUtil.navigateAndReplace("DfuScanning", {sphereId: this.props.sphereId})}},
        ]
      },
    }
  }


  render() {
    let backgroundImage = require('../../images/backgrounds/upgradeBackgroundSoft.png');
    let textColor = colors.black.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor = this._interview.getTextColorFromCard() || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideOrangeBar={true} dimStatusBar={true}>
        <TopbarImitation leftStyle={{color: textColor}} left={Platform.OS === 'android' ? null : "Back to overview"} leftAction={() => { NavigationUtil.backTo("Main"); }} leftButtonStyle={{width: 300}} style={{backgroundColor:'transparent', paddingTop:0}} />
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
        />
      </AnimatedBackground>
    );
  }
}

