
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HubProblems", key)(a,b,c,d,e);
}

import {ActivityIndicator, Alert, Text, TextStyle, View, ViewStyle} from "react-native";
import {colors, styles} from "../styles";
import * as React from "react";
import {Button} from "../components/Button";
import {core} from "../../Core";
import {HubReplyError} from "./HubEnums";
import {Scheduler} from "../../logic/Scheduler";
import {LOGw} from "../../logging/Log";
import {DataUtil} from "../../util/DataUtil";
import {CLOUD} from "../../cloud/cloudAPI";
import {xUtil} from "../../util/StandAloneUtil";
import {HubTransferNext} from "../../cloud/sections/newSync/transferrers/HubTransferNext";
import {HubHelper} from "../../native/setup/HubHelper";
import {HubUtil} from "../../util/HubUtil";


let textStyle : TextStyle = {textAlign:'center', fontSize:16, fontWeight:'bold'};
let viewStyle : ViewStyle = {...styles.centered, flex:1, padding:15};
export function HubIssue_Fixing() {
  return <View key={"Fixing"} style={viewStyle}>
    <Text style={textStyle}>{ lang("Fixing_issue___") }</Text>
    <View style={{flex:0.25}}/>
    <ActivityIndicator size={'large'} />
    <View style={{flex:1}}/>
  </View>
}


export function HubIssue_NO_LINKED_STONE() {
  return (
    <View key={"StoneMissingFix"} style={viewStyle}>
      <Text style={textStyle}>{ lang("This_hub_has_no_Crownston") }</Text>
      <View style={{flex:1}}/>
    </View>
  );
}


export function HubIssue_NO_HUB_IN_DB(sphereId: string, stone: StoneData, setFixing: (bool) => void) {
  return (
    <View key={"HubReferenceFix"} style={viewStyle}>
      <Text style={textStyle}>{ lang("The_hub_reference_in_the_") }</Text>
      <View style={{flex:1}}/>
      <Button
        backgroundColor={colors.blue.rgba(0.5)}
        label={ lang("Fix_now__")}
        icon={"ios-build"}
        iconSize={14}
        callback={() => {
          setFixing(true);
          let helper = new HubHelper();
          helper.createLocalHubInstance(sphereId, stone.id)
            .then((hubId) => {
              core.store.dispatch({type:"UPDATE_HUB_CONFIG", sphereId: sphereId, hubId: hubId, data: {locationId: stone.config.locationId}});
              setFixing(false);
            })
            .catch(async (err) => {
              if (err?.code === 3 && err?.type === HubReplyError.IN_SETUP_MODE) {
                await HubUtil.createHub(sphereId, stone.id);
                await Scheduler.delay(5000);
                setFixing(false);
              }
              else {
                throw err;
              }
              setFixing(false);
            })
            .catch((err) => {
              Alert.alert(
                lang("_Something_went_wrong_____P_header"),
                lang("_Something_went_wrong_____P_body"),
                [{text:lang("_Something_went_wrong_____P_left")}]);
              setFixing(false);
            })
        }}
      />
    </View>
  );
}


export function HubIssue_NO_UART_CONNECTION() {
  return (
    <View key={"HubUartFailed"} style={viewStyle}>
      <Text style={textStyle}>{ lang("The_hub_is_not_responding") }</Text>
      <View style={{flex:1}}/>
    </View>
  );
}


export function HubIssue_HUB_NOT_INITIALIZED(sphereId: string, stoneId: string, setFixingState: (bool) => void) {
  return (
    <View key={"HubSetupFix"} style={viewStyle}>
      <Text style={textStyle}>{ lang("The_hub_itself_is_not_ini") }</Text>
      <View style={{flex:1}}/>
      <Button
        backgroundColor={colors.blue.rgba(0.5)}
        label={ lang("Initialize_hub_")}
        icon={"ios-build"}
        iconSize={14}
        callback={async () => {
          setFixingState(true);
          await HubUtil.createHub(sphereId, stoneId);
          setFixingState(false);
        }}
      />
    </View>
  );
}


export function HubIssue_MULTIPLE_HUB_INSTANCES_ON_STONE(sphereId: string, stoneId: string, setFixingState: (bool) => void) {
  return (
    <View key={"HubMultiple"} style={viewStyle}>
      <Text style={textStyle}>{ lang("There_are_multiple_hubs_b") }</Text>
      <View style={{flex:1}}/>
      <Button
        backgroundColor={colors.blue.rgba(0.5)}
        label={ lang("Fix_it_")}
        icon={"ios-build"}
        iconSize={14}
        callback={async () => {
          setFixingState(true);
          await HubUtil.fixMultipleHubs(sphereId, stoneId);
          setFixingState(false);
        }}
      />
    </View>
  );
}


export function HubIssue_HUB_NOT_FROM_THIS_SPHERE(sphereId: string, stoneId: string, setFixingState: (bool) => void) {
  return (
    <View key={"HubUartEncryptionFailed"} style={viewStyle}>
      <Text style={textStyle}>{lang("This_hub_does_not_belong_")}</Text>
      <View style={{flex: 1}}/>
      <Button
        backgroundColor={colors.blue.rgba(0.5)}
        label={lang("Factory_reset_hub__")}
        icon={"ios-build"}
        iconSize={14}
        callback={async () => {
          setFixingState(true);
          let helper = new HubHelper();
          try {
            await helper.factoryResetHubOnly(sphereId, stoneId);
            await helper.setup(sphereId, stoneId);
            await HubUtil.fixMultipleHubs(sphereId, stoneId);
            await Scheduler.delay(3000);
          } catch (e) {
            LOGw.info("Failed to reset hub", e)
            Alert.alert(
              lang("_Something_went_wrong_____Pl_header"),
              lang("_Something_went_wrong_____Pl_body"),
              [{text: lang("_Something_went_wrong_____Pl_left")}])
          }
          setFixingState(false);
        }}
      />
    </View>
  );
}


export function HubIssue_UART_ENCRYPTION_NOT_ENABLED(sphereId: string, stoneId: string, setFixingState: (bool) => void) {
  return (
    <View key={"HubUartEncryptionDisabled"} style={viewStyle}>
      <Text style={textStyle}>{lang("Encryption_is_not_enabled")}</Text>
      <View style={{flex: 1}}/>
      <Button
        backgroundColor={colors.blue.rgba(0.5)}
        label={ lang("Enable_encryption__")}
        icon={"ios-build"}
        iconSize={14}
        callback={async () => {
          setFixingState(true);
          let helper = new HubHelper();
          try {
            await helper.setUartKey(sphereId, stoneId);
          } catch (e) {
            Alert.alert(
              lang("_Something_went_wrong_____Ple_header"),
              lang("_Something_went_wrong_____Ple_body"),
              [{text: lang("_Something_went_wrong_____Ple_left")}])
          }
          setFixingState(false);
        }}
      />
    </View>
  );
}


export function HubIssue_CLOUD_ID_MISSING(sphereId: string, stone: StoneData, hub: HubData, setFixingState: (bool) => void) {
  return (
    <View key={"HubCloudMissing"} style={viewStyle}>
      <Text style={textStyle}>{ lang("This_hub_does_not_exist_i") }</Text>
      <View style={{flex:1}}/>
      <Button
        backgroundColor={colors.blue.rgba(0.5)}
        label={ lang("Fix_it_")}
        icon={"ios-build"}
        iconSize={14}
        callback={async () => {
          setFixingState(true);
          let helper = new HubHelper();
          try {
            let requestCloudId = await helper.getCloudIdFromHub(sphereId, stone.id);
            let existingHub = DataUtil.getHubByCloudId(sphereId, requestCloudId);

            if (existingHub) {
              // we actually have the requested hub in our local database. Delete the one without cloudId, and bind the other to this Crownstone.
              core.store.batchDispatch([
                {type:"REMOVE_HUB", sphereId: sphereId, hubId: hub.id},
                {type:"UPDATE_HUB_CONFIG", sphereId: sphereId, hubId: hub.id, data: {linkedStoneId: stone.id, locationId: stone.config.locationId}},
              ]);
              return;
            }

            // we dont have it locally, look in the cloud.
            try {
              let hubCloudData = await CLOUD.getHub(requestCloudId);
              // we have it in the cloud, store locally
              core.store.batchDispatch([
                {type:"REMOVE_HUB", sphereId: sphereId, hubId: hub.id},
                {type:"ADD_HUB", sphereId: sphereId, hubId: xUtil.getUUID(), data: HubTransferNext.mapCloudToLocal(hubCloudData, stone.id, stone.config.locationId)},
              ]);
            }
            catch (err : any) {
              if (err?.status === 404) {
                // this item does not exist  in the cloud.. Factory reset required.
                core.store.dispatch({ type: "REMOVE_HUB", sphereId: sphereId, hubId: hub.id });
                await helper.factoryResetHubOnly(sphereId, stone.id);
                await helper.setup(sphereId, stone.id);
              }
              else {
                throw err;
              }
            }
            setFixingState(false);
          }
          catch(err) {
            Alert.alert(
              lang("_Something_went_wrong_____Plea_header"),
              lang("_Something_went_wrong_____Plea_body"),
              [{text:lang("_Something_went_wrong_____Plea_left")}]);
            setFixingState(false);
          }
        }}
      />
    </View>
  );
}


export function HubIssue_HUB_NOT_REPORTED_TO_CLOUD_TIMEOUT() {
  return (
    <View key={"HubDidNotReport"} style={viewStyle}>
      <Text style={textStyle}>{ lang("The_hub_did_not_report") }</Text>
      <View style={{flex:1}}/>
    </View>
  );
}


export function HubIssue_HUB_NOT_CONNECTED_TO_THE_INTERNET() {
  return (
    <View key={"HubNoInternet"} style={viewStyle}>
      <Text style={textStyle}>{lang("The_hub_is_not_connected_")}</Text>
      <View style={{flex: 1}}/>
    </View>
  );
}


export function HubIssue_HUB_REPORTS_ERROR() {
  return (
    <View key={"Hub Reports Error"} style={viewStyle}>
      <Text style={textStyle}>{lang("The_hub_is_reporting_an_e")}</Text>
      <View style={{flex: 1}}/>
    </View>
  );
}


export function HubIssue_NO_PROBLEM(hub: HubData) {
  if (hub.config.ipAddress) {
    return (
      <View key={"HubIPAddress"} style={viewStyle}>
        <Text style={textStyle}>{ lang("Everything_is_looking_goo") }</Text>
        <Text style={{...textStyle, fontSize: 20}}>{hub.config.ipAddress}</Text>
        <View style={{flex:1}}/>
      </View>
    )
  }
  else {
    return (
      <View key={"HubOK"} style={viewStyle}>
        <Text style={textStyle}>{ lang("Everything_is_looking_good") }</Text>
        <View style={{flex:1}}/>
      </View>
    );
  }
}

