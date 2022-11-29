
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationQuickFix", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text,
  View, Alert, Linking
} from "react-native";


import { colors, deviceStyles, background, topBarHeight, styles, screenHeight, screenWidth } from "../../styles";
import {Background} from "../../components/Background";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { Button } from "../../components/Button";
import { NavigationBar } from "../../components/editComponents/NavigationBar";
import { OverlayUtil } from "../../../util/OverlayUtil";
import { Spacer } from "../../components/Spacer";
import { Get } from "../../../util/GetUtil";
import { LocalizationMonitor } from "../../../localization/LocalizationMonitor";
import { FingerprintAppender } from "../../../localization/fingerprints/FingerprintAppender";
import { SettingsBackground } from "../../components/SettingsBackground";



export function LocalizationQuickFix(props: { sphereId: sphereId }) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeFingerprint','changeSphereState']);
  let [locationId, setLocationId] = React.useState(null);

  let location = Get.location(props.sphereId, locationId);
  return (
    <SettingsBackground>
      <View style={{height:topBarHeight}}/>
      <View style={{height:30}}/>
      <Text style={styles.header}>{ lang("Localization_made_a_mista") }</Text>
      <Text style={styles.boldExplanation}>{ lang("Lets_learn_from_that_mist") }</Text>
      <Text style={styles.explanation}>{ lang("Which_room_where_you_in_f") }</Text>

      <NavigationBar
        label={ locationId === null ? "Pick location" : location.config.name }
        callback={() => {
          OverlayUtil.callRoomSelectionOverlay(
            props.sphereId,
            (locationId) => { setLocationId(locationId); }
          );
        }}
      />

      <Text style={styles.explanation}>{ lang("It_is_important_that_you_") }</Text>
      <Spacer />
      <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
        { locationId === null ?
            <Text style={{...styles.boldExplanation, color: colors.black.rgba(0.3), fontStyle:'italic'}}>{ lang("Please_pick_a_location_fi") }</Text>
          :
            <Button
              backgroundColor={colors.csBlue.hex}
              icon={'c1-locationPin1'}
              iconSize={11}
              label={ " Fix mistake! "}
              callback={() => {
                Alert.alert(
                  lang("_You_were_in_the_____argu_header",location.config.name),
                  lang("_You_were_in_the_____argu_body"),
                  [{text:lang("_You_were_in_the_____argu_left"), style: "destructive", onPress: () => { handleConfirm(props.sphereId, locationId); }},
                         {
                        text:lang("_You_were_in_the_____argu_right"), style:'cancel', onPress: handleCancel} ],
                {cancelable:false}
                );
              }}
            />
        }
      </View>
    </SettingsBackground>
  );
}

function handleConfirm(sphereId, locationId) {
  let history = LocalizationMonitor.getHistory(Date.now() - 3 * 60 * 1000);
  let appender = new FingerprintAppender(sphereId, locationId, "AUTO_COLLECTED");

  let amountOfNewDatapoints = 0;

  appender.handleResult = (result) => {
    if (!result[sphereId]) { return; }

    if (result[sphereId] !== locationId) {
      appender.collectDatapoint();
      amountOfNewDatapoints++;
    }
  }

  appender.loadCollectedData(history);

  appender.store();

  if (amountOfNewDatapoints > 0) {
    Alert.alert(
lang("_Localization_has_been_im_header"),
lang("_Localization_has_been_im_body",amountOfNewDatapoints),
[{text: lang("_Localization_has_been_im_left"),  onPress: () => { NavigationUtil.dismissModal(); }}],
      { cancelable: false }
    );
  }
  else {
    Alert.alert(
lang("_No_need_to_improve___Loc_header"),
lang("_No_need_to_improve___Loc_body"),
[{text: lang("_No_need_to_improve___Loc_left"), onPress: () => { NavigationUtil.dismissModal(); }}],
      { cancelable: false }
    );
  }
}

function handleCancel() {
  Alert.alert(
lang("_Better_safe_than_sorry___header"),
lang("_Better_safe_than_sorry___body"),
[{text:lang("_Better_safe_than_sorry___left"), onPress: () => { NavigationUtil.dismissModal() }}],
    {cancelable:false}
  );
}

LocalizationQuickFix.options = TopBarUtil.getOptions({ title: lang("Quickfix")});

