import * as React from 'react';
import { Component, useEffect, useMemo, useRef, useState } from "react";
import {ActivityIndicator, Animated, Platform, Switch, Text, TouchableOpacity, View, ViewStyle} from "react-native";

import { colors, rowstyles, screenWidth, styles } from "../../styles";
import {StoneUtil} from "../../../util/StoneUtil";
import {SlideFadeInView, SlideSideFadeInView} from "../animated/SlideFadeInView";
import {xUtil} from "../../../util/StandAloneUtil";
import {core} from "../../../Core";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {StoneAvailabilityTracker} from "../../../native/advertisements/StoneAvailabilityTracker";
import {DeviceEntryIcon} from "./submodules/DeviceEntryIcon";
import { Get } from "../../../util/GetUtil";
import { BlurView } from "@react-native-community/blur";
import { SceneConstants } from "../../scenesViews/constants/SceneConstants";
import { BackIcon,  SettingsIconRight } from "../EditIcon";
import {DeviceDimSlider, DeviceDimTopPadding, DeviceSwitchControl} from "./submodules/DeviceEntrySwitchControls";
import {DevicePowerUsage} from "./submodules/DeviceLabels";
import { EventBusClass } from "../../../util/EventBus";
import { useDatabaseChange, useForceUpdate } from "../hooks/databaseHooks";
import { DraggableProps, useDraggable } from "../hooks/draggableHooks";
import { useCleanup } from "../hooks/timerHooks";


// export class DeviceEntry extends Component<{
//   sphereId: string,
//   stoneId: string,
//   editMode?: boolean,
//   dimMode?: boolean,
//
//
//   viewingRemotely: boolean,
//
//   allowSwitchView?: boolean,
//   switchView?: boolean,
//   setSwitchView?: (state: boolean) => void,
//
//   allowDeviceOverview?: boolean,
//   amountOfDimmableCrownstonesInLocation?: number,
//   hideExplanation?: boolean,
//   height?: number,
//   nearestInRoom?: boolean,
//   nearestInSphere?: boolean,
//   toggleScrollView?: (state: boolean) => void
// }, any> {
//
//   unsubscribe = [];
//   animating = false;
//   id = xUtil.getUUID();
//
//
//   // these are used to determine persisting the switchstate.
//   actualState = 0;
//   storedSwitchState = 0;
//   storeSwitchState = false;
//   storeSwitchStateTimeout = null;
//
//
//   constructor(props) {
//     super(props);
//     let state = core.store.getState();
//     let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
//     let switchState = stone.state.state;
//     this.actualState = switchState;
//     this.storedSwitchState = switchState;
//     this.state = {
//       percentage: switchState,
//     };
//   }
//
//   // componentDidMount() {
//   //   this.unsubscribe.push(core.eventBus.on('databaseChange', (data) => {
//   //     let change = data.change;
//   //     if (change.updateStoneState && change.updateStoneState.stoneIds[this.props.stoneId]) {
//   //       let state = core.store.getState();
//   //       let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
//   //       if (!stone || !stone.config) { return; }
//   //       if (stone.state.state !== this.state.percentage) {
//   //         this.setState({percentage: stone.state.state})
//   //         return;
//   //       }
//   //       this.forceUpdate();
//   //       return
//   //     }
//   //   }));
//   // }
//
//   componentWillUnmount() { // cleanup
//     this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
//     if (this.storeSwitchState) {
//       clearTimeout(this.storeSwitchStateTimeout);
//       this.storedSwitchState = StoneUtil.safeStoreUpdate(this.props.sphereId, this.props.stoneId, this.storedSwitchState);
//     }
//   }
//
//
//   // componentDidUpdate(prevProps, prevState, snapshot) {
//   //   if ( this.props.switchView !== prevProps.switchView ) {
//   //     let state = core.store.getState();
//   //     if (state.app.hasSeenSwitchView === false) {
//   //       let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
//   //       let useSwitchView = this.props.switchView && stone.abilities.dimming.enabledTarget && !StoneAvailabilityTracker.isDisabled(this.props.stoneId);
//   //       if (useSwitchView && state.app.hasSeenSwitchView === false) {
//   //         core.store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { hasSeenSwitchView: true } });
//   //       }
//   //     }
//   //   }
//   // }
//
//
//   async _switch(stone, switchState) {
//     await StoneUtil.multiSwitch(stone, switchState,true, true).catch(() => {});
//     this._planStoreAction(switchState);
//   }
//
//   _planStoreAction(state) {
//     this.actualState = state;
//     this.storeSwitchState = true;
//     clearTimeout(this.storeSwitchStateTimeout);
//     this.storeSwitchStateTimeout = setTimeout(() => {
//       this.storeSwitchState = false;
//       this.storedSwitchState = StoneUtil.safeStoreUpdate(this.props.sphereId, this.props.stoneId, this.storedSwitchState);
//     }, 3000);
//   }
//
//
//   // render() {
//   //   let stone = Get.stone(this.props.sphereId, this.props.stoneId);
//   //   return (
//   //       <BlurView
//   //         blurType={"light"}
//   //         blurAmount={5}
//   //         style={{
//   //           backgroundColor: colors.white.rgba(0.4),
//   //           marginHorizontal: 12,
//   //           marginBottom: 12,
//   //           flex:1,
//   //           borderRadius: SceneConstants.roundness,
//   //       }}>
//   //         <TouchableOpacity
//   //           activeOpacity={1}
//   //           style={{
//   //             flexDirection:'row',
//   //             height: 70,
//   //             flex:1,
//   //             alignItems:'center',
//   //             paddingLeft: 15,
//   //           }}
//   //           onLongPress={() => {
//   //             console.log("LongPress")
//   //           }}
//   //         >
//   //         <DeviceEntryIcon stone={stone} stoneId={this.props.stoneId} />
//   //         <View style={{ flex:1}}>
//   //           <DeviceDimTopPadding stone={stone} dimMode={this.props.dimMode} editMode={this.props.editMode} />
//   //           <Text style={{...rowstyles.title, paddingLeft:15}}>{stone.config.name}</Text>
//   //           <DeviceDimSlider
//   //             stone={stone}
//   //             dimMode={this.props.dimMode}
//   //             editMode={this.props.editMode}
//   //             value={this.state.percentage}
//   //             onChange={(value) => { this._switch(stone, value); this.setState({percentage: value})}}
//   //           />
//   //           <DevicePowerUsage
//   //             stone={stone}`
//   //             dimMode={this.props.dimMode}
//   //             editMode={this.props.editMode}
//   //           />
//   //         </View>
//   //         <SlideSideFadeInView visible={this.props.editMode} width={60}>
//   //           <SettingsIconRight style={{height:55}} onPress={() => {  NavigationUtil.launchModal( "DeviceOverview",{sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely}); }}/>
//   //         </SlideSideFadeInView>
//   //         <DeviceSwitchControl stone={stone} editMode={this.props.editMode} dimMode={this.props.dimMode} setPercentage={(value) => { this.setState({percentage: value})}} />
//   //         </TouchableOpacity>
//   //       </BlurView>
//   //   );
//   // }
// }

interface DeviceEntryProps extends DraggableProps {
  sphereId: sphereId,
  stoneId: stoneId,
  dimMode: boolean,
  editMode: boolean,
  viewingRemotely: boolean
}

export function DeviceEntry(props: DeviceEntryProps) {
  let stone = Get.stone(props.sphereId, props.stoneId);
  if (!stone) {return <React.Fragment />;}
  let [percentage, setPercentage] = useState(stone.state.state);
  let timeoutRef                  = useRef(null);
  let storedSwitchState           = useRef(stone.state.state);

  // clear the timeout on unmount and store a possibly unstored value.
  useCleanup(() => {
    clearInterval(timeoutRef.current);
    StoneUtil.safeStoreUpdate(props.sphereId, props.stoneId, storedSwitchState.current);
  });

  // update the switchstate based on the changes in the store
  useDatabaseChange({updateStoneState: props.stoneId}, () => {
    let stone = Get.stone(props.sphereId, props.stoneId);
    if (!stone || !stone.state) { return; }
    if (stone.state.state !== percentage) {
      setPercentage(stone.state.state)
    }
  });

  // include draggable
  let {dragging, triggerDrag} = useDraggable(props.isBeingDragged, props.eventBus, props.dragAction);


  // switch method for when the button or dimmer is touched. Has a timed-out store included, which is cleaned up in useCleanup
  let _switch = async (stone, switchState) => {
    await StoneUtil.multiSwitch(stone, switchState,true, true).catch(() => {});

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      storedSwitchState.current = StoneUtil.safeStoreUpdate(props.sphereId, props.stoneId, storedSwitchState.current);
    }, 3000);
  }

  return (
    <TouchableOpacity activeOpacity={props.editMode ? 0.5 : 1.0} onLongPress={() => { if (props.editMode) { triggerDrag(); } }} style={{flexDirection:'row'}}>
      <SlideSideFadeInView visible={dragging} width={40} />
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
        <DeviceEntryIcon stone={stone} stoneId={props.stoneId} />
        <View style={{ flex:1}}>
          <DeviceDimTopPadding stone={stone} dimMode={props.dimMode} editMode={props.editMode} />
          <Text style={{...rowstyles.title, paddingLeft:15}}>{stone.config.name}</Text>
          <DeviceDimSlider
            stone={stone}
            dimMode={props.dimMode}
            editMode={props.editMode}
            value={percentage}
            onChange={(value) => {
              _switch(stone, value);
              setPercentage(value);
            }}
          />
          <DevicePowerUsage
            stone={stone}
            dimMode={props.dimMode}
            editMode={props.editMode}
          />
        </View>
        <SlideSideFadeInView visible={props.editMode} width={60}>
          <SettingsIconRight style={{height:55}} onPress={() => {  NavigationUtil.launchModal( "DeviceOverview",{sphereId: props.sphereId, stoneId: props.stoneId, viewingRemotely: props.viewingRemotely}); }}/>
        </SlideSideFadeInView>
        <DeviceSwitchControl stone={stone} editMode={props.editMode} dimMode={props.dimMode} setPercentage={(value) => { setPercentage(value); }} />
      </BlurView>
    </TouchableOpacity>
  );
}
