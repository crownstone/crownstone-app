import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceAbilities", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text,
  View, ScrollView, TouchableOpacity, Switch, Linking, ActivityIndicator
} from "react-native";

import {
  colors,
  screenWidth,
  availableModalHeight,
  deviceStyles, background
} from "../styles";
import { core } from "../../Core";
import { Background } from "../components/Background";
import { TopBarUtil } from "../../util/TopBarUtil";
import { AnimatedScaledImage } from "../components/animated/AnimatedScaledImage";
import { Icon } from "../components/Icon";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { STONE_TYPES } from "../../Enums";
import { SlideFadeInView } from "../components/animated/SlideFadeInView";
import { FadeInView } from "../components/animated/FadeInView";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { ABILITY_TYPE_ID } from "../../database/reducers/stoneSubReducers/abilities";
import {SettingsBackground} from "../components/SettingsBackground";
import {Get} from "../../util/GetUtil";
import {StoneUtil} from "../../util/StoneUtil";

export class DeviceAbilities extends LiveComponent<any, any> {
  static options(props) {
    const stone = Get.stone(props.sphereId, props.stoneId);
    return {
      topBar: {
        title: {text: stone?.config?.name},
      }
    }
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

      if (
        change.stoneSyncedAbilities && change.stoneSyncedAbilities.stoneIds[this.props.stoneId] ||
        change.stoneChangeAbilities && change.stoneChangeAbilities.stoneIds[this.props.stoneId]
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];

    let permissionGranted = Permissions.inSphere(this.props.sphereId).canChangeAbilities;

    let canSwitch      = StoneUtil.canSwitch(stone);
    let hasSwitchcraft = StoneUtil.canSwitchCraft(stone);
    let canDim         = StoneUtil.canDim(stone);

    return (
      <SettingsBackground testID={'DeviceAbilities'}>
        <ScrollView style={{width: screenWidth}} contentContainerStyle={{flexGrow:1}}>
          <View style={{ flexGrow: 1, alignItems:'center', paddingTop:30 }}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ lang("My_Abilities") }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{ lang("These_are_the_things_I_ca",permissionGranted) }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            { canDim         && <Ability type={ lang("dimming")}     stone={stone} stoneId={this.props.stoneId} sphereId={this.props.sphereId} permissionGranted={permissionGranted}/> }
            { hasSwitchcraft && <Ability type={ lang("switchcraft")} stone={stone} stoneId={this.props.stoneId} sphereId={this.props.sphereId} permissionGranted={permissionGranted}/> }
            { canSwitch      && <Ability type={ lang("tapToToggle")} stone={stone} stoneId={this.props.stoneId} sphereId={this.props.sphereId} permissionGranted={permissionGranted}/> }
          </View>
        </ScrollView>
      </SettingsBackground>
    )
  }
}


function Ability(props : { type: string, stone: any, stoneId: string, sphereId: string, permissionGranted: boolean }) {
  let padding = 8;
  let height  = 90+2*padding;
  let margins = 30;
  let imageSize = height-2*padding;

  let fullyDisabled = getDisabledState(props.stone, props.type);
  let active = getActiveState(props.stone, props.type);
  let synced = getSyncedState(props.stone, props.type);
  let data = getData(props, props.stone, active);
  let helpColor = colors.black.rgba(0.5);
  // synced = false
  return (
    <View style={{width:screenWidth, marginBottom: margins}}>
      <View style={{flexDirection:'row', width: screenWidth-margins, height:height, marginLeft:margins, borderRadius:0.5*height, borderBottomRightRadius: 0, borderTopRightRadius: 0, backgroundColor: colors.white.hex, marginBottom:5, padding:padding, paddingRight:10}}>
        <AnimatedScaledImage source={data.image} sourceWidth={600} sourceHeight={600} targetHeight={imageSize} />
        <View style={{height: height-2*padding, justifyContent:'center', alignItems:'flex-start', marginLeft:10, width: screenWidth - margins - imageSize - 120}}>
          <View style={{flexDirection:'row'}}>
            <Text style={{...deviceStyles.text, textAlign:'left'}}>{data.label}</Text>
            <FadeInView visible={!synced}><ActivityIndicator color={colors.csBlueDark.hex} size={ "small"} style={{marginLeft:10}}/></FadeInView>
          </View>
          <SlideFadeInView visible={!synced} height={40} style={{alignItems:'center'}}>
            <Text style={[deviceStyles.explanationText, {marginTop:3, textAlign:'left'}]}>{ lang("Waiting_to_notify_the_nCr") }</Text>
          </SlideFadeInView>
          { active && synced  ? <Text style={[deviceStyles.explanationText, {marginTop:3}]}>{ lang("Enabled") }</Text> : undefined}
        </View>
        <View style={{flex:1, flexDirection:'row', justifyContent:'flex-end', alignItems:'center'}}>
          <TouchableOpacity testID={`${props.type}_information`} onPress={() => { data.infoCallback(); }} style={{borderColor: helpColor, borderWidth: 1, width:30, height:30, borderRadius:15, alignItems:'center', justifyContent:'center'}}>
            <Text style={{color: helpColor, fontSize: 20, fontWeight:'300'}}>?</Text>
          </TouchableOpacity>
          {active && props.permissionGranted && (
            <TouchableOpacity onPress={() => {
              data.settingsCallback();
            }} style={{ paddingLeft: 10 }}>
              <Icon name={'ios-settings'} color={colors.csBlueDark.rgba(0.8)} size={35}/>
            </TouchableOpacity>)
          }
          { !active && props.permissionGranted && <Switch value={false} disabled={fullyDisabled} style={{marginLeft:10}} onValueChange={() => { data.activateCallback(); }} testID={`${props.type}_toggle`} /> }
        </View>
      </View>
      <Explanation margin={margins+0.25*height} label={data.explanation} />
    </View>
  )
}

function getDisabledState(stone, type) {
  switch (type) {
    case 'dimming':
    case 'switchcraft':
      return false;
    case 'tapToToggle':
      let state = core.store.getState();
      return !state.app.tapToToggleEnabled;
  }
}
function getActiveState(stone, type) {
  switch (type) {
    case 'dimming':
      return stone.abilities.dimming.enabledTarget;
    case 'switchcraft':
      return stone.abilities.switchcraft.enabledTarget;
    case 'tapToToggle':
      let state = core.store.getState();
      let tapToToggleEnabledGlobally = state.app.tapToToggleEnabled;
      return tapToToggleEnabledGlobally && stone.abilities.tapToToggle.enabledTarget;
  }
}

function getSyncedState(stone, type) {
  switch (type) {
    case 'dimming':
      return stone.abilities.dimming.syncedToCrownstone;
    case 'switchcraft':
      return stone.abilities.switchcraft.syncedToCrownstone;
    case 'tapToToggle':
      return stone.abilities.tapToToggle.syncedToCrownstone;
  }
}

function getData(props, stone, active) {
  let propsToPass = {stoneId: props.stoneId, sphereId: props.sphereId, information: null}
  switch (props.type) {
    case 'dimming':
      propsToPass.information = () => { Linking.openURL(Languages.activeLocale === "nl_nl" ? 'https://crownstone.rocks/nl/compatibility/dimming/' : 'https://crownstone.rocks/compatibility/dimming/').catch(() => {}) };
      if (active) {
        return {
          image: require('../../../assets/images/overlayCircles/dimmingCircleGreen.png'),
          label: lang("Dimming"),
          infoCallback: propsToPass.information,
          settingsCallback: () => { NavigationUtil.navigate("Ability_DimmerSettings", propsToPass); },
          activateCallback: () => { },
          explanation: lang("Dimming_can_be_enabled_pe")
        }
      }
      return {
        image: require('../../../assets/images/overlayCircles/dimmingCircleGreen_bw.png'),
        label: lang("Dimming"),
        infoCallback: propsToPass.information,
        settingsCallback: () => {  },
        activateCallback: () => { core.store.dispatch({type:"UPDATE_ABILITY", sphereId: props.sphereId, stoneId: props.stoneId, abilityId: ABILITY_TYPE_ID.dimming, data: { enabledTarget: true }}); },
        explanation: lang("Dimming_can_be_enabled_pe")
      }
    case 'switchcraft':
      propsToPass.information = () => { NavigationUtil.navigate("Ability_SwitchcraftInformation"); };
      if (active) {
        return {
          image: require('../../../assets/images/overlayCircles/switchcraft.png'),
          label: lang("Switchcraft"),
          infoCallback: propsToPass.information,
          settingsCallback: () => { NavigationUtil.navigate("Ability_SwitchcraftSettings", propsToPass); },
          activateCallback: () => { },
          explanation: lang("Use_modified_wall_switche")
        }
      }
      return {
        image: require('../../../assets/images/overlayCircles/switchcraft_bw.png'),
        label: lang("Switchcraft"),
        infoCallback: propsToPass.information,
        settingsCallback: () => { },
        activateCallback: () => { core.store.dispatch({type:"UPDATE_ABILITY", sphereId: props.sphereId, stoneId: props.stoneId, abilityId: ABILITY_TYPE_ID.switchcraft, data: { enabledTarget: true }}); },
        explanation: lang("Use_modified_wall_switche")
      }
    case 'tapToToggle':
      let state = core.store.getState();
      let tapToToggleEnabledGlobally = state.app.tapToToggleEnabled;
      let disabledLabel = null;
      let typeLabel = null;
      let activeTypeLabel = null;
      if (!tapToToggleEnabledGlobally) {
        disabledLabel = lang("Tap_to_toggle_is_disabled")
      }

      switch (stone.config.type) {
        case STONE_TYPES.plug:
          activeTypeLabel = lang("To_adjust_the_distance_se");
          typeLabel = lang("Enable_so_you_can_tap_you");
          break;
        case STONE_TYPES.builtin:
        case STONE_TYPES.builtinOne:
          activeTypeLabel = lang("To_adjust_the_distance_sen");
          typeLabel = lang("Usually__Built_in_Crownst");
      }

      propsToPass.information = () => { NavigationUtil.navigate("Ability_TapToToggleInformation"); };
      if (active) {
        return {
          image: require('../../../assets/images/overlayCircles/tapToToggle.png'),
          label: lang("Tap_to_toggle"),
          infoCallback: propsToPass.information,
          settingsCallback: () => { NavigationUtil.navigate("Ability_TapToToggleSettings", propsToPass); },
          activateCallback: () => { },
          explanation: disabledLabel || activeTypeLabel
        }
      }
      return {
        image: require('../../../assets/images/overlayCircles/tapToToggle_bw.png'),
        label: lang("Tap_to_toggle"),
        infoCallback: propsToPass.information,
        settingsCallback: () => { },
        activateCallback: () => { core.store.dispatch({type:"UPDATE_ABILITY", sphereId: props.sphereId, stoneId: props.stoneId, abilityId: ABILITY_TYPE_ID.tapToToggle, data: { enabledTarget: true }}); },
        explanation:  disabledLabel || typeLabel
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
