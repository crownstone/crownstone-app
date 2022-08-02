
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



export function LocalizationQuickFix(props: { sphereId: sphereId }) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeFingerprint','changeSphereState']);
  let [locationId, setLocationId] = React.useState(null);

  let location = Get.location(props.sphereId, locationId);
  return (
    <Background>
      <View style={{height:topBarHeight}}/>
      <View style={{height:30}}/>
      <Text style={styles.header}>{"Localization made a mistake.."}</Text>
      <Text style={styles.boldExplanation}>{"Let's learn from that mistake!"}</Text>
      <Text style={styles.explanation}>{"Which room where you in for the last 3 minutes?"}</Text>

      <NavigationBar
        label={ locationId === null ? "Pick location" : location.config.name }
        callback={() => {
          OverlayUtil.callRoomSelectionOverlay(
            props.sphereId,
            (locationId) => { setLocationId(locationId); }
          );
        }}
      />

      <Text style={styles.explanation}>{"It is important that you really were in that room in all of the last 3 minutes!"}</Text>
      <Spacer />
      <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
        { locationId === null ?
            <Text style={{...styles.boldExplanation, color: colors.black.rgba(0.3), fontStyle:'italic'}}>{"Please pick a location first."}</Text>
          :
            <Button
              backgroundColor={colors.csBlue.hex}
              icon={'c1-locationPin1'}
              iconSize={11}
              label={ " Fix mistake! "}
              callback={() => {
                Alert.alert(
                "You were in the " + location.config.name + " for the last 3 minutes?",
                "This is important.",
                [{text:"Yes", style: "destructive", onPress: () => { handleConfirm(props.sphereId, locationId); }},
                         {text:"I'm not sure..", style:'cancel', onPress: handleCancel} ],
                {cancelable:false}
                );
              }}
            />
        }
      </View>
    </Background>
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
      "Localization has been improved!",
      "Added " + amountOfNewDatapoints + " new datapoints!",
      [{
        text: "Great!",  onPress: () => { NavigationUtil.dismissModal(); }}],
      { cancelable: false }
    );
  }
  else {
    Alert.alert(
      "No need to improve!",
      "Localization already placed you in that room for the last 3 minutes!",
      [{
        text: "Great!", onPress: () => { NavigationUtil.dismissModal(); }}],
      { cancelable: false }
    );
  }
}

function handleCancel() {
  Alert.alert(
    "Better safe than sorry!",
    "Stay in the room a little longer and try again after 3 minutes",
    [{text:"OK", onPress: () => { NavigationUtil.dismissModal() }}],
    {cancelable:false}
  );
}

LocalizationQuickFix.options = TopBarUtil.getOptions({ title: "Quickfix" });

