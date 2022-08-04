import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";
import { Background } from "../../../components/Background";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { getLearnAboutLocalizationItems, openLocalizationHelpWebsite } from "./LocalizationMenu_shared";
import { SettingsBackground } from "../../../components/SettingsBackground";
import { colors, screenHeight, screenWidth, styles } from "../../../styles";
import { ScaledImage } from "../../../components/ScaledImage";
import { Languages } from "../../../../Languages";
import { Icon } from "../../../components/Icon";


export function LocalizationMenu_notEnoughCrownstones(props) {
  let items = [];
  items.push({
    label: "Buy Crownstones!",
    type: 'navigation',
    numberOfLines: 3,
    testID: 'ImproveLocalization',
    icon: <Icon name='fa5-shopping-cart' size={25} color={colors.green.hex}/>,
    callback: () => {
      Linking.openURL(Languages.activeLocale === 'nl_nl' ? 'https://shop.crownstone.rocks/?launch=nl&ref=app/addCrownstone' : 'https://shop.crownstone.rocks/?launch=en&ref=app/addCrownstone').catch(err => {})
    }
  });
  items.push({type:'spacer'});
  getLearnAboutLocalizationItems(items)

  return (
    <SettingsBackground testID={"LocalizationMenu_notEnoughCrownstones"}>
      <ScrollView>
        <View style={{height:20}}/>
        <Text style={styles.header}>{"To use indoor localization, have to have at least 4 Crownstones..."}</Text>
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

