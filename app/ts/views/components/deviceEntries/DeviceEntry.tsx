import * as React from 'react';
import { useRef, useState }             from "react";

import { StoneUtil }                    from "../../../util/StoneUtil";
import { NavigationUtil }               from "../../../util/navigation/NavigationUtil";
import { DeviceEntryIcon }              from "./submodules/DeviceEntryIcon";
import { Get }                          from "../../../util/GetUtil";
import {
  _switchCrownstone,
  canDeviceSwitchNow,
  DeviceDimSlider,
  DeviceDimTopPadding,
  DeviceSwitchControl
} from "./submodules/DeviceEntrySwitchControls";
import { DeviceEntryLabel }             from "./submodules/DeviceLabels";
import { useDatabaseChange }            from "../hooks/databaseHooks";
import { DraggableProps }               from "../hooks/draggableHooks";
import { useCleanup }                   from "../hooks/timerHooks";
import {BlurEntryDevIcon, BlurEntrySettingsIcon, DraggableBlurEntry} from "../BlurEntries";
import {colors} from "../../styles";
import { xUtil } from "../../../util/StandAloneUtil";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../../ExternalConfig";
import { ActivityIndicator, Alert, Platform } from "react-native";


interface DeviceEntryProps extends DraggableProps {
  sphereId: sphereId,
  stoneId: stoneId,
  dimMode: boolean,
  editMode: boolean,
}

export function DeviceEntry(props: DeviceEntryProps) {
  let stone = Get.stone(props.sphereId, props.stoneId);
  if (!stone) {return <React.Fragment />;}
  let [isSwitching, setIsSwitching] = useState(false);
  let [percentage, setPercentage]   = useState(stone.state.state);
  let timeoutRef                    = useRef(null);
  let storedSwitchState             = useRef(stone.state.state);

  // clear the timeout on unmount and store a possibly unstored value.
  useCleanup(() => {
    clearInterval(timeoutRef.current);
    StoneUtil.safeStoreUpdate(props.sphereId, props.stoneId, storedSwitchState.current);
  });

  // update the switchstate based on the changes in the store
  useDatabaseChange({updateStoneState: props.stoneId, changeStoneAvailability: props.stoneId}, () => {
    let stone = Get.stone(props.sphereId, props.stoneId);
    if (!stone || !stone.state) { return; }
    if (stone.state.state !== percentage) {
      setPercentage(stone.state.state)
    }
  });

  // switch method for when the button or dimmer is touched. Has a timed-out store included, which is cleaned up in useCleanup
  let dimCrownstone = async (stone, switchState) => {
    await StoneUtil.multiSwitch(stone, switchState,true, true).catch(() => {});

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      storedSwitchState.current = StoneUtil.safeStoreUpdate(props.sphereId, props.stoneId, storedSwitchState.current);
    }, 3000);
  }


  let goToSettingsCallback = () => {
    NavigationUtil.launchModal( "DeviceOverview",{sphereId: props.sphereId, stoneId: props.stoneId});

  };
  let tapCallback = undefined;
  let backgroundColor = undefined;

  let canSwitch = StoneUtil.canSwitch(stone);
  canSwitch = canSwitch && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION);

  if (canSwitch && !props.editMode) {
    tapCallback = async () => {
      if (!isSwitching) {
        let stone = Get.stone(props.sphereId, props.stoneId);
        if (!canDeviceSwitchNow(stone)) { return; }
        setIsSwitching(true);
        await _switchCrownstone(stone, setPercentage);
        setIsSwitching(false);
      }
    }
  }


  if (StoneUtil.shouldUpdateBeforeBeingUsed(stone)) {
    backgroundColor = colors.purple.rgba(Platform.OS === 'android' ? 0.9 : 0.5);
    tapCallback = () => { NavigationUtil.launchModal("DfuIntroduction", { sphereId: props.sphereId}) }
  }

  if (stone.errors.hasError) {
    backgroundColor = colors.csOrange.rgba(Platform.OS === 'android' ? 0.9 : 0.5);
    tapCallback = () => { NavigationUtil.launchModal("DeviceError", { sphereId: props.sphereId, stoneId: props.stoneId}) }
  }


  return (
    <DraggableBlurEntry
      {...props}
      settings
      testID={'deviceEntry_' + stone.config.cloudId}
      tapCallback={tapCallback}
      longPressCallback={goToSettingsCallback}
      title={stone.config.name}
      backgroundColor={backgroundColor}
      iconItem={isSwitching ? <ActivityIndicator size={'large'} /> : <DeviceEntryIcon stone={stone} stoneId={props.stoneId} />}
      paddingItem={ (props) => { return <DeviceDimTopPadding stone={stone} dimMode={props.dimMode} editMode={props.editMode} />}}
      control={     (props) => { return <DeviceSwitchControl stone={stone} dimMode={props.dimMode} editMode={props.editMode} setPercentage={(value) => { setPercentage(value);}}/>}}
      settingsItem={(props) => { return (
        <React.Fragment>
        <BlurEntryDevIcon
          callback={() => { NavigationUtil.launchModal( "SettingsStoneBleDebug",{sphereId: props.sphereId, stoneId: props.stoneId, isModal: true}); }}
          visible={props.editMode}
        />
        <BlurEntrySettingsIcon
          callback={goToSettingsCallback}
          visible={props.editMode}
          testID={`deviceEntry_${stone.config.cloudId}_edit`}
        />

        </React.Fragment>
      )}}
      labelItem={(props) => {
        return (
        <React.Fragment>
          <DeviceDimSlider
            stone={stone}
            dimMode={props.dimMode}
            editMode={props.editMode}
            value={percentage}
            onChange={(value) => {
              dimCrownstone(stone, value);
              setPercentage(value);
            }}
          />
          <DeviceEntryLabel
            stone={stone}
            dimMode={props.dimMode}
            editMode={props.editMode}
          />
        </React.Fragment>);
      }}
    />
  );
}
