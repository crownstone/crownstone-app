
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";


import { colors, deviceStyles, background, topBarHeight, styles, screenHeight, screenWidth } from "../../styles";
import {Background} from "../../components/Background";
import {IconButton} from "../../components/IconButton";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { ListEditableItems } from "../../components/ListEditableItems";
import {
  DataUtil,
  enoughCrownstonesForIndoorLocalization
} from "../../../util/DataUtil";
import {Icon} from "../../components/Icon";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import {FingerprintUtil} from "../../../util/FingerprintUtil";
import { Button } from "../../components/Button";
import { Dropdown } from "../../components/editComponents/Dropdown";
import { OptionalSwitchBar } from "../../components/editComponents/OptionalSwitchBar";
import { PopupBar } from "../../components/editComponents/PopupBar";
import { NavigationBar } from "../../components/editComponents/NavigationBar";
import { OverlayUtil } from "../../../util/OverlayUtil";
import { Spacer } from "../../components/Spacer";
import { Get } from "../../../util/GetUtil";



export function LocalizationQuickFix(props) {
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
            (locationId) => { setLocationId(locationId); },
            locationId)
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
                [{text:"Yes", style: "destructive", onPress: handleConfirm},
                         {text:"I'm not sure..", style:'cancel',


                           onPress: handleCancel} ],
                {cancelable:false}
                );
              }}
            />
        }
      </View>
    </Background>
  );
}

function handleConfirm() {
  NavigationUtil.dismissModal()
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

