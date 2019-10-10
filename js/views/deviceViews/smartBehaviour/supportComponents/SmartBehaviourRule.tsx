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

  return (
    <View style={{padding:15, flexDirection: 'row', width: screenWidth, alignItems:'center', justifyContent:'center'}}>
      { /* Delete Icon */ }
      <SlideSideFadeInView width={50} visible={showEditIcons}>
        <TouchableOpacity onPress={() => {
          core.eventBus.emit("showCustomOverlay", { content:
              <DeleteOverlayContent
                deleteOneCallback={() => {
                  let select = (method) => {
                    return () => {
                      // check if we are even active on multiple days
                      let usedDays = 0;
                      for (let i = 0; i < 7; i++) {
                        usedDays += props.rule.activeDays[DAY_INDICES_MONDAY_START[i]] ? 1 : 0;
                      }

                      if (usedDays > 1) {
                        let newActiveDays = {};
                        newActiveDays[props.activeDay] = false;
                        core.store.dispatch({
                          type: "UPDATE_STONE_RULE",
                          sphereId: props.sphereId,
                          stoneId: props.stoneId,
                          ruleId: props.ruleId,
                          data: { activeDays: newActiveDays }
                        });
                      }
                      else {
                        core.store.dispatch({
                          type: method,
                          sphereId: props.sphereId,
                          stoneId: props.stoneId,
                          ruleId: props.ruleId,
                        });
                      }
                    }
                  }

                  handleDelete(
                    props.rule.syncedToCrownstone,
                    select("MARK_STONE_RULE_FOR_DELETION"),
                    select("REMOVE_STONE_RULE"),
                  );
                }}
                deleteAllCallback={() => {
                  let select = (method) => {
                    return () => { core.store.dispatch({ type: method, sphereId: props.sphereId, stoneId: props.stoneId, ruleId: props.ruleId }); }
                  }
                  handleDelete(
                    props.rule.syncedToCrownstone,
                    select("MARK_STONE_RULE_FOR_DELETION"),
                    select("REMOVE_STONE_RULE")
                  );
                }}
              />})
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
      <View style={{flex:1}}>
        { props.startedYesterday && <Text style={yesterdayStyle}>{"(Started Yesterday)"}</Text> }
        <Text style={labelStyle}>{ai.getSentence()}</Text>
        { props.rule.syncedToCrownstone === false && props.editMode && !props.ruleSelection ?
          <Text style={{color: colors.csBlueDark.hex,fontSize:13,textAlign:'center',}}>{"( Not on Crownstone yet... )"}</Text> : undefined }
      </View>
      { /* /Rule text */ }


      { /* Edit icon */ }
      <SlideSideFadeInView width={50} visible={showEditIcons}>
        <TouchableOpacity onPress={() => {
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
        }} style={{width:50, alignItems:'flex-end'}}>
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


function handleDelete(syncedToCrownstone, executeSynced, executeUnSynced) {
  if (syncedToCrownstone) {
    Alert.alert(
      "Are you sure?",
      "I'll delete this rule from the Crownstone as soon as I can. Once that is done it will be removed from the list, until then, it will be crossed through.",
      [
        {text:"Nope"},
        {text:"OK", onPress:() => {
          executeSynced();
          core.eventBus.emit("hideCustomOverlay");
        }}])
  }
  else {
    Alert.alert(
      "Are you sure?",
      "I'll remove this rule before it has been set on the Crownstone.",
      [
        {text:"Nope"},
        {text:"OK", onPress:() => {
          executeUnSynced();
          core.eventBus.emit("hideCustomOverlay");
        }}
      ]);
  }
}

export function DeleteOverlayContent(props : { deleteOneCallback: any, deleteAllCallback: any }) {
  return (
    <OverlayContent
      header={"Delete only for this day?"}
      callbackSingle={props.deleteOneCallback}
      imageSourceSingle={require("../../../../images/icons/deleteOne.png")}
      labelSingle={"Delete this behaviour for this day."}
      callbackAll={props.deleteAllCallback}
      imageSourceAll={require("../../../../images/icons/deleteAll.png")}
      labelAll={"Delete this behaviour for all days."}
    />
  );
}


export function EditOverlayContent(props) {
  return (
    <OverlayContent
      header={"Edit only for this day?"}
      callbackSingle={props.editOneCallback}
      imageSourceSingle={require("../../../../images/icons/editOne.png")}
      labelSingle={"Edit this behaviour for this day."}
      callbackAll={props.editAllCallback}
      imageSourceAll={require("../../../../images/icons/editAll.png")}
      labelAll={"Edit this behaviour for all days."}
    />
  );
}

function OverlayContent(props) {
  let buttonStyle : ViewStyle = {
    width: 0.75*screenWidth,
    borderRadius: 20,
    padding:20,
    backgroundColor:colors.menuTextSelected.rgba(0.1),
    margin: 10,
    alignItems:'center',
    justifyContent:'center'
  }

  let textStyle : TextStyle = {
    paddingHorizontal: 5,
    fontWeight: 'bold',
    fontSize: 16
  };

  return (
    <View style={{flex:1}}>
      <View style={{height:30}} />
      <Text numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5} style={deviceStyles.header}>{props.header}</Text>
      <View style={{flex:1}} />
      <TouchableOpacity onPress={() => {props.callbackSingle();}} style={buttonStyle}>
        <ScaledImage source={props.imageSourceSingle} sourceWidth={852} sourceHeight={379} targetWidth={0.7*screenWidth} targetHeight={100}/>
        <View style={{height:30}} />
        <Text numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5} style={textStyle}>{props.labelSingle}</Text>
      </TouchableOpacity>
      <View style={{flex:1}} />
      <TouchableOpacity onPress={() => { props.callbackAll(); }} style={buttonStyle}>
        <ScaledImage source={props.imageSourceAll} sourceWidth={852} sourceHeight={379} targetWidth={0.7*screenWidth} targetHeight={100}/>
        <View style={{height:30}} />
        <Text numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5} style={textStyle}>{props.labelAll}</Text>
      </TouchableOpacity>
    </View>
  )
}