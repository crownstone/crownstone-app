
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Ability_TapToToggleSettings", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from "react-native";


import { background, colors, screenHeight, screenWidth, styles } from "../../../styles";
import {Background} from "../../../components/Background";
import {IconButton} from "../../../components/IconButton";
import {ScaledImage} from "../../../components/ScaledImage";
import { core } from "../../../../Core";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { Separator } from "../../../components/Separator";
import { ButtonBar } from "../../../components/editComponents/ButtonBar";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { NavigationBar } from "../../../components/editComponents/NavigationBar";
import { SliderBar } from "../../../components/editComponents/SliderBar";
import { Explanation } from "../../../components/editComponents/Explanation";


export class Ability_TapToToggleSettings extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Tap_to_Toggle_Settings")});
  }

  constructor(props) {
    super(props);

    let stone = core.store.getState().spheres[this.props.sphereId].stones[this.props.stoneId];
    let rssiOffset = Number(stone.abilities.tapToToggle.rssiOffsetTarget);
    this.state = {rssiOffset: rssiOffset}
  }

  disable() {
    core.store.dispatch({type:"UPDATE_ABILITY_TAP_TO_TOGGLE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: { enabledTarget: false }});
    NavigationUtil.back();
  }

  _getExplanation(rssiOffset) {
    if (!rssiOffset || rssiOffset === 0) {
      return lang("Same_as_all_Crownstones_")
    }
    else if (rssiOffset > 0 && rssiOffset <= 5) {
      return lang("Requires_the_phone_to_be_")
    }
    else if (rssiOffset > 5) {
      return lang("Requires_the_phone_to_be_m")
    }
    else if (rssiOffset < 0 && rssiOffset >= -5) {
      return lang("Reacts_sooner_compared_to")
    }
    else if (rssiOffset < -5) {
      return lang("Reacts_much_sooner_than_t")
    }
  }

  render() {
    let stone = core.store.getState().spheres[this.props.sphereId].stones[this.props.stoneId];
    let rssiOffsetTarget = Number(stone.abilities.tapToToggle.rssiOffsetTarget);
    return (
      <Background hasNavBar={false} image={background.lightBlurLighter}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../../../assets/images/overlayCircles/tapToToggle.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.2*screenHeight} />
            <View style={{height:40}} />
            <Text style={styles.boldExplanation}>{ lang("If_you_dont_want_to_open_") }</Text>
            <Text style={styles.explanation}>{ lang("Your_phone_broadcasts_a_s") }</Text>
            <Text style={styles.explanation}>{ "If you want "}<Text style={{fontWeight:'bold'}}>{ lang("this_specific_Crownstone") }</Text>{" to toggle closer or further away than the others, you can set a distance offset here." }</Text>
            <Text style={styles.explanation}>{ lang("Tap_to_toggle_is_not_mean") }</Text>
            <View style={{height:10}} />
            <View style={{width:screenWidth}}>
              <Explanation text={ lang("CHANGE_TAP_TO_TOGGLE_DIST")} />
              <Separator fullLength={true} />
              <NavigationBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="ios-options" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex}} />}
                label={ lang("All_Crownstones")}
                callback={() => { NavigationUtil.launchModal("SettingsApp", {modal:true}) }}
              />
              <Separator  />
              <SliderBar
                label={ lang("Only_this_Crownstone")}
                sliderHidden={true}
                largeIcon={<IconButton name="ios-options" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.blue.hex}} />}
                callback={(value) => {
                  core.store.dispatch({type:"UPDATE_ABILITY_TAP_TO_TOGGLE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: { rssiOffsetTarget: value }});
                  this.setState({rssiOffset: value})
                }}
                min={-10}
                max={10}
                value={this.state.rssiOffset}
                explanation={this._getExplanation(this.state.rssiOffset)}
              />
              <Separator  />
              <NavigationBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-information-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}} />}
                label={ lang("More_information")}
                callback={() => { this.props.information(); }}
              />
              <Separator fullLength={true}/>
              <Explanation text={ lang("DISABLE_FOR_ONLY_THIS_CRO")} />
              <Separator fullLength={true}/>
              <ButtonBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-remove-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />}
                label={ lang("Disable_Tap_to_toggle")}
                callback={() => { this.disable() }}
              />
              <Separator fullLength={true} />
            </View>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}