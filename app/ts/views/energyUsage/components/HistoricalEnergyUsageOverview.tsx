
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HistoricalEnergyUsageOverview", key)(a,b,c,d,e);
}
import {ActivityIndicator, Alert, Linking, Text, TouchableOpacity, View} from "react-native";
import {colors, screenWidth, styles} from "../../styles";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {Button} from "../../components/Button";
import {core} from "../../../Core";
import {CLOUD} from "../../../cloud/cloudAPI";
import * as React from "react";
import {HistoricalEnergyUsage} from "./HistoricalEnergyUsage";

export function HistoricalEnergyUsageOverview(props : {sphereId: sphereId, mode: GRAPH_TYPE,  hasUploadPermission: boolean, checkedUploadPermission: boolean, setHasUploadPermission: (hasPermission: boolean) => void}) {
  if (props.checkedUploadPermission === false) {
    // we're still getting the permission state, waiting....
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <View style={{flex:1}}/>
        <ActivityIndicator size={'large'} color={colors.black.rgba(0.5)} />
        <View style={{flex:0.5}}/>
        <Text style={{fontSize: 20, color: colors.black.hex, fontWeight:'bold'}}>{ lang("Checking_permission___") }</Text>
        <View style={{flex:3}}/>
      </View>
    )
  }

  if (props.hasUploadPermission === false && Permissions.inSphere(props.sphereId).canProvideEnergyPermission === false) {
    // show the banner that the user has not given permission to upload data.
    // allow the user to minimize the view if he wants to see the uploaded data.
    // if he does that a banner should show to re-enable.
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <View style={{flex:1}}/>
        <Text style={styles.header}>{ lang("User_permission_required_") }</Text>
        <Text style={styles.boldExplanation}>{ lang("If_youd_like_us_to_store_") }</Text>
        <TouchableOpacity onPress={async () => {
          Linking.openURL('https://crownstone.rocks/data-privacy-users/');
        }}>
          <Text style={{...styles.boldExplanation, textDecorationLine:'underline'}}>{ lang("You_can_read_about_the_wa") }</Text>
        </TouchableOpacity>
        <Text style={styles.explanation}>{ lang("Once_enabled__it_becomes_") }</Text>
        <Text style={styles.explanation}>{ lang("The_permission_can_be_rev") }</Text>
        <View style={{flex:2}}/>
      </View>
    );
  }

  if (props.hasUploadPermission === false) {
    // show the banner that the user has not given permission to upload data.
    // allow the user to minimize the view if he wants to see the uploaded data.
    // if he does that a banner should show to re-enable.
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <View style={{flex:1}}/>
        <Text style={styles.header}>{ lang("User_permission_required_") }</Text>
        <Text style={styles.boldExplanation}>{ lang("If_youd_like_us_to_store_y") }</Text>
        <TouchableOpacity onPress={async () => {
          Linking.openURL('https://crownstone.rocks/data-privacy-users/');
        }}>
          <Text style={{...styles.boldExplanation, textDecorationLine:'underline'}}>{ lang("You_can_read_about_the_way") }</Text>
        </TouchableOpacity>
        <Text style={styles.explanation}>{ lang("Once_enabled__it_becomes_p") }</Text>
        <Text style={styles.explanation}>{ lang("You_can_revoke_permission") }</Text>
        <View style={{flex:1}}/>
        <Button backgroundColor={colors.green.rgba(0.8)} width={0.8*screenWidth} fontColor={colors.black.hex} hideIcon label={ "Give permission" } callback={async () => {
          try {
            core.eventBus.emit("showLoading", "Requesting permission...");
            await CLOUD.forSphere(props.sphereId).setEnergyUploadPermission(true)
            props.setHasUploadPermission(true);
            core.store.dispatch({
              type: "ADD_SPHERE_FEATURE",
              sphereId: props.sphereId,
              featureId: "ENERGY_COLLECTION_PERMISSION",
              data: {enabled: true}
            });
            core.eventBus.emit("hideLoading");
          }
          catch (err) {
            core.eventBus.emit("hideLoading");
            Alert.alert(
lang("_Could_not_set_permission_header"),
lang("_Could_not_set_permission_body"),
[{text:lang("_Could_not_set_permission_left")}]);
          }
        }}/>
        <View style={{flex:1}}/>
      </View>
    );
  }

  return <HistoricalEnergyUsage sphereId={props.sphereId} mode={props.mode} />;
}
