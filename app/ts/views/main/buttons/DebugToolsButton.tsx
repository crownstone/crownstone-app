import * as React from 'react';
import {
  Alert,
  TouchableOpacity,
  View, ViewStyle
} from "react-native";
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { Permissions } from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";
import { Util } from "../../../util/Util";
import { LocalizationLogger } from "../../../backgroundProcesses/LocalizationLogger";


export function DebugToolsButton(props: {inSphere: boolean, arrangingRooms: boolean, sphereId: string}) {
  let state = core.store.getState();
  if (state.user.developer) {

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
      <HiddenFadeInView visible={props.arrangingRooms === false && props.inSphere} style={buttonStyle}>
        <TouchableOpacity onPress={() => {
          core.eventBus.emit("showPopup", {buttons: [
            {close: false, text:"The last minute, I've been in ...",   callback: () => { selectRecentRoom(props.sphereId, 1); }},
            {close: false, text:"The last 2 minutes, I've been in ...",  callback: () => { selectRecentRoom(props.sphereId, 2); }},
            {close: false, text:"The last 5 minutes, I've been in ...",  callback: () => { selectRecentRoom(props.sphereId, 5); }},
            {close: false, text:"The last 10 minutes, I've been in ...", callback: () => { selectRecentRoom(props.sphereId, 10); }},
            {close: false, text:"The last 15 minutes, I've been in ...", callback: () => { selectRecentRoom(props.sphereId, 15); }},
            {close: false, text:"The last 30 minutes, I've been in ...", callback: () => { selectRecentRoom(props.sphereId, 30); }},
            {close: false, text:"The last hour, I've been in ...",       callback: () => { selectRecentRoom(props.sphereId, 60); }},
          ]})
        }}>
          <View style={viewStyle}>
            <View style={{
              width: innerRadius,
              height: innerRadius,
              borderRadius: 0.5 * innerRadius,
              borderColor: iconColor,
              borderWidth: 2.5,
              backgroundColor: 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="ios-bug" size={size} color={iconColor}/>
            </View>
          </View>
        </TouchableOpacity>
      </HiddenFadeInView>
    );
  }
  return <View />;
}

function selectRecentRoom(sphereId: string, minutes: number) {
  let state = core.store.getState();
  let locations = state.spheres[sphereId].locations;
  let data = [];
  for (let classification of LocalizationLogger._lastClassifications) {
    if (classification.region ===  sphereId) {
      let locationId = classification.location;
      let location = locations[locationId];
      data.push({
        text: "... in the " + locations[locationId].config.name, callback: async () => {
          await LocalizationLogger.classify(minutes * 60, location);
          setTimeout(() => {
            Alert.alert("Stored!", "The localization dataset has been saved. Share it via the developer menu.")
          }, 300);
        }
      })
    }
  }
  if (data.length > 0) {
    data.push({close: false, text: "Somewhere else...", callback: () => { selectFromRoomList(sphereId, minutes); }})
    core.eventBus.emit("UpdateOptionPopup", {buttons: data});
    return
  }
  else {
    return selectFromRoomList(sphereId, minutes);
  }
}

function selectFromRoomList(sphereId:string, minutes: number) {
  let state = core.store.getState();
  let locations = state.spheres[sphereId].locations;
  let data = [];
  for (let locationId in locations) {
    let location = locations[locationId];
    data.push({
      text: "... in the " + locations[locationId].config.name, callback: async () => {
        await LocalizationLogger.classify(minutes * 60, location);
        setTimeout(() => {
          Alert.alert("Stored!", "The localization dataset has been saved. Share it via the developer menu.")
        }, 300);
      }
    })
  }
  data.sort((a,b) =>  { return a.text < b.text ? -1 : 1})
  core.eventBus.emit("UpdateOptionPopup", {buttons: data});
}
