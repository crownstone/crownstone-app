
import { Languages } from "../../../../Languages"

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





export function LocalizationMenu_notInSphere(props) {
  let items = [];
  items.push({
    type:"info",
    numberOfLines:2,
    style: {color: colors.black.rgba(0.3)},
    label:"You have to be in the sphere to continue..."
  });
  items.push({type:'spacer'});
  getLearnAboutLocalizationItems(items)

  return (
    <SettingsBackground testID={"LocalizationMenu_notInSphere"}>
      <ScrollView>
        <View style={{height:20}}/>
        <Text style={styles.header}>{"To use indoor localization, you have to be in the sphere..."}</Text>
        <View style={{height:30}}/>
        <View style={styles.centered}>
          <ScaledImage source={require("../../../../../assets/images/map_house_4_crownstones.png")} sourceWidth={1193} sourceHeight={842} targetWidth={screenWidth*0.9} />
        </View>
        <View style={{height:30}}/>
        <ListEditableItems items={items} />
      </ScrollView>
    </SettingsBackground>
  );
}


