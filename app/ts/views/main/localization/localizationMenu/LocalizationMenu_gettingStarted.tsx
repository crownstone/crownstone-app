
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu_gettingStarted", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";
import { DataUtil } from "../../../../util/DataUtil";
import { Icon } from "../../../components/Icon";
import { NavigationUtil } from "../../../../util/navigation/NavigationUtil";
import { colors } from "../../../styles";
import { getLearnAboutLocalizationItems } from "./LocalizationMenu_shared";
import { Background } from "../../../components/Background";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";




export function LocalizationMenu_gettingStarted(props) {
  let items = [];
  let disabled = false;
  let label = "By teaching the localization where all your rooms are, you can use your location for behaviour!"
  if (!DataUtil.inSphere(props.sphereId)) {
    disabled = true;
    label = "You have to be in the sphere to setup indoor localization...";
  }

  items.push({label: lang("LETS_GET_STARTED"),  type:'explanation'});
  items.push({
    label: lang("Setup_localization_"),
    type: 'navigation',
    disabled: disabled,
    testID: 'setupLocalization',
    icon: <Icon name='c1-locationPin1' size={24} color={colors.green.hex}/>,
    callback: () => {
      NavigationUtil.navigate( "SetupLocalization", {sphereId: props.sphereId});
    }
  });
  items.push({label: label,  type:'explanation', below: true});
  items.push({type:'spacer'});

  getLearnAboutLocalizationItems(items);

  return (
    <SettingsBackground testID={"LocalizationMenu_gettingStarted"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ListEditableItems items={items} />
      </ScrollView>
    </SettingsBackground>
  );
}



