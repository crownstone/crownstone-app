
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  Text,
  View, ViewStyle, PanResponder, Platform
} from "react-native";

import { Icon } from '../Icon';
import { Util } from '../../../util/Util'
import { styles, colors, screenWidth } from "../../styles";
import { AlternatingContent }                 from '../animated/AlternatingContent';
import { MINIMUM_REQUIRED_FIRMWARE_VERSION }  from '../../../ExternalConfig';
import { INTENTS }                            from '../../../native/libInterface/Constants';
import { StoneUtil }                          from "../../../util/StoneUtil";
import { DeviceEntrySubText }                 from "./DeviceEntrySubText";
import {AnimatedCircle} from "../animated/AnimatedCircle";
import { SlideFadeInView, SlideSideFadeInView } from "../animated/SlideFadeInView";
import { xUtil } from "../../../util/StandAloneUtil";
import { STONE_TYPES } from "../../../Enums";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../../../util/DataUtil";
import Slider from "@react-native-community/slider";
import { DeviceEntryIcon } from "./submodules/DeviceEntryIcon";
import { safeStoreUpdate } from "../../deviceViews/DeviceOverview";
import Timeout = NodeJS.Timeout;
import { IconCircle } from "../IconCircle";

const PADDING_LEFT = 15;
const PADDING_RIGHT = 15;

export class HubEntry extends Component<{
  sphereId: string,
  stoneId?: string,
  hubId?: string,

  viewingRemotely: boolean,

  allowSwitchView?: boolean,
  switchView?: boolean,
  setSwitchView?: (state: boolean) => void,

  allowDeviceOverview?: boolean,
  amountOfDimmableCrownstonesInLocation?: number,
  hideExplanation?: boolean,
  height?: number,
  nearestInRoom?: boolean,
  nearestInSphere?: boolean,
  statusText?: string,
  toggleScrollView?: (state: boolean) => void
}, any> {

  _panResponder;
  baseHeight : number;
  unsubscribe = [];
  animating = false;
  id = xUtil.getUUID();

  showMeshMessageTimeout;

  // these are used to determine persisting the switchstate.
  actualState = 0;
  storedSwitchState = 0;
  storeSwitchState = false;
  storeSwitchStateTimeout = null;

  showStateIconTimeout : Timeout;

  revertToNormalViewTimeout = null;

  constructor(props) {
    super(props);
    let state = core.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    this.state = {
      backgroundColor: new Animated.Value(0),
      statusText:      null,
      showStateIcon:   false,
    };
  }

  componentDidMount() {
    // this event makes the background of the device entry blink to incidate the error.
    this.unsubscribe.push(core.eventBus.on('showErrorInOverview', (stoneId) => {
      if (stoneId === this.props.stoneId) {
        Animated.spring(this.state.backgroundColor, { toValue: 10, friction: 1.5, tension: 90 }).start();
        setTimeout(() => {
          Animated.timing(this.state.backgroundColor, { toValue: 0, duration: 2500 }).start();
        }, 5000);
      }
    }));

    this.unsubscribe.push(core.eventBus.on('databaseChange', (data) => {
      let change = data.change;
      if (change.updateStoneState && change.updateStoneState.stoneIds[this.props.stoneId]) {
        let change = data.change;
        let state = core.store.getState();
        let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
        if (!stone || !stone.config) { return; }
        this.forceUpdate();
        return
      }
    }));

    this.showStateIconTimeout = setTimeout(() => { this.setState({showStateIcon:true})}, 2000);
  }

  componentWillUnmount() { // cleanup
    clearTimeout(this.showStateIconTimeout);
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
  }


  componentDidUpdate(prevProps, prevState, snapshot) {
    if ( this.props.switchView !== prevProps.switchView ) {
      let state = core.store.getState();
      if (state.app.hasSeenSwitchView === false) {
        let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
        let useSwitchView = this.props.switchView && stone.abilities.dimming.enabledTarget && !StoneAvailabilityTracker.isDisabled(this.props.stoneId);
        if (useSwitchView && state.app.hasSeenSwitchView === false) {
          core.store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { hasSeenSwitchView: true } });
        }
      }
    }
  }

  _basePressed(stone, hub) {
    NavigationUtil.navigate( "HubOverview",{sphereId: this.props.sphereId, stoneId: hub?.config?.linkedStoneId || this.props.stoneId, hubId: this.props.hubId, viewingRemotely: this.props.viewingRemotely})
  }

  _getExplanationText(state, useSwitchView) {
    let explanationStyle = { color: colors.iosBlue.hex, fontSize: 12};
    let explanation = null;

    if (this.props.hideExplanation !== true) {
      if (state.app.hasSeenDeviceSettings === false) {
        explanation = <Text style={explanationStyle}>{  lang("Tap_me_for_more_") }</Text>;
      }
      else if (state.app.hasSeenSwitchView !== true && this.props.amountOfDimmableCrownstonesInLocation > 1) {
        explanation = <Text style={explanationStyle}>{ lang("Tap_icon_to_quickly_dim_y") }</Text>;
      }
    }

    if (explanation) {
      return <View style={{height:15}}>{explanation}</View>
    }
    return null;
  }



  render() {
    let state = core.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0,10],
      outputRange: ['rgba(255, 255, 255, 0.8)',  colors.csOrange.rgba(0.5)]
    });

    let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId)?.data || DataUtil.getHubById(this.props.sphereId, this.props.hubId);
    let name = stone?.config?.name || hub?.config?.name;

    let WrapperElement : any = TouchableOpacity;
    let IconWrapperElement : any = TouchableOpacity;
    let switchViewActive = this.props.switchView && stone.abilities.dimming.enabledTarget && !StoneAvailabilityTracker.isDisabled(this.props.stoneId);
    if (this.props.allowDeviceOverview === false) {
      WrapperElement = View
    }
    if (this.props.allowSwitchView === false) {
      IconWrapperElement = WrapperElement;
      switchViewActive = false;
    }

    let switchViewExplanation = !switchViewActive && this.props.switchView;
    let height = this.props.height || 80;
    let explanationText = this._getExplanationText(state, switchViewActive);

    let hubProblem = false;
    if (!hub) { hubProblem = true; }
    else {
      hubProblem = hubProblem || !hub.state.uartAlive;
      hubProblem = hubProblem || !hub.state.uartAliveEncrypted;
      // hubProblem = hubProblem || hub.state.uartEncryptionRequiredByCrownstone;
      // hubProblem = hubProblem || hub.state.uartEncryptionRequiredByHub;
      hubProblem = hubProblem || !hub.state.hubHasBeenSetup;
      hubProblem = hubProblem || !hub.state.hubHasInternet;
      hubProblem = hubProblem || hub.state.hubHasError;
    }


    return (
      <Animated.View style={[styles.listView,{flexDirection: 'column', paddingRight:0, height: height, overflow:'hidden', backgroundColor:backgroundColor}]}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <IconWrapperElement style={{ height: this.baseHeight, justifyContent: 'center'}} onPress={() => {
            if (this.props.allowSwitchView === false) {
              return this._basePressed(stone, hub);
            }

            if (stone && StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false &&
              stone.config.firmwareVersion &&
              (Util.canUpdate(stone, state) === true || xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false)
            ) {
              NavigationUtil.launchModal( "DfuIntroduction", {sphereId: this.props.sphereId});
              return;
            }

            clearTimeout(this.revertToNormalViewTimeout);
            if (this.props.switchView === false && this.props.amountOfDimmableCrownstonesInLocation === 0) {
              this.revertToNormalViewTimeout = setTimeout(() => { this.props.setSwitchView(false); }, 3000);
            }
            this.props.setSwitchView(!this.props.switchView);
          }}>
            {stone ?
              <DeviceEntryIcon stone={stone} stoneId={this.props.stoneId} state={state} overrideStoneState={1} /> :
              <IconCircle icon={'c1-router'} size={60} backgroundColor={colors.green.hex} color={'#ffffff'} />
            }
          </IconWrapperElement>
          <WrapperElement
            activeOpacity={ switchViewActive ? 1 : 0.2 }
            style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}}
            onPress={() => { if (switchViewActive === false) { this._basePressed(stone, hub); }}}
          >
            <View style={{justifyContent:'center'}}>
              <View style={{paddingLeft:20}}>
                <Text style={{fontSize: 17}}>{name}</Text>
                <DeviceEntrySubText
                  statusTextOverride={this.props.statusText}
                  statusText={this.state.statusText}
                  deviceType={stone?.config?.type ?? STONE_TYPES.hub}
                  rssi={StoneAvailabilityTracker.getRssi(this.props.stoneId)}
                  disabled={StoneAvailabilityTracker.isDisabled(this.props.stoneId)}
                  nearestInSphere={this.props.nearestInSphere}
                  nearestInRoom={this.props.nearestInRoom}
                />
                { explanationText }
              </View>
            </View>
          </WrapperElement>
          <WrapperElement
            style={{height: this.baseHeight, width: 75, paddingRight:15, alignItems:'flex-end', justifyContent:'center'}}
            onPress={() => { if (switchViewActive === false) { this._basePressed(stone, hub); }}}
          >
            {
              hubProblem && !this.state.showStateIcon ? <ActivityIndicator size={"small"} /> :
              hubProblem ?
              <Icon name={'ios-warning'} size={30} color={colors.csOrange.hex} />
                :
              <Icon name={'ios-checkmark-circle'} size={30} color={colors.green.hex} />

            }
          </WrapperElement>
        </View>
      </Animated.View>
    );
  }
}