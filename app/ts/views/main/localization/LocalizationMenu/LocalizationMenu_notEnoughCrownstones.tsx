import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";
import { Background } from "../../../components/Background";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { getLearnAboutLocalizationItems } from "./LocalizationMenu_shared";
import { SettingsBackground } from "../../../components/SettingsBackground";


export function LocalizationMenu_notEnoughCrownstones(props) {
  let items = [];
  getLearnAboutLocalizationItems(items)
  return (
    <SettingsBackground testID={"LocalizationMenu_notEnoughCrownstones"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ListEditableItems items={items} />
      </ScrollView>
    </SettingsBackground>
  );
}

