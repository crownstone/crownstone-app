
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationDetail", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
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
  let location = Get.location(props.sphereId, props.locationId);

  let fingerprintIds = Object.keys(location.fingerprints.raw);
  fingerprintIds.sort((a,b) => { return location.fingerprints.raw[a].updatedAt - location.fingerprints.raw[b].updatedAt });

  items.push({type:"explanation", label: lang("TAP_TO_DELETE")})
  for (let fingerprintId of fingerprintIds) {
    let fp = location.fingerprints.raw[fingerprintId];
    let score = FingerprintUtil.calculateFingerprintScore(props.sphereId, props.locationId, fingerprintId);
    items.push({
      type:  'button',
      label: `${xUtil.getDateTimeFormat(fp.updatedAt)} - ${fp.type}\n${fp.data.length} samples - ${score}%`,
      numberOfLines:2,
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


LocalizationFingerprintManager.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);

  return TopBarUtil.getOptions({ title: lang("Unknown_room",location.config.name), closeModal:true });
}



