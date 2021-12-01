import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_NoBehavioursYet", key)(a,b,c,d,e);
}

import * as React from 'react';
import { DeviceSmartBehaviour_TypeSelector } from "./DeviceSmartBehaviour_TypeSelector";
import { core } from "../../../Core";
import { Background } from "../../components/Background";
import { Alert, ScrollView, Text, View } from "react-native";
import {
  availableModalHeight, background,
  colors,
  deviceStyles,
  screenWidth, styles
} from "../../styles";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { ScaledImage } from "../../components/ScaledImage";
import { Permissions } from "../../../backgroundProcesses/PermissionManager";
import { xUtil } from "../../../util/StandAloneUtil";
import { Button } from "../../components/Button";
import { BehaviourCopyFromButton } from "./buttons/Behaviour_CopyFromButton";
import { BehaviourSyncButton } from "./buttons/Behaviour_SyncButton";


let className = "DeviceSmartBehaviour";

export function NoBehavioursYet(props) {
  let state = core.store.getState();
  let sphere = state.spheres[props.sphereId];
  if (!sphere) return <View />;
  let stone = sphere.stones[props.stoneId];
  if (!stone) return <View />;

  let updateRequired = !xUtil.versions.canIUse(stone.config.firmwareVersion, '4.0.0')

  return (
    <Background image={background.lightBlurLighter} hasNavBar={false}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
        <View style={{ flexGrow: 1, alignItems:'center', paddingTop:30 }}>
          <Text style={{...deviceStyles.header, width: 0.7*screenWidth}} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ lang("What_is_Behaviour_") }</Text>
          <View style={{height: 40}} />
          <View style={{flexDirection:'row', width: screenWidth, alignItems:'center', justifyContent: 'space-evenly'}}>
            <ScaledImage source={require('../../../../assets/images/overlayCircles/dimmingCircleGreen.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.27*screenWidth} />
            <ScaledImage source={require('../../../../assets/images/overlayCircles/roomsCircle.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.27*screenWidth} />
            <ScaledImage source={require('../../../../assets/images/overlayCircles/time.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.27*screenWidth} />
          </View>
          <View style={{height: 40}} />
          <Text style={styles.boldExplanation}>{ lang("My_behaviour_is_a_combina") }</Text>
          <Text style={styles.explanation}>{ lang("I_can_take_multiple_peopl") }</Text>
          <Text style={styles.explanation}>{ lang("Tap_the_Add_button_below_") }</Text>
          <View style={{flex:1, minHeight: 40}} />
          { updateRequired && <Button
            backgroundColor={colors.green.rgba(0.9)}
            label={ "Update to use behaviour!"}
            callback={() => {
              if (Permissions.inSphere(props.sphereId).canChangeBehaviours === false) {
                Alert.alert(
                  lang("_You_dont_have_permission_t_header"),
                  lang("_You_dont_have_permission_t_body"),
                  [{text:lang("_You_dont_have_permission_t_left")}]);
                return
              }

              NavigationUtil.launchModal( "DfuIntroduction", {sphereId: props.sphereId}); }}
          /> }

          { !updateRequired && <Button
            backgroundColor={colors.green.rgba(0.9)}
            label={ lang("Add_my_first_behaviour_")}
            callback={() => {
              if (Permissions.inSphere(props.sphereId).canChangeBehaviours === false) {
                Alert.alert(
                  lang("_You_dont_have_permission_t_header"),
                  lang("_You_dont_have_permission_t_body"),
                  [{text:lang("_You_dont_have_permission_t_left")}]);
                return
              }

              NavigationUtil.launchModal('DeviceSmartBehaviour_TypeSelector', {
                sphereId: props.sphereId,
                stoneId: props.stoneId
              });
            }}
          />
          }
          { !updateRequired && <BehaviourCopyFromButton sphereId={props.sphereId} stoneId={props.stoneId} behavioursAvailable={false}/> }
          { state.development.show_sync_button_in_behaviour && <BehaviourSyncButton sphereId={props.sphereId} stoneId={props.stoneId} /> }
          <View style={{height:30}} />
        </View>
      </ScrollView>
    </Background>
  )
}