import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { colors, screenWidth } from "../../../../styles";
import { SlideSideFadeInView } from "../../../../components/animated/SlideFadeInView";
import { core } from "../../../../../core";
import { Icon } from "../../../../components/Icon";
import { NavigationUtil } from "../../../../../util/NavigationUtil";
import * as React from "react";

export function SmartBehaviourRule(props) {
  let ai;
  if      (props.rule.type === "BEHAVIOUR") { ai = new AicoreBehaviour(props.rule.data); }
  else if (props.rule.type === "TWILIGHT")  { ai = new AicoreTwilight(props.rule.data);  }
  return (
    <View style={{padding:15, flexDirection: 'row', width: screenWidth, alignItems:'center', justifyContent:'center'}}>
      <SlideSideFadeInView width={50} visible={props.editMode}>
        <TouchableOpacity onPress={() => {
          if (props.rule.syncedToCrownstone === false) {
            Alert.alert(
              "Are you sure?",
              "I'll remove this rule before it has been set on the Crownstone.",
              [{text:"OK", onPress:() => {
                  core.store.dispatch({
                    type: "REMOVE_STONE_RULE",
                    sphereId: props.sphereId,
                    stoneId: props.stoneId,
                    ruleId: props.ruleId,
                  });
                }}, {text:"Nope"}])
          }
          else {
            Alert.alert(
              "Are you sure?",
              "I'll delete this rule from the Crownstone as soon as I can. Once that is done it will be removed from the list, until then, it will be crossed through.",
              [{text:"OK", onPress:() => {
                  core.store.dispatch({
                    type: "MARK_STONE_RULE_FOR_DELETION",
                    sphereId: props.sphereId,
                    stoneId: props.stoneId,
                    ruleId: props.ruleId,
                  });
                }}, {text:"Nope"}])
          }
        }} style={{width:50}}>
          <Icon name={'ios-trash'} color={colors.red.rgba(0.6)} size={30} />
        </TouchableOpacity>
      </SlideSideFadeInView>
      { props.rule.syncedToCrownstone === false && !props.editMode ? <ActivityIndicator size={"small"} color={colors.csBlue.hex} /> : undefined }
      <View style={{flex:1}}>
        <Text style={{
          color: props.rule.syncedToCrownstone === false  || props.faded ? colors.csBlue.rgba(0.4) : colors.csBlueDark.hex,
          fontSize:16,
          textAlign:'center',
          textDecorationLine: props.rule.deleted ? 'line-through' : 'none'
        }}>{ai.getSentence()}</Text>

        { props.rule.syncedToCrownstone === false && props.editMode ?
          <Text style={{color: colors.csBlueDark.hex,fontSize:13,textAlign:'center',}}>{"( Not on Crownstone yet... )"}</Text> : undefined }
      </View>
      <SlideSideFadeInView width={50} visible={props.editMode}>
        <TouchableOpacity onPress={() => {
          NavigationUtil.navigate(
            "DeviceSmartBehaviour_Editor",
            {
              data: ai,
              sphereId: props.sphereId,
              stoneId: props.stoneId,
              ruleId: props.ruleId
            });
        }} style={{width:50, alignItems:'flex-end'}}>
          <Icon name={'md-create'} color={colors.menuTextSelected.hex} size={26} />
        </TouchableOpacity>
      </SlideSideFadeInView>
    </View>
  );
}
