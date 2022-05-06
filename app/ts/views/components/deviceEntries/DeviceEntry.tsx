import * as React from 'react';
import {Component, useState} from 'react';
import {ActivityIndicator, Animated, Platform, Switch, Text, TouchableOpacity, View, ViewStyle} from "react-native";

import { colors, rowstyles, screenWidth, styles } from "../../styles";
import {StoneUtil} from "../../../util/StoneUtil";
import {SlideFadeInView, SlideSideFadeInView} from "../animated/SlideFadeInView";
import {xUtil} from "../../../util/StandAloneUtil";
import {core} from "../../../Core";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {StoneAvailabilityTracker} from "../../../native/advertisements/StoneAvailabilityTracker";
import {DeviceEntryIcon} from "./submodules/DeviceEntryIcon";
import {safeStoreUpdate} from "../../deviceViews/DeviceOverview";
import { Get } from "../../../util/GetUtil";
import { BlurView } from "@react-native-community/blur";
import { SceneConstants } from "../../scenesViews/constants/SceneConstants";
import { BackIcon,  SettingsIconRight } from "../EditIcon";
import {DeviceDimSlider, DeviceDimTopPadding, DeviceSwitchControl} from "./submodules/DeviceEntrySwitchControls";
import {DevicePowerUsage} from "./submodules/DeviceLabels";


export class DeviceEntry extends Component<{
  sphereId: string,
  stoneId: string,
  editMode?: boolean,
  dimMode?: boolean,


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

  unsubscribe = [];
  animating = false;
  id = xUtil.getUUID();

  showMeshMessageTimeout;

  // these are used to determine persisting the switchstate.
  actualState = 0;
  storedSwitchState = 0;
  storeSwitchState = false;
  storeSwitchStateTimeout = null;

  revertToNormalViewTimeout = null;

  constructor(props) {
    super(props);
    let state = core.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    let switchState = stone.state.state;
    this.actualState = switchState;
    this.storedSwitchState = switchState;
    this.state = {
      pendingCommand:  false,
      backgroundColor: new Animated.Value(0),
      statusText:      null,
      percentage:      switchState,
    };
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on('databaseChange', (data) => {
      let change = data.change;
      if (change.updateStoneState && change.updateStoneState.stoneIds[this.props.stoneId]) {
        let state = core.store.getState();
        let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
        if (!stone || !stone.config) { return; }
        if (stone.state.state !== this.state.percentage) {
          this.setState({percentage: stone.state.state})
          return;
        }
        this.forceUpdate();
        return
      }
    }));
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
    if (this.storeSwitchState) {
      clearTimeout(this.storeSwitchStateTimeout);
      this.storedSwitchState = safeStoreUpdate(this.props.sphereId, this.props.stoneId, this.storedSwitchState);
    }
    clearTimeout(this.showMeshMessageTimeout);
    clearTimeout(this.revertToNormalViewTimeout);
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


  async _switch(stone, switchState) {
    await StoneUtil.multiSwitch(stone, switchState,true, true).catch(() => {});
    this._planStoreAction(switchState);
  }

  _planStoreAction(state) {
    this.actualState = state;
    this.storeSwitchState = true;
    clearTimeout(this.storeSwitchStateTimeout);
    this.storeSwitchStateTimeout = setTimeout(() => {
      this.storeSwitchState = false;
      this.storedSwitchState = safeStoreUpdate(this.props.sphereId, this.props.stoneId, this.storedSwitchState);
    }, 3000);
  }


  render() {
    let stone = Get.stone(this.props.sphereId, this.props.stoneId);
    return (
      <BlurView
        blurType={"light"}
        blurAmount={5}
        style={{
          flexDirection:'row',
          height: 70,
          flex:1,
          backgroundColor: colors.white.rgba(0.4),
          marginHorizontal: 12,
          marginBottom: 12,
          borderRadius: SceneConstants.roundness,
          alignItems:'center',
          paddingLeft: 15,
      }}>
        <DeviceEntryIcon stone={stone} stoneId={this.props.stoneId} />
        <View style={{ flex:1}}>
          <DeviceDimTopPadding stone={stone} dimMode={this.props.dimMode} editMode={this.props.editMode} />

          <Text style={{...rowstyles.title, paddingLeft:15}}>{stone.config.name}</Text>

          <DeviceDimSlider
            stone={stone}
            dimMode={this.props.dimMode}
            editMode={this.props.editMode}
            value={this.state.percentage}
            onChange={(value) => { this._switch(stone, value); this.setState({percentage: value})}}
          />
          <DevicePowerUsage
            stone={stone}
            dimMode={this.props.dimMode}
            editMode={this.props.editMode}
          />
        </View>
        <SlideSideFadeInView visible={this.props.editMode} width={60}>
          <SettingsIconRight style={{height:55}} onPress={() => {  NavigationUtil.navigate( "DeviceOverview",{sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely}); }}/>
        </SlideSideFadeInView>
        <DeviceSwitchControl stone={stone} editMode={this.props.editMode} dimMode={this.props.dimMode} setPercentage={(value) => { this.setState({percentage: value})}} />
      </BlurView>
    );
  }
}

