import * as React from 'react';
import { useRef, useState }             from "react";

import { StoneUtil }                    from "../../../util/StoneUtil";
import { NavigationUtil }               from "../../../util/navigation/NavigationUtil";
import { DeviceEntryIcon }              from "./submodules/DeviceEntryIcon";
import { Get }                          from "../../../util/GetUtil";
import { DeviceDimSlider, DeviceDimTopPadding, DeviceSwitchControl } from "./submodules/DeviceEntrySwitchControls";
import { DevicePowerUsage }             from "./submodules/DeviceLabels";
import { useDatabaseChange }            from "../hooks/databaseHooks";
import { DraggableProps }               from "../hooks/draggableHooks";
import { useCleanup }                   from "../hooks/timerHooks";
import { DraggableBlurEntry }           from "../BlurEntries";


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
  useDatabaseChange({updateStoneState: props.stoneId, changeStoneAvailability: props.stoneId}, () => {
    let stone = Get.stone(props.sphereId, props.stoneId);
    if (!stone || !stone.state) { return; }
    if (stone.state.state !== percentage) {
      setPercentage(stone.state.state)
    }
  });

  // switch method for when the button or dimmer is touched. Has a timed-out store included, which is cleaned up in useCleanup
  let switchCrownstone = async (stone, switchState) => {
    await StoneUtil.multiSwitch(stone, switchState,true, true).catch(() => {});

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      storedSwitchState.current = StoneUtil.safeStoreUpdate(props.sphereId, props.stoneId, storedSwitchState.current);
    }, 3000);
  }


  return (
    <DraggableBlurEntry
      {...props}

      title={stone.config.name}
      iconItem={<DeviceEntryIcon stone={stone} stoneId={props.stoneId} />}
      paddingItem={(props) => { return <DeviceDimTopPadding stone={stone} dimMode={props.dimMode} editMode={props.editMode} />}}
      control={    (props) => { return <DeviceSwitchControl stone={stone} dimMode={props.dimMode} editMode={props.editMode} setPercentage={(value) => { setPercentage(value);}}/>}}
      labelItem={  (props) => { return (
        <React.Fragment>
          <DeviceDimSlider
            stone={stone}
            dimMode={props.dimMode}
            editMode={props.editMode}
            value={percentage}
            onChange={(value) => {
              switchCrownstone(stone, value);
              setPercentage(value);
            }}
          />
          <DevicePowerUsage
            stone={stone}
            dimMode={props.dimMode}
            editMode={props.editMode}
          />
        </React.Fragment>);
      }}
      editSettingsCallback={() => {  NavigationUtil.launchModal( "DeviceOverview",{sphereId: props.sphereId, stoneId: props.stoneId}); }}
    />
  );
}
