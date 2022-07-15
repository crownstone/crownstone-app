
import { Languages } from "../../../../Languages"

import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";
import { colors, topBarHeight } from "../../../styles";
import { getLearnAboutLocalizationItems } from "./LocalizationMenu_shared";
import { Background } from "../../../components/Background";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";





export function LocalizationMenu_notInSphere(props) {
  let items = [];
  items.push({
    type:"info",
    numberOfLines:2,
    style: {color: colors.black.rgba(0.3)},
    label:"You have to be in the sphere to continue..."
  });
  items.push({type:'spacer'});
  items.push({
    type:"info",
    numberOfLines:2,
    style: {color: colors.black.rgba(0.3)},
    label:"TODO: make prettier, check if localization is prepared or getting started"
  });
  items.push({type:'spacer'});
  getLearnAboutLocalizationItems(items)

  return (
    <SettingsBackground testID={"LocalizationMenu_notInSphere"}>
      <View style={{ flex: 1, paddingTop: topBarHeight  }}>
        <ListEditableItems items={items} />
      </View>
    </SettingsBackground>
  );
}


