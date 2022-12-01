
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationFingerprintManager", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert, Platform,
  ScrollView,
  Text,
  View
} from "react-native";


import { colors, deviceStyles, background, topBarHeight, styles, screenHeight, screenWidth } from "../../styles";
import {Background} from "../../components/Background";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { ListEditableItems } from "../../components/ListEditableItems";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { Get } from "../../../util/GetUtil";
import {FingerprintUtil, PenaltyList} from "../../../util/FingerprintUtil";
import {xUtil} from "../../../util/StandAloneUtil";
import {core} from "../../../Core";


export function LocalizationFingerprintManager(props: {sphereId: string, locationId: string}) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeFingerprint','changeSphereState']);

  let items = [];
  let sphere = Get.sphere(props.sphereId);
  let location = Get.location(props.sphereId, props.locationId);

  let fingerprintIds = Object.keys(location.fingerprints.raw);
  fingerprintIds.sort((a,b) => { return location.fingerprints.raw[a].updatedAt - location.fingerprints.raw[b].updatedAt });

  items.push({type:"explanation", label: lang("TAP_TO_DELETE")})


  for (let fingerprintId of fingerprintIds) {
    let fp = location.fingerprints.raw[fingerprintId];
    let score = FingerprintUtil.calculateFingerprintScore(props.sphereId, props.locationId, fingerprintId);
    let typeArray = (fp.createdOnDeviceType ?? "x_x_x").split("_");
    let fingerprintDeviceIdentifier = Platform.OS === 'ios' ? typeArray[0] : typeArray[2];

    items.push({
      type:  'button',
      barHeight: 120,
      label: `${mapFingerprintTypeToHumanReadable(fp.type)}: ${fp.data.length} point${fp.data.length > 1 ? "s" : ''}`+
        `\nCollected at: ${xUtil.getDateTimeFormat(fp.updatedAt)}` +
        (fp.createdByUser       ? `\nCollected by: ${sphere.users[fp.createdByUser]?.firstName + ' ' + sphere.users[fp.createdByUser]?.lastName}` : `\nCollected by: migration`) +
        (fp.createdOnDeviceType ? `\nCollected on: ${fingerprintDeviceIdentifier}` : `\nCollected on: unknown device`) +
        `\nScore: ${score}`,
      numberOfLines:5,
      callback: () => {
        Alert.alert(
          lang("_Are_you_sure___This_cann_header"),
          lang("_Are_you_sure___This_cann_body"),
          [{text: lang("_Are_you_sure___This_cann_left"), style: 'cancel'},
            {
              text: lang("_Are_you_sure___This_cann_right"), style:'destructive', onPress: () => {
                core.store.dispatch({type: 'REMOVE_FINGERPRINT_V2', sphereId: props.sphereId, locationId: props.locationId, fingerprintId: fingerprintId});
              }},
          ],
          {cancelable: false}
        );
      }
    });
  }

  if (fingerprintIds.length === 0) {
    items.push({type:"info", label: lang("No_fingerprints_")})
  }

  return (
    <Background>
      <View style={{height:topBarHeight}}/>
      <ScrollView>
        <View style={{height:15}} />
        <Text style={styles.header}>{ lang("Active_fingerprints") }</Text>
        <View style={{height:15}} />
        <ListEditableItems items={items}/>
        <View style={{height:25}} />
      </ScrollView>
    </Background>
  );
}

function mapFingerprintTypeToHumanReadable(type : FingerprintType) {
  switch (type) {
    case "IN_HAND":
      return lang("IN_HAND");
    case "IN_POCKET":
      return lang("IN_POCKET");
    case "AUTO_COLLECTED":
      return lang("AUTO_COLLECTED");
    case "FIND_AND_FIX":
      return lang("FIND_AND_FIX");
  }
}


LocalizationFingerprintManager.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);

  return TopBarUtil.getOptions({ title: lang("Unknown_room",location.config.name), closeModal:true });
}



