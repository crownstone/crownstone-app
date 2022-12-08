
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationFindAndFix_noLocation", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Platform, Vibration, Text, View, TextStyle, ActivityIndicator, Alert } from "react-native";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import KeepAwake from 'react-native-keep-awake';
import {Bluenet} from "../../../native/libInterface/Bluenet";
import {Button} from "../../components/Button";
import {SlideInViewLayoutAnimation} from "../../components/animated/SlideInViewLayoutAnimation";
import {core} from "../../../Core";
import { FingerprintCollectorLive } from "../../../localization/fingerprints/FingerprintCollectorLive";
import { Blur } from "../../components/Blur";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { SettingsBackground } from "../../components/SettingsBackground";
import { NavigationBar } from "../../components/editComponents/NavigationBar";
import { OverlayUtil } from "../../../util/OverlayUtil";
import { Spacer } from "../../components/Spacer";
import { LocalizationMonitor } from "../../../localization/LocalizationMonitor";
import { FingerprintAppender } from "../../../localization/fingerprints/FingerprintAppender";




export function LocalizationFindAndFix_noLocation(props: { sphereId: sphereId }) {
  bindTopbarButtons(props);
  let [locationId, setLocationId] = React.useState(null);

  let location = Get.location(props.sphereId, locationId);
  return (
    <SettingsBackground>
      <View style={{height:topBarHeight}}/>
      <View style={{height:30}}/>
      <Text style={styles.header}>{ lang("Lets_go_searching_") }</Text>
      <Text style={styles.boldExplanation}>{ lang("We_need_to_know_which_roo") }</Text>
      <Text style={styles.explanation}>{ lang("Where_are_you_now_") }</Text>

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
            label={ " Let's go! "}
            callback={() => {
              Alert.alert(
lang("_Youre_in_____arguments___header",location.config.name),
lang("_Youre_in_____arguments___body"),
[{text:lang("_Youre_in_____arguments___left"), style: "destructive", onPress: () => { handleConfirm(props.sphereId, locationId); }},
                  {
                    
text:lang("_Youre_in_____arguments___right"), style: "destructive", onPress: () => {}} ],
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
  NavigationUtil.launchModal("LocalizationFindAndFix", {sphereId: sphereId, locationId: locationId});
}


LocalizationFindAndFix_noLocation.options = TopBarUtil.getOptions({ title: lang("Seach_for_weaknesses")});
