import {Languages} from "../../../Languages"
import * as React from 'react';
import {Component, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Text, TouchableOpacity, View} from "react-native";

import {Icon} from '../Icon';
import {colors, styles} from "../../styles";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {DataUtil} from "../../../util/DataUtil";
import {DeviceEntryIcon} from "./submodules/DeviceEntryIcon";
import {CLOUD} from "../../../cloud/cloudAPI";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HubEntry", key)(a,b,c,d,e);
}

import {Get} from "../../../util/GetUtil";
import {DraggableProps} from "../hooks/draggableHooks";
import {useDatabaseChange} from "../hooks/databaseHooks";
import {DraggableBlurEntry} from "../BlurEntries";
import {HubEntryLabel} from "./submodules/DeviceLabels";
import {useTimeout} from "../hooks/timerHooks";
import {HubUtil} from "../../../util/HubUtil";

interface HubEntryProps extends DraggableProps {
  sphereId: sphereId,
  hubId?:   hubId,
  stoneId?: stoneId,
  editMode: boolean,
}

export function HubEntry(props: HubEntryProps) {
  let [showStateIcon, setShowStateIcon] = useState(false);
  useTimeout(() => { setShowStateIcon(true); }, 3000);

  let hub = Get.hub(props.sphereId, props.hubId) || DataUtil.getHubByStoneId(props.sphereId, props.stoneId);
  let stone = Get.stone(props.sphereId, props.stoneId ?? hub.config.linkedStoneId);
  if (!stone && !hub) {return <React.Fragment />;}

  let name = stone?.config?.name || hub?.config?.name;
  let hubProblem = HubUtil.getProblems(props.sphereId, props.hubId, props.stoneId);

  // update the switchstate based on the changes in the store
  useDatabaseChange({
    updateStoneState: props.stoneId,
    changeStoneAvailability: props.stoneId,
    hubLocationUpdated: props.hubId ?? hub?.id,
    updateHubConfig: hub?.id,
    changeHubs: hub?.id,
  });

  let settingsCallback = () => {  NavigationUtil.launchModal( "HubOverview",{sphereId: props.sphereId, stoneId: hub?.config?.linkedStoneId || props.stoneId, hubId: props.hubId}); }

  return (
    <DraggableBlurEntry
      {...props}
      title={name}
      iconItem={<DeviceEntryIcon stone={stone} stoneId={props.stoneId} />}
      control={(props) => { return (
        <TouchableOpacity style={{paddingRight:15, height:70, justifyContent:'center'}} onPress={settingsCallback}>
          {
          hubProblem && !showStateIcon ? <ActivityIndicator size={"small"} /> :
          hubProblem ?
            <Icon name={'ios-warning'} size={30} color={colors.csOrange.hex} />
            :
            <View style={{width:30, height:30}} >
              <View style={{position:'absolute', top:5, left:2, width:18, height:18, backgroundColor: colors.white.hex, borderRadius:9}} />
              <Icon name={'ios-checkmark-circle'} size={30} color={colors.green.hex} />
            </View>

          }
        </TouchableOpacity>
        )
      }}
      labelItem={(props) => { return <HubEntryLabel hub={hub} stone={stone} editMode={props.editMode}/> }}
      editSettingsCallback={settingsCallback}
    />
  );
}
