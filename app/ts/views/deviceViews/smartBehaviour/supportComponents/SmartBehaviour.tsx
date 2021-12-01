
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SmartBehaviourBehaviour", key)(a,b,c,d,e);
}
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";
import { ActivityIndicator, Alert, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, deviceStyles, screenWidth, styles } from "../../../styles";
import { SlideSideFadeInView } from "../../../components/animated/SlideFadeInView";
import { core } from "../../../../Core";
import { Icon } from "../../../components/Icon";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import * as React from "react";
import { DAY_INDICES_MONDAY_START } from "../../../../Constants";


export function SmartBehaviour(props: {
  behaviour: any,
  sphereId: string,
  stoneId: string,
  behaviourId: string,
  editMode: boolean,
  faded: boolean,
  indoorLocalizationDisabled: boolean,
  overrideActive?: boolean,
  startedYesterday?: boolean,
  activeDay?: string,
  selected?: boolean,
  behaviourSelection?: boolean,
}) {
  let ai;
  if      (props.behaviour.type === "BEHAVIOUR") { ai = new AicoreBehaviour(props.behaviour.data); }
  else if (props.behaviour.type === "TWILIGHT")  { ai = new AicoreTwilight(props.behaviour.data);  }

  let showEditIcons = props.editMode && !props.behaviourSelection && !props.behaviour.deleted;

  const editCallback = () => {
    NavigationUtil.launchModal(
      "DeviceSmartBehaviour_Editor",
      {
        data: ai,
        sphereId: props.sphereId,
        stoneId: props.stoneId,
        behaviourId: props.behaviourId,
        selectedDay: props.activeDay,
        twilightBehaviour: props.behaviour.type === "TWILIGHT",
        isModal: true,
      });
  }

  return (
    <View style={{padding:15, flexDirection: 'row', width: screenWidth, alignItems:'center', justifyContent:'center'}}>
      { /* Delete Icon */ }
      <SlideSideFadeInView width={50} visible={showEditIcons}>
        <TouchableOpacity onPress={() => {
          let activeDayCount = 0;
          for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
            if (props.behaviour.activeDays[DAY_INDICES_MONDAY_START[i]]) {
              activeDayCount++;
            }
          }

          if (activeDayCount === 0) {
            Alert.alert(
              lang("_Are_you_sure___Since_thi_header"),
              lang("_Are_you_sure___Since_thi_body"),
              [{text:lang("_Are_you_sure___Since_thi_left")}, {
              text:lang("_Are_you_sure___Since_thi_right"), onPress: () => {
                if (props.behaviour.idOnCrownstone !== null) {
                  core.store.dispatch({type:"MARK_STONE_BEHAVIOUR_FOR_DELETION", sphereId: props.sphereId, stoneId: props.stoneId, behaviourId: props.behaviourId});
                }
                else {
                  core.store.dispatch({type:"REMOVE_STONE_BEHAVIOUR", sphereId: props.sphereId, stoneId: props.stoneId, behaviourId: props.behaviourId});
                }
              }}])
          }
          else {
            NavigationUtil.launchModal(
              "DeviceSmartBehaviour_Wrapup",
              {
                data: ai,
                sphereId: props.sphereId,
                stoneId: props.stoneId,
                behaviourId: props.behaviourId,
                behaviour: props.behaviour.data,
                twilightBehaviour: props.behaviour.type === "TWILIGHT",
                selectedDay: props.activeDay,
                deleteBehaviour: true,
                isModal: true,
              });
          }
        }} style={{width:50}}>
          <Icon name={'ios-trash'} color={colors.red.rgba(0.6)} size={30} />
        </TouchableOpacity>
      </SlideSideFadeInView>
      { /* /Delete Icon */ }

      { /* ActivityIndicator for sync required */ }
      <SlideSideFadeInView width={50} visible={(props.behaviour.syncedToCrownstone === false || props.behaviour.deleted) && !props.editMode}>
        <ActivityIndicator size={"small"} color={colors.csBlue.hex} style={{marginRight:15}} />
      </SlideSideFadeInView>
      { /* /ActivityIndicator for sync required */ }

      { /* behaviour text */ }
      { BehaviourDescription(props, ai, editCallback, showEditIcons, props.indoorLocalizationDisabled, props.overrideActive) }
      { /* /behaviour text */ }


      { /* Edit icon */ }
      <SlideSideFadeInView width={50} visible={showEditIcons}>
        <TouchableOpacity onPress={editCallback} style={{width:50, alignItems:'flex-end'}}>
          <Icon name={'md-create'} color={colors.blue.hex} size={26} />
        </TouchableOpacity>
      </SlideSideFadeInView>
      { /* /Edit icon */ }


      { /* Selection checkmark */ }
      <SlideSideFadeInView width={50} visible={props.editMode && props.behaviourSelection && !props.selected}></SlideSideFadeInView>
      <SlideSideFadeInView width={50} visible={props.editMode && props.behaviourSelection && props.selected}>
        <View style={{width:50, alignItems:'flex-end'}}>
          <Icon name={'ios-checkmark-circle'} color={colors.green.hex} size={26} />
        </View>
      </SlideSideFadeInView>
      { /* /Selection checkmark */ }

      { /* ActivityIndicator for sync required counterWeight */ }
      <SlideSideFadeInView width={50} visible={props.behaviour.syncedToCrownstone === false && !props.editMode} />
      { /* /ActivityIndicator for sync required */ }
    </View>
  );
}

function BehaviourDescription(props, ai : AicoreBehaviour | AicoreTwilight, editCallback, showEditIcons, indoorLocalizationDisabled, overrideActive) {
  let labelStyle : TextStyle = {
    color: props.behaviour.syncedToCrownstone === false || props.faded ? colors.csBlue.rgba(0.4) : colors.csBlueDark.hex,
    fontSize:16,
    textAlign:'center',
    textDecorationLine: props.behaviour.deleted ? 'line-through' : 'none'
  };

  if (props.selected) {;
    labelStyle['color'] = colors.csBlueDark.hex;
    labelStyle['fontWeight'] = 'bold';
  }

  let yesterdayStyle : TextStyle = {
    color: props.behaviour.syncedToCrownstone === false || props.faded ? colors.csBlue.rgba(0.4) : colors.csBlueDark.hex,
    fontSize: 13,
    textAlign:'center',
    fontWeight:'bold',
    textDecorationLine: props.behaviour.deleted ? 'line-through' : 'none'
  };

  let paddingHorizontal = showEditIcons ? 0 : 20;

  let subLabel = null;
  let subLabelStyle : TextStyle = {};
  if (props.behaviour.syncedToCrownstone === false && showEditIcons) {
    subLabel = lang("__Not_on_Crownstone_yet__");
  }
  if (props.behaviour.deleted && showEditIcons) {
    subLabel = lang("__Not_removed_from_Crowns");
  }

  // if (!showEditIcons && overrideActive) {
  //   subLabel = "This behaviour is currently overbehaviourd because someone manually switched it.";
  //   subLabelStyle = { color: colors.csBlue.rgba(0.4), fontWeight:'bold'};
  // }

  if (indoorLocalizationDisabled && !showEditIcons && ai.isUsingPresence()) {
    subLabel = lang("Indoor_localization_disab");
    subLabelStyle = { color: colors.csOrange.hex, fontWeight:'bold'};
  }

  let content = (
    <View style={{flex:1, paddingHorizontal: paddingHorizontal }}>
      { props.startedYesterday && <Text style={yesterdayStyle}>{ lang("_Started_Yesterday_") }</Text> }
      <Text style={labelStyle}>{ai.getSentence(props.sphereId)}</Text>
      { subLabel ? <Text style={{color: colors.csBlueDark.hex,fontSize:13,textAlign:'center', ...subLabelStyle}}>{subLabel}</Text> : undefined }
    </View>
  )

  if (props.editMode && showEditIcons) {
    return (
      <TouchableOpacity style={{flex:1}} onPress={editCallback}>
        {content}
      </TouchableOpacity>
    )
  }
  else {
    return content;
  }

}
