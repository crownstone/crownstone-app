
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationCrownstoneMoved", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text,
  View,
} from "react-native";


import { colors, topBarHeight, styles, screenHeight, screenWidth } from "../../styles";
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
import { LocalizationCore } from "../../../localization/LocalizationCore";
import { SettingsBackground } from "../../components/SettingsBackground";



export function LocalizationCrownstoneMoved(props) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeStones']);
  let [selectedStoneId, setSelectedStoneId] = React.useState(null);


  let stoneName = null;
  if (selectedStoneId) {
    let stone = Get.stone(props.sphereId, selectedStoneId);
    if (stone) {
      let location = Get.location(props.sphereId, stone.config.locationId);
      stoneName = `${stone.config.name} in ${location.config.name}`;
    }

  }

  return (
    <SettingsBackground>
      <View style={{height:topBarHeight}}/>
      <View style={{height:30}}/>
      <Text style={styles.header}>{ lang("A_Crownstone_has_been_mov") }</Text>
      <Text style={styles.boldExplanation}>{ lang("We_can_update_the_rooms_t") }</Text>
      <Text style={styles.explanation}>{ lang("If_we_do_not_do_this__the") }</Text>
      <View style={{height:30}}/>

      <NavigationBar
        label={ stoneName === null ? 'Which Crownstone was moved?' : stoneName }
        callback={() => {
          OverlayUtil.callCrownstoneSelectionOverlay(
            props.sphereId,
            (stoneId) => {
              setSelectedStoneId(stoneId);
            },
          );
        }}
      />

      <Spacer />
      <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
        { stoneName === null ?
            <Text style={{...styles.boldExplanation, color: colors.black.rgba(0.3), fontStyle:'italic'}}>{ lang("Please_pick_a_Crownstone_") }</Text>
          :
            <Button
              backgroundColor={colors.csBlue.hex}
              icon={'c1-locationPin1'}
              iconSize={11}
              label={ " Update rooms! "}
              callback={() => {
                LocalizationCore.crownstoneWasMoved(props.sphereId, selectedStoneId);
                NavigationUtil.back();
              }}
            />
        }
      </View>
    </SettingsBackground>
  );
}


LocalizationCrownstoneMoved.options = TopBarUtil.getOptions({ title: lang("Quickfix")});

