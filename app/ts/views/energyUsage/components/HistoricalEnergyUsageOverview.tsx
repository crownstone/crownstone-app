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
        <Text style={{fontSize: 20, color: colors.black.hex, fontWeight:'bold'}}>{ 'Checking permission...' }</Text>
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
        <Text style={styles.header}>{ 'User permission required.' }</Text>
        <Text style={styles.boldExplanation}>{ "If you'd like us to store your energy usage in the cloud, a sphere admin has to give permission." }</Text>
        <TouchableOpacity onPress={async () => {
          Linking.openURL('https://crownstone.rocks/data-privacy-users/');
        }}>
          <Text style={{...styles.boldExplanation, textDecorationLine:'underline'}}>{ "You can read about the way we store the data here." }</Text>
        </TouchableOpacity>
        <Text style={styles.explanation}>{ "Once enabled, it becomes possible for hubs like Home Assistant to gather Crownstone power measurements and send them to our cloud to show to you here." }</Text>
        <Text style={styles.explanation}>{ "The permission can be revoked in the app settings." }</Text>
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
        <Text style={styles.header}>{ 'User permission required.' }</Text>
        <Text style={styles.boldExplanation}>{ "If you'd like us to store your energy usage in the cloud, please provide permission by tapping the button below." }</Text>
        <TouchableOpacity onPress={async () => {
          Linking.openURL('https://crownstone.rocks/data-privacy-users/');
        }}>
          <Text style={{...styles.boldExplanation, textDecorationLine:'underline'}}>{ "You can read about the way we store the data here." }</Text>
        </TouchableOpacity>
        <Text style={styles.explanation}>{ "Once enabled, it becomes possible for hubs like Home Assistant to gather Crownstone power measurements and send them to our cloud to show to you here." }</Text>
        <Text style={styles.explanation}>{ "You can revoke permission in the app settings." }</Text>
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
            Alert.alert("Could not set permission...", "Something went wrong while trying to give permission. Please try again later.", [{text:'OK'}]);
          }
        }}/>
        <View style={{flex:1}}/>
      </View>
    );
  }

  return <HistoricalEnergyUsage sphereId={props.sphereId} mode={props.mode} />;
}
