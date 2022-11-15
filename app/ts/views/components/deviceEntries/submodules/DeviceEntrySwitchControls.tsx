import * as React from 'react';
import { useState} from 'react';

import {xUtil} from "../../../../util/StandAloneUtil";
import {MINIMUM_REQUIRED_FIRMWARE_VERSION} from "../../../../ExternalConfig";
import {SlideFadeInView, SlideSideFadeInView} from "../../animated/SlideFadeInView";
import {StoneAvailabilityTracker} from "../../../../native/advertisements/StoneAvailabilityTracker";
import {ActivityIndicator, Platform, Switch, Text, TouchableOpacity, View, ViewStyle} from "react-native";
import {Icon} from "../../Icon";
import {colors} from "../../../styles";
import {StoneUtil} from "../../../../util/StoneUtil";
import {LOGe} from "../../../../logging/Log";
import Slider from "@react-native-community/slider";
import {NavigationUtil} from "../../../../util/navigation/NavigationUtil";

export function DeviceSwitchControl({stone, editMode, dimMode, setPercentage}) {
  let canSwitch = StoneUtil.canSwitch(stone);
  canSwitch = canSwitch && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION);
  if (!canSwitch) { return <React.Fragment />; }

  let canDim  = stone.abilities.dimming.enabledTarget;
  let visible = !editMode && (!canDim || canDim && !dimMode)

  return (
    <SlideSideFadeInView visible={visible} width={75} style={{alignItems:'flex-end'}}>
      <DeviceControl stone={stone} setPercentage={setPercentage} />
    </SlideSideFadeInView>
  );
}

export function DeviceControl({stone, setPercentage}) {
  let [pending, setPending] = useState(false);

  let content;
  let action = null;
  if (StoneAvailabilityTracker.isDisabled(stone.id) === false) {
    if (stone.errors.hasError) {
      content = <Switch value={stone.state.state > 0} disabled={true} />;
    }
    else if (stone.config.locked) {
      content = <Icon name={'md-lock'} color={colors.black.rgba(0.2)} size={32} />;
    }
    else if (pending === true) {
      content = <ActivityIndicator animating={true} size='large' color={colors.black.rgba(0.5)} />;
    }
    else {
      action = async () => {
        setPending(true);
        await _switchCrownstone(stone, setPercentage);
        setPending(false);
      }
      content = <Switch value={stone.state.state > 0} onValueChange={action}/>;
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


export function canDeviceSwitchNow(stone) {
  if (StoneAvailabilityTracker.isDisabled(stone.id) === false) {
    if (stone.errors.hasError) {
      return false;
    }
    else if (stone.config.locked) {
      return false
    }
    else {
      return true;
    }
  }
  return false;
}


export async function _switchCrownstone(stone, setPercentage) {
  try {
    if (stone.state.state > 0) {
      // turn off
      await StoneUtil.turnOff(stone);
      setPercentage(0);
    }
    else {
      // turn on
      let newState = await StoneUtil.turnOn(stone)
      setPercentage(newState);
    }
  }
  catch (err : any) {
    LOGe.info("DeviceEntry: Failed to switch", err?.message);
  }
}

export function DeviceDimSlider({stone, editMode, dimMode, value, onChange}) {
  let canDim  = stone.abilities.dimming.enabledTarget;
  let visible = canDim && !editMode && dimMode && StoneAvailabilityTracker.isDisabled(stone.id) === false;

  return (
    <SlideFadeInView height={40} visible={visible} style={{paddingHorizontal:15}}>
      <Slider
        style={{ flex:1 }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onSlidingStart={() => {
          NavigationUtil.setViewBackSwipeEnabled(false);
        }}
        onSlidingComplete={() => {
          NavigationUtil.setViewBackSwipeEnabled(true);
        }}
        minimumTrackTintColor={colors.green.rgba(0.75)}
        maximumTrackTintColor={Platform.OS === 'android' ? colors.black.rgba(0.25) : colors.black.rgba(0.05) }
        onValueChange={onChange}
      />
    </SlideFadeInView>
  );
}

export function DeviceDimTopPadding({stone, editMode, dimMode}) {
  let canDim  = stone.abilities.dimming.enabledTarget;
  let visible = canDim && !editMode && dimMode && StoneAvailabilityTracker.isDisabled(stone.id) === false;;

  return (
    <SlideFadeInView height={10} visible={visible}></SlideFadeInView>
  );
}
