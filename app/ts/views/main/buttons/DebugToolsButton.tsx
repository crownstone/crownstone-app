
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DebugToolsButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  TouchableOpacity,
  View, ViewStyle
} from "react-native";
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { core } from "../../../Core";
import { LocalizationLogger } from "../../../backgroundProcesses/dev/LocalizationLogger";
import { SHARE_DATA_TYPE, shareDataViaRTC } from "../../settingsViews/dev/SettingsDeveloper";
import { Scheduler } from "../../../logic/Scheduler";
import { SphereOverviewButton } from "./SphereOverviewButton";
import { DataUtil } from "../../../util/DataUtil";

export function DebugToolsButton(props: {inSphere: boolean, arrangingRooms: boolean, sphereId: string}) {
  if (!DataUtil.isDeveloper()) {
    return <React.Fragment/>
  }

  let outerRadius = 0.11 * screenWidth;
  let innerRadius = outerRadius - 10;
  let size = 0.055 * screenWidth;
  let iconColor = colors.csBlueDark.rgba(0.75);

  let buttonStyle = {
    position:'absolute',
    bottom: 0,
    left: 0,
    padding: 6,
    paddingLeft:10,
    paddingTop:10,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
  };
  let viewStyle : ViewStyle = {
    width: outerRadius,
    height:outerRadius,
    borderRadius:0.5*outerRadius,
    backgroundColor: colors.white.rgba(0.55),
    alignItems:'center',
    justifyContent:'center',
  };


  return (
    <SphereOverviewButton
      icon={'ios-bug'}
      iconScale={1.1}
      callback={() => {
        core.eventBus.emit("showPopup", {buttons: [
            {close: false, text:"The last minute, I've been in ...",     callback: () => { selectRecentRoom(props.sphereId, 1); }},
            {close: false, text:"The last 2 minutes, I've been in ...",  callback: () => { selectRecentRoom(props.sphereId, 2); }},
            {close: false, text:"The last 5 minutes, I've been in ...",  callback: () => { selectRecentRoom(props.sphereId, 5); }},
            {close: false, text:"The last 10 minutes, I've been in ...", callback: () => { selectRecentRoom(props.sphereId, 10); }},
            {close: false, text:"The last 15 minutes, I've been in ...", callback: () => { selectRecentRoom(props.sphereId, 15); }},
            {close: false, text:"The last 30 minutes, I've been in ...", callback: () => { selectRecentRoom(props.sphereId, 30); }},
            {close: false, text:"The last hour, I've been in ...",       callback: () => { selectRecentRoom(props.sphereId, 60); }},
            {text:"Reset collection!",                                   callback: () => {
                LocalizationLogger.resetMeasurement();
                Alert.alert("Cache reset successful","New measurements are coming in again... starting now!",[{text:"Nice!"}])
              }},
          ]})
      }}
      testID={"DebugToolsButton"}
      visible={props.arrangingRooms === false && props.inSphere}
      position={'bottom-left'}
    />
  );
}

function selectRecentRoom(sphereId: string, minutes: number) {
  let state = core.store.getState();
  let locations = state.spheres[sphereId].locations;
  let data = [];
  let classificationOptions = LocalizationLogger.getClassificationOptions(minutes);
  for (let classification of classificationOptions) {
    if (classification.sphereId === sphereId) {
      let locationId = classification.locationId;
      let location = locations[locationId];
      data.push({
        text: "... in the " + locations[locationId].config.name,
        callback: () => { annotate(minutes, location) }
      })
    }
  }
  if (data.length > 0) {
    data.push({close: false, text: "Somewhere else...", callback: () => { selectFromRoomList(sphereId, minutes); }})
    data.push({text: "Custom label...",      callback: () => { customRoom(sphereId, minutes); }})
    core.eventBus.emit("UpdateOptionPopup", {buttons: data});
    return
  }
  else {
    return selectFromRoomList(sphereId, minutes);
  }
}


function annotate(minutes, location: LocationData) {
  Alert.prompt(
    "Please describe how this data was collected",
    "This makes it easier to categorize the data later on.",
    [
      {text:"OK", onPress: async (annotation) => { store(minutes, location, annotation); }},
    ]);
}

async function store(minutes, location, annotation?: string) {
  let pointsStored = await LocalizationLogger.classify(minutes * 60, location, annotation);
  await Scheduler.delay(300);
  Alert.alert("Stored!",
    pointsStored + " points have been saved in a dataset. Share it via the developer menu or press upload!",
    [{text: "Later..."}, {text: "Upload now!", onPress: async () => { await shareDataViaRTC(SHARE_DATA_TYPE.localization); }}])
}

function selectFromRoomList(sphereId:string, minutes: number) {
  let state = core.store.getState();
  let locations = state.spheres[sphereId].locations;
  let data = [];
  for (let locationId in locations) {
    let location = locations[locationId];
    data.push({
      text: "... in the " + locations[locationId].config.name, callback: () => { annotate(minutes, location) }
    });
  }
  data.sort((a,b) =>  { return a.text < b.text ? -1 : 1})
  core.eventBus.emit("UpdateOptionPopup", {buttons: data});
}

function customRoom(sphereId: string, minutes: number) {
  Alert.prompt(
    "How shall we call this dataset?",
    "Annotation comes after this step.",
    async (label) => {
      // @ts-ignore
      annotate(minutes, { config: { name: label, uid: `${label}_custom`} });
  });
}
