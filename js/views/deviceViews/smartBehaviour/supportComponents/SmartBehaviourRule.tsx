import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";
import { ActivityIndicator, Alert, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, deviceStyles, screenWidth, styles } from "../../../styles";
import { SlideSideFadeInView } from "../../../components/animated/SlideFadeInView";
import { core } from "../../../../core";
import { Icon } from "../../../components/Icon";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import * as React from "react";
import { ScaledImage } from "../../../components/ScaledImage";
import { DAY_INDICES_MONDAY_START } from "../../../../Constants";


export function SmartBehaviourRule(props: {
  rule: any,
  sphereId: string,
  stoneId: string,
  ruleId: string,
  editMode: boolean,
  faded: boolean,
  startedYesterday?: boolean,
  activeDay?: string,
  selected?: boolean,
  ruleSelection?: boolean,
}) {
  let ai;
  if      (props.rule.type === "BEHAVIOUR") { ai = new AicoreBehaviour(props.rule.data); }
  else if (props.rule.type === "TWILIGHT")  { ai = new AicoreTwilight(props.rule.data);  }

  let labelStyle : TextStyle = {
    color: props.rule.syncedToCrownstone === false || props.faded ? colors.csBlue.rgba(0.4) : colors.csBlueDark.hex,
    fontSize:16,
    textAlign:'center',
    textDecorationLine: props.rule.deleted ? 'line-through' : 'none'
  };
  let yesterdayStyle : TextStyle = {
    color: props.rule.syncedToCrownstone === false || props.faded ? colors.csBlue.rgba(0.4) : colors.csBlueDark.hex,
    fontSize: 13,
    textAlign:'center',
    fontWeight:'bold',
    textDecorationLine: props.rule.deleted ? 'line-through' : 'none'
  };
  if (props.selected) {;
    labelStyle['color'] = colors.csBlueDark.hex;
    labelStyle['fontWeight'] = 'bold';
  }

  let showEditIcons = props.editMode && !props.ruleSelection && !props.rule.deleted;
  const editCallback = () => {
    NavigationUtil.launchModal(
      "DeviceSmartBehaviour_Editor",
      {
        data: ai,
        sphereId: props.sphereId,
        stoneId: props.stoneId,
        ruleId: props.ruleId,
        selectedDay: props.activeDay,
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
            if (props.rule.activeDays[DAY_INDICES_MONDAY_START[i]]) {
              activeDayCount++;
            }
          }

          if (activeDayCount === 0) {
            Alert.alert(
              "Are you sure?",
              "Since this behaviour is only active on this day, removing it will remove it completely.",
              [{text:"Cancel"}, {text:"I'm sure", onPress: () =>{
                if (props.rule.idOnCrownstone) {
                  core.store.dispatch({type:"MARK_STONE_RULE_FOR_DELETION", sphereId: props.sphereId, stoneId: props.stoneId, ruleId: props.ruleId});
                }
                else {
                  core.store.dispatch({type:"REMOVE_STONE_RULE", sphereId: props.sphereId, stoneId: props.stoneId, ruleId: props.ruleId});
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
                ruleId: props.ruleId,
                rule: props.rule.data,
                selectedDay: props.activeDay,
                deleteRule: true,
                isModal: true,
              });
          }
        }} style={{width:50}}>
          <Icon name={'ios-trash'} color={colors.red.rgba(0.6)} size={30} />
        </TouchableOpacity>
      </SlideSideFadeInView>
      { /* /Delete Icon */ }

      { /* ActivityIndicator for sync required */ }
      <SlideSideFadeInView width={50} visible={props.rule.syncedToCrownstone === false && !props.editMode}>
        <ActivityIndicator size={"small"} color={colors.csBlue.hex} style={{marginRight:15}} />
      </SlideSideFadeInView>
      { /* /ActivityIndicator for sync required */ }

      { /* Rule text */ }
      <TouchableOpacity style={{flex:1}} onPress={editCallback}>
        { props.startedYesterday && <Text style={yesterdayStyle}>{"(Started Yesterday)"}</Text> }
        <Text style={labelStyle}>{ai.getSentence()}</Text>
        { props.rule.syncedToCrownstone === false && props.editMode && !props.ruleSelection ?
          <Text style={{color: colors.csBlueDark.hex,fontSize:13,textAlign:'center',}}>{"( Not on Crownstone yet... )"}</Text> : undefined }
      </TouchableOpacity>
      { /* /Rule text */ }


      { /* Edit icon */ }
      <SlideSideFadeInView width={50} visible={showEditIcons}>
        <TouchableOpacity onPress={editCallback} style={{width:50, alignItems:'flex-end'}}>
          <Icon name={'md-create'} color={colors.menuTextSelected.hex} size={26} />
        </TouchableOpacity>
      </SlideSideFadeInView>
      { /* /Edit icon */ }


      { /* Selection checkmark */ }
      <SlideSideFadeInView width={50} visible={props.editMode && props.ruleSelection && !props.selected}></SlideSideFadeInView>
      <SlideSideFadeInView width={50} visible={props.editMode && props.ruleSelection && props.selected}>
        <View style={{width:50, alignItems:'flex-end'}}>
          <Icon name={'ios-checkmark-circle'} color={colors.green.hex} size={26} />
        </View>
      </SlideSideFadeInView>
      { /* /Selection checkmark */ }

      { /* ActivityIndicator for sync required counterWeight */ }
      <SlideSideFadeInView width={50} visible={props.rule.syncedToCrownstone === false && !props.editMode} />
      { /* /ActivityIndicator for sync required */ }
    </View>
  );
}

