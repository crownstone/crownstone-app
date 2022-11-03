
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu_notInSphere", key)(a,b,c,d,e);
}

import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../../styles";
import { getLearnAboutLocalizationItems } from "./LocalizationMenu_shared";
import { Background } from "../../../components/Background";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";
import { ScaledImage } from "../../../components/ScaledImage";
import { SettingsScrollbar } from "../../../components/SettingsScrollbar";





export function LocalizationMenu_notInSphere(props) {
  let items = [];
  items.push({
    type:"info",
    numberOfLines:2,
    style: {color: colors.black.rgba(0.3)},
    label: lang("You_have_to_be_in_the_sph")});
  items.push({type:'spacer'});
  getLearnAboutLocalizationItems(items)

  return (
    <SettingsBackground testID={"LocalizationMenu_notInSphere"}>
      <SettingsScrollbar>
        <View style={{height:20}}/>
        <Text style={styles.header}>{ lang("To_use_indoor_localizatio") }</Text>
        <View style={{height:30}}/>
        <View style={styles.centered}>
          <ScaledImage source={require("../../../../../assets/images/map_house_4_crownstones.png")} sourceWidth={1193} sourceHeight={842} targetWidth={screenWidth*0.9} />
        </View>
        <View style={{height:30}}/>
        <ListEditableItems items={items} />
      </SettingsScrollbar>
    </SettingsBackground>
  );
}


