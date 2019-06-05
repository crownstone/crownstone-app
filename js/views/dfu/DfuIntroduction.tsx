
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuIntroduction", key)(a,b,c,d,e);
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
import { core } from "../../core";
import { DfuUtil } from "../../util/DfuUtil";
import { Icon } from "../components/Icon";

export class DfuIntroduction extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false }
  };

  interviewData;
  _interview : Interview;
  constructor(props) {
    super(props);

    this.state = { releaseNotes: "Downloading...", inSphere: false }
    this.interviewData = {};
  }

  componentWillMount() {
    let state = core.store.getState();
    let sphereId = this.props.sphereId;
    let sphere = state.spheres[sphereId];
    if (sphere) {
      if (sphere.state.present === true) {
        this.setState({inSphere: true});
      }
    }

    DfuUtil.getReleaseNotes(sphereId, state.user)
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
          {label: lang("Not_right_now___"), onSelect: () => { NavigationUtil.dismissModal(); }},
          {label: lang("Lets_do_it_"), nextCard: 'updateInformation'},
        ]
      },
      updateInformation: {
        header:"Here's what's new!",
        subHeader: this.state.releaseNotes,
        optionsBottom: true,
        options: [
          {label: lang("Start_the_update_"), onSelect: () => { NavigationUtil.navigate("DfuScanning", {sphereId: this.props.sphereId})}},
        ]
      },
    }
  }

  getNotInSphereCard() : interviewCards {
    return {
      start: {
        header: "There is an update available for your Crownstones!",
        subHeader: "... but need to be in your Sphere to update your Crownstones.",
        optionsBottom: true,
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="c1-sphere" size={0.55*screenWidth} color={colors.white.rgba(1)} />
            </View>
          </View>
        ),
        options: [
          {label: lang("Ill_try_again_later_"), onSelect: () => { NavigationUtil.back() }},
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
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : "Back"}
          leftAction={() => { if (this._interview.back() === false) {NavigationUtil.dismissModal();} }}
          leftButtonStyle={{width: 300}}
          style={{backgroundColor:'transparent', paddingTop:0}}
        />
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return (this.state.inSphere ?  this.getCards() : this.getNotInSphereCard() ); }}
          update={   () => { this.forceUpdate() }}
        />
      </AnimatedBackground>
    );
  }
}

