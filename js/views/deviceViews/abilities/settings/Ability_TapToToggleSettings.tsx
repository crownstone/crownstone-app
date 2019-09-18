import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Switch,
  Text, TouchableOpacity,
  View
} from "react-native";


import { colors, screenHeight, screenWidth, styles } from "../../../styles";
import {Background} from "../../../components/Background";
import {IconButton} from "../../../components/IconButton";
import {ScaledImage} from "../../../components/ScaledImage";
import { core } from "../../../../core";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { Separator } from "../../../components/Separator";
import { ButtonBar } from "../../../components/editComponents/ButtonBar";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { NavigationBar } from "../../../components/editComponents/NavigationBar";
import Slider from "@react-native-community/slider";
import { SliderBar } from "../../../components/editComponents/SliderBar";


export class Ability_TapToToggleSettings extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Tap to Toggle Settings"});
  }

  constructor(props) {
    super(props);

    let stone = core.store.getState().spheres[this.props.sphereId].stones[this.props.stoneId];
    let rssiOffset = stone.abilities.tapToToggle.rssiOffset;
    this.state = {rssiOffset: rssiOffset}
  }

  disable() {
    core.store.dispatch({type:"UPDATE_TAP_TO_TOGGLE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: { targetState: false, synced:false }});
    NavigationUtil.back();
  }

  _getExplanation(rssiOffset) {
    if (!rssiOffset || rssiOffset === 0) {
      return "Same as all Crownstones."
    }
    else if (rssiOffset > 0 && rssiOffset <= 5) {
      return "Requires the phone to be closer compared to the other Crownstones."
    }
    else if (rssiOffset > 5) {
      return "Requires the phone to be much closer compared to the other Crownstones."
    }
    else if (rssiOffset < 0 && rssiOffset >= -5) {
      return "Reacts sooner compared than the other Crownstones."
    }
    else if (rssiOffset < -5) {
      return "Reacts much sooner than the other Crownstones."
    }
  }

  render() {
    let stone = core.store.getState().spheres[this.props.sphereId].stones[this.props.stoneId];
    let rssiOffset = stone.abilities.tapToToggle.rssiOffset;

    return (
      <Background hasNavBar={false} image={core.background.lightBlurLighter}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../../images/overlayCircles/tapToToggle.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.2*screenHeight} />
            <View style={{height:40}} />
            <Text style={styles.boldExplanation}>{ "If you don't want to open the app to toggle a specific Crownstone, just hold your phone against it!" }</Text>
            <Text style={styles.explanation}>{ "Your phone broadcasts a signal that the Crownstones can pick up! The minimum distance your phone will toggle "}<Text style={{fontWeight:'bold'}}>ANY</Text>{" Crownstone is configured in the app settings." }</Text>
            <Text style={styles.explanation}>{ "If you want "}<Text style={{fontWeight:'bold'}}>this specific Crownstone</Text>{" to trigger closer or further away than the others, you can change its sensitivity here." }</Text>
            <Text style={styles.explanation}>{ "Tap to toggle is not meant to replace presence based behaviour." }</Text>
            <Text style={styles.explanation}>{ "Less sensitive means you have to be closer in order to trigger tap to toggle." }</Text>
            <View style={{height:10}} />
            <View style={{width:screenWidth}}>
              <Separator fullLength={true} />
              <SliderBar
                label={"Distance offset:"}
                largeIcon={<IconButton name="ios-options" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.menuTextSelected.hex}} />}
                callback={(value) => {
                  core.store.dispatch({type:"UPDATE_TAP_TO_TOGGLE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: { rssiOffset:value, synced:false }});
                  this.setState({rssiOffset: value})
                }}
                min={-10}
                max={10}
                value={rssiOffset}
                explanation={this._getExplanation(rssiOffset)}
              />
              <Separator  />
              <NavigationBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-information-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}} />}
                label={"More information"}
                callback={() => { this.props.information(); }}
              />
              <Separator  />
              <ButtonBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-remove-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />}
                label={"Disable Tap to toggle"}
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