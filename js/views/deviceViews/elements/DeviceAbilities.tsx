import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSummary", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text,
  View, ViewStyle, TextStyle, ScrollView, TouchableOpacity, Switch, Linking, ActivityIndicator
} from "react-native";

import {
  colors,
  screenWidth,
  availableModalHeight,
  deviceStyles
} from "../../styles";
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { AnimatedScaledImage } from "../../components/animated/AnimatedScaledImage";
import { Icon } from "../../components/Icon";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { STONE_TYPES } from "../../../Enums";

export class DeviceAbilities extends LiveComponent<any, any> {
  static options(props) {
    const stone = core.store.getState().spheres[props.sphereId].stones[props.stoneId];
    return TopBarUtil.getOptions({ title: stone.config.name,closeModal: true,});
  }

  unsubscribeStoreEvents;

  constructor(props) {
    super(props);
    this.state = {};
  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.stoneChangeAbilities && change.stoneChangeAbilities.stoneIds[this.props.stoneId]) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {

  }



  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];

    let hasSwitchcraft = stone.config.type === STONE_TYPES.builtinOne;
    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ "My Abilities" }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{ "These are the things I can do for you!\nYou can enable or disable my abilities\nto suit your needs."}</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Ability type={"dimming"}     stone={stone} stoneId={this.props.stoneId} sphereId={this.props.sphereId} />
            { hasSwitchcraft && <Ability type={"switchcraft"} stone={stone} stoneId={this.props.stoneId} sphereId={this.props.sphereId} /> }
            <Ability type={"tapToToggle"} stone={stone} stoneId={this.props.stoneId} sphereId={this.props.sphereId} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}


function Ability(props : { type: string, stone: any, stoneId: string, sphereId: string }) {
  let height  = 100;
  let margins = 30;

  let active = getActiveState(props.stone, props.type);
  let synced = getSyncedState(props.stone, props.type);
  let data = getData(props, active);
  let helpColor = colors.black.rgba(0.5);

  return (
    <View style={{width:screenWidth, marginBottom: margins}}>
      <View style={{flexDirection:'row', width: screenWidth-margins, height:height, marginLeft:margins, borderRadius:0.5*height, borderBottomRightRadius: 0, borderTopRightRadius: 0, backgroundColor: colors.white.hex, marginBottom:5, padding:5, paddingRight:10}}>
        <AnimatedScaledImage source={data.image} sourceWidth={600} sourceHeight={600} targetHeight={height-10} />
        <View style={{height: height-10, justifyContent:'center', alignItems:'flex-start', marginLeft:10}}>
          <View style={{flexDirection:'row'}}>
            <Text style={deviceStyles.text}>{data.label}</Text>
            { active && !synced ? <ActivityIndicator color={colors.csBlueDark.hex} size={'small'} style={{marginLeft:10}}/> : undefined }
          </View>
          { active && !synced ? <Text style={[deviceStyles.explanationText, {marginTop:3, textAlign:'left'}]}>{"Waiting to notify the\nCrownstone..."}</Text> : undefined}
          { active && synced  ? <Text style={[deviceStyles.explanationText, {marginTop:3}]}>{"Enabled"}</Text> : undefined}
        </View>
        <View style={{flex:1, flexDirection:'row', justifyContent:'flex-end', alignItems:'center'}}>
          <TouchableOpacity onPress={() => { data.infoCallback(); }} style={{borderColor: helpColor, borderWidth: 1, width:30, height:30, borderRadius:15, alignItems:'center', justifyContent:'center'}}>
            <Text style={{color: helpColor, fontSize: 20, fontWeight:'300'}}>?</Text>
          </TouchableOpacity>
          { active ?
            <TouchableOpacity onPress={() => { data.settingsCallback(); }} style={{paddingLeft:10}}>
              <Icon name={'ios-settings'} color={colors.csBlueDark.rgba(0.8)} size={35} />
            </TouchableOpacity> :
            <Switch value={false} style={{marginLeft:10}} onValueChange={() => { data.activateCallback(); }} />
          }
        </View>
      </View>
      <Explanation margin={margins+0.25*height} label={data.explanation} />
    </View>
  )
}

function getActiveState(stone, type) {
  switch (type) {
    case 'dimming':
      return stone.abilities.dimming.enabled;
    case 'switchcraft':
      return stone.abilities.switchcraft.enabled;
    case 'tapToToggle':
      return stone.abilities.tapToToggle.enabled;
  }
}

function getSyncedState(stone, type) {
  switch (type) {
    case 'dimming':
      return stone.abilities.dimming.synced;
    case 'switchcraft':
      return stone.abilities.switchcraft.synced;
    case 'tapToToggle':
      return stone.abilities.tapToToggle.synced;
  }
}

function getData(props, active) {
  switch (props.type) {
    case 'dimming':
      if (active) {
        return {
          image: require('../../../images/overlayCircles/dimmingCircleGreen.png'),
          label: 'Dimming',
          infoCallback: () => {  Linking.openURL('https://crownstone.rocks/compatibility/dimming/').catch(() => {}) },
          settingsCallback: () => { },
          activateCallback: () => { },
          explanation: "Dimming can be enabled per Crownstone. It is up to you to make sure you are not dimming anything other than lights. To do so it at your own risk."
        }
      }
      return {
        image: require('../../../images/overlayCircles/dimmingCircleGreen_bw.png'),
        label: 'Dimming',
        infoCallback: () => { Linking.openURL('https://crownstone.rocks/compatibility/dimming/').catch(() => {}) },
        settingsCallback: () => { },
        activateCallback: () => { core.store.dispatch({type:"UPDATE_DIMMER", sphereId: props.sphereId, stoneId: props.stoneId, data: { enabled: true, synced:false }}); },
        explanation: "Dimming can be enabled per Crownstone. It is up to you to make sure you are not dimming anything other than lights. To do so it at your own risk."
      }
    case 'switchcraft':
      if (active) {
        return {
          image: require('../../../images/overlayCircles/switchcraft.png'),
          label: 'Switchcraft',
          infoCallback: () => { NavigationUtil.navigate("SwitchCraftInformation"); },
          settingsCallback: () => { },
          activateCallback: () => { },
          explanation: "Use modified wall switches to switch both the Crownstone and the light. Tap the questionmark for more information."
        }
      }
      return {
        image: require('../../../images/overlayCircles/switchcraft_bw.png'),
        label: 'Switchcraft',
        infoCallback: () => { NavigationUtil.navigate("SwitchCraftInformation"); },
        settingsCallback: () => { },
        activateCallback: () => { core.store.dispatch({type:"UPDATE_SWITCHCRAFT", sphereId: props.sphereId, stoneId: props.stoneId, data: { enabled: true, synced:false }}); },
        explanation: "Use modified wall switches to switch both the Crownstone and the light. Tap the questionmark for more information."
      }
    case 'tapToToggle':
      if (active) {
        return {
          image: require('../../../images/overlayCircles/tapToToggle.png'),
          label: 'Tap to toggle',
          infoCallback: () => { NavigationUtil.navigate("TapToToggleInformation"); },
          settingsCallback: () => { },
          activateCallback: () => { },
          explanation: "You can tap your phone against this Crownstone toggle it on or off." // Todo: make dynamic for builtins/builtin ones/app settings general enable or disable of TapToToggle
        }
      }
      return {
        image: require('../../../images/overlayCircles/tapToToggle_bw.png'),
        label: 'Tap to toggle',
        infoCallback: () => { NavigationUtil.navigate("TapToToggleInformation");},
        settingsCallback: () => { },
        activateCallback: () => { core.store.dispatch({type:"UPDATE_TAP_TO_TOGGLE", sphereId: props.sphereId, stoneId: props.stoneId, data: { enabled: true, synced:false }}); },
        explanation: "You can tap your phone against this Crownstone toggle it on or off. To adjust the distance sensitivity of your phone to all Crownstones, take a look at the Settings -> App Settings." +
          " You can customize the sensitivity of this particular Crownstone by tapping on the cogwheel."
      }
  }
}


function Explanation(props : {label:string, margin: number}) {
  return (
    <View style={{width: screenWidth, alignItems:'flex-end'}}>
      <Text style={[deviceStyles.explanation,{textAlign: 'right', width: screenWidth-props.margin, fontSize:12}]}>{props.label}</Text>
    </View>
  )
}
