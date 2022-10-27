
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SceneSelectCrownstones", key)(a,b,c,d,e);
}
import { LiveComponent } from "../LiveComponent";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Alert, Platform, View } from "react-native";
import { availableModalHeight, colors } from "../styles";
import { Interview } from "../components/Interview";
import * as React from "react";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { getStoneSelectionList } from "./SceneAdd";
import { SafeAreaView } from "react-native-safe-area-context";
import {CustomTopBarWrapper} from "../components/CustomTopBarWrapper";

export class SceneSelectCrownstones extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  _interview;
  sceneData;

  constructor(props) {
    super(props);

    this.sceneData =  {
      data: this.props.data,
    };
  }

  getStoneSelectionList(sphereId) {
    return getStoneSelectionList(sphereId, this.sceneData, () => { this.forceUpdate(); });
  }


  getCards() : interviewCards {
    return {
      start: {
        header: lang("Whos_participating_"),
        subHeader: lang("Select_the_Crownstones_wh"),
        optionsAlwaysOnTop: true,
        backgroundImage: require("../../../assets/images/backgrounds/plugBackgroundFade.jpg"),
        textColor: colors.white.hex,
        explanation: lang("Crownstones_that_are_not_"),
        component:
          <View style={{paddingBottom:50}}>
            { this.getStoneSelectionList(this.props.sphereId) }
          </View>,
        options: [{label: lang("Select"), textAlign:'right', onSelect: (result) => {
          let stonesSelected = Object.keys(this.sceneData.data).length > 0;
          if (!stonesSelected) {
            Alert.alert(
lang("_Select_at_least_one______header"),
lang("_Select_at_least_one______body"),
[{text:lang("_Select_at_least_one______left")}]);
            return false;
          }

          this.props.callback(this.sceneData.data); NavigationUtil.dismissModal(); }}]
      },
    }
  }

  render() {
    let backgroundImage = require('../../../assets/images/backgrounds/plugBackgroundFade.jpg');
    let textColor = colors.white.hex;
    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage}>
        <CustomTopBarWrapper
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : lang("Cancel")}
          leftAction={() => { if (this._interview.back() === false) {
            if (this.props.isModal !== false) {
              NavigationUtil.dismissModal();
            }
            else {
              NavigationUtil.back();
            }
          }}}
          leftButtonStyle={{width: 300}} style={{backgroundColor:'transparent', paddingTop:0}}
        >
        <Interview
          backButtonOverrideViewNameOrId={ "sceneSelectCrownstones" }
          scrollEnabled={false}
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
          // height={ this.props.height || availableModalHeight }
        />
        </CustomTopBarWrapper>
      </AnimatedBackground>
    );
  }
}

