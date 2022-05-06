import {Languages} from "../../../Languages"
import * as React from 'react';
import {Component} from 'react';
import {ActivityIndicator, Animated, Platform, Switch, Text, TouchableOpacity, View, ViewStyle} from "react-native";

import {Icon} from '../Icon';
import {Util} from '../../../util/Util'
import { colors, rowstyles, screenWidth, styles } from "../../styles";
import {MINIMUM_REQUIRED_FIRMWARE_VERSION} from '../../../ExternalConfig';
import {StoneUtil} from "../../../util/StoneUtil";
import {DeviceEntrySubText} from "./DeviceEntrySubText";
import {SlideFadeInView, SlideSideFadeInView} from "../animated/SlideFadeInView";
import {xUtil} from "../../../util/StandAloneUtil";
import {STONE_TYPES} from "../../../Enums";
import {core} from "../../../Core";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {StoneAvailabilityTracker} from "../../../native/advertisements/StoneAvailabilityTracker";
import Slider from "@react-native-community/slider";
import {DeviceEntryIcon} from "./submodules/DeviceEntryIcon";
import {safeStoreUpdate} from "../../deviceViews/DeviceOverview";
import {LOGe} from "../../../logging/Log";
import { Get } from "../../../util/GetUtil";
import { BlurView } from "@react-native-community/blur";
import { SceneConstants } from "../../scenesViews/constants/SceneConstants";
import { BackIcon,  SettingsIconRight } from "../EditIcon";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEntry", key)(a,b,c,d,e);
}

const PADDING_LEFT = 15;
const PADDING_RIGHT = 15;

export class DeviceEntry extends Component<{
  sphereId: string,
  stoneId: string,
  editMode?: boolean,


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
        let change = data.change;
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

  async _pressedDevice(stone) {
    this.setState({pendingCommand:true});
    try {
      if (stone.state.state > 0) {
        // turn off
        await StoneUtil.turnOff(stone);
        this.setState({pendingCommand:false, percentage: 0});
      }
      else {
        // turn on
        let newState = await StoneUtil.turnOn(stone)
        this.setState({pendingCommand:false, percentage: newState});
      }
    }
    catch (err) {
      LOGe.info("DeviceEntry: Failed to switch", err?.message);
      this.setState({pendingCommand:false});
    }
  }

  _getControl(stone) {
    let content;
    let action = null;
    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false || true) {
      if (stone.errors.hasError) {
        content = <Switch value={stone.state.state > 0} disabled={true} />;
      }
      else if (stone.config.locked) {
        content = <Icon name={'md-lock'} color={colors.black.rgba(0.2)} size={32} />;
      }
      else if (this.state.pendingCommand === true) {
        content = <ActivityIndicator animating={true} size='large' color={colors.black.rgba(0.5)} />;
      }
      else {
        content = <Switch value={stone.state.state > 0} onValueChange={() => { this._pressedDevice(stone); }}/>;
        action = () => { this._pressedDevice(stone);  }
      }
    }


    let wrapperStyle : ViewStyle = {width: 75, alignItems:'flex-end', justifyContent:'center', paddingRight:15};
    if (action) {
      return (
        <TouchableOpacity onPress={() => { action() }} style={wrapperStyle}>
          {content}
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle}>{content}</View>;
    }
  }

  async _switch(stone, state) {
    await StoneUtil.multiSwitch(stone, state,true, true).catch(() => {});
    this._planStoreAction(state);
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

    let canSwitch = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    canSwitch = canSwitch && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION);

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
        <View style={{paddingLeft:15, flex:1}}>
          <Text style={rowstyles.title}>{stone.config.name}</Text>
          <Text style={{ fontSize:13, fontStyle:'italic' }}>{this.props.editMode ? 'Hold to drag!' : '200 W'}</Text>
        </View>
        <SlideSideFadeInView visible={this.props.editMode} width={60}>
          <SettingsIconRight style={{height:55}} onPress={() => {  NavigationUtil.navigate( "DeviceOverview",{sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely}); }}/>
        </SlideSideFadeInView>
        {
          canSwitch === true &&
          <SlideSideFadeInView visible={!this.props.editMode} width={75} style={{alignItems:'flex-end'}}>{this._getControl(stone)}</SlideSideFadeInView>
        }
      </BlurView>
      // <Animated.View style={[styles.listView,{flexDirection: 'column', paddingRight:0, height: height, overflow:'hidden', backgroundColor:'transparent'}]}>
      //   <View style={{flexDirection: 'row', paddingRight: 0, paddingLeft: 0, flex: 1}}>
      //     <IconWrapperElement style={{justifyContent: 'center'}} onPress={() => {
      //       if (this.props.allowSwitchView === false) {
      //         return this._basePressed();
      //       }
      //
      //       if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false &&
      //         stone.config.firmwareVersion &&
      //         (Util.canUpdate(stone, state) === true || xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false)
      //       ) {
      //         NavigationUtil.launchModal( "DfuIntroduction", {sphereId: this.props.sphereId});
      //         return;
      //       }
      //
      //       clearTimeout(this.revertToNormalViewTimeout);
      //       if (this.props.switchView === false && this.props.amountOfDimmableCrownstonesInLocation === 0) {
      //         this.revertToNormalViewTimeout = setTimeout(() => { this.props.setSwitchView(false); }, 3000);
      //       }
      //       this.props.setSwitchView(!this.props.switchView);
      //     }}>
      //       <DeviceEntryIcon stone={stone} stoneId={this.props.stoneId} state={state} overrideStoneState={undefined} />
      //     </IconWrapperElement>
      //     <WrapperElement
      //       activeOpacity={ switchViewActive ? 1 : 0.2 }
      //       style={{flex: 1, justifyContent: 'center'}}
      //       onPress={() => { if (switchViewActive === false) { this._basePressed(); }}}
      //     >
      //       <View style={{justifyContent:'center'}}>
      //         <View style={{paddingLeft:20, paddingTop:10}}>
      //           <Text style={{fontSize: 17}}>{stone.config.name}</Text>
      //           <SlideFadeInView visible={!switchViewActive} height={25 + (explanationText ? 15 : 0)}>
      //             <DeviceEntrySubText
      //               statusTextOverride={this.props.statusText}
      //               statusText={this.state.statusText}
      //               deviceType={stone.config.type}
      //               rssi={StoneAvailabilityTracker.getRssi(this.props.stoneId)}
      //               disabled={StoneAvailabilityTracker.isDisabled(this.props.stoneId)}
      //               currentUsage={stone.state.currentUsage}
      //               nearestInSphere={this.props.nearestInSphere}
      //               nearestInRoom={this.props.nearestInRoom}
      //             />
      //             { explanationText }
      //           </SlideFadeInView>
      //         </View>
      //         <SlideFadeInView visible={switchViewActive} height={50}>
      //           <View style={{paddingLeft: 20}}>
      //             <Slider
      //               style={{ width: sliderWidth, height: 40 }}
      //               minimumValue={0}
      //               maximumValue={100}
      //               step={1}
      //               value={this.state.percentage}
      //               onSlidingStart={   () => {
      //                 NavigationUtil.setViewBackSwipeEnabled(false);
      //                 this.props.toggleScrollView(false);
      //               }}
      //               onSlidingComplete={() => {
      //                 NavigationUtil.setViewBackSwipeEnabled(true);
      //                 this.props.toggleScrollView(true);
      //               }}
      //               minimumTrackTintColor={colors.green.rgba(0.75)}
      //               maximumTrackTintColor={Platform.OS === 'android' ? colors.black.rgba(0.25) : colors.black.rgba(0.05) }
      //               onValueChange={(value) => { this._switch(stone, value); this.setState({percentage: value})}}
      //             />
      //             <View style={{position:'absolute', top:-10, left:0,  height:60, width: Math.max(0,(sliderWidth-30)* 0.01*  this.state.percentage) , backgroundColor:"transparent"}} />
      //             <View style={{position:'absolute', top:-10, right:0, height:60, width: Math.max(0,(sliderWidth-30)*(1-0.01*this.state.percentage)), backgroundColor:"transparent"}} />
      //           </View>
      //         </SlideFadeInView>
      //       </View>
      //     </WrapperElement>
      //     {canSwitch === true && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) ?
      //       <SlideSideFadeInView visible={!switchViewActive} width={75} style={{justifyContent: 'center' }}>
      //         {this._getControl(stone)}
      //       </SlideSideFadeInView>
      //       : <View style={{ width: 15 }}/>
      //     }
      //   </View>
      // </Animated.View>
    );
  }
}
