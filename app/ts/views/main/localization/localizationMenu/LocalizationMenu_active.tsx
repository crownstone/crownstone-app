
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu_active", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";
import { Icon } from "../../../components/Icon";
import { colors, menuStyles, screenWidth } from "../../../styles";
import { NavigationUtil } from "../../../../util/navigation/NavigationUtil";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";
import { Get } from "../../../../util/GetUtil";
import { FingerprintUtil } from "../../../../util/FingerprintUtil";
import { LocalizationUtil } from "../../../../util/LocalizationUtil";
import { SettingsScrollView } from "../../../components/SettingsScrollView";



export function LocalizationMenu_active(props) {
  let items = [];
  let secondItems = [];

  let locationsAttention = LocalizationUtil.getLocationsInNeedOfAttention(props.sphereId);
  let warning = false;
  if (locationsAttention.length > 0) {
    warning = true;
    items.push({label: lang("THESE_ROOMS_NEED_ATTENTIO"),  type:'explanation'});
  }
  else {
    items.push({label: lang("LOCALIZATION_TRAINING_QUA"),  type:'explanation'});
  }

  items.push({
    label: "Room training quality",
    type: 'navigation',
    numberOfLines: 1,
    warning: warning,
    testID: 'RoomTrainingQuality',
    icon: <Icon name='ma-stars' size={28} color={warning ? colors.red.hex : colors.csBlue.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationRoomQuality', {sphereId: props.sphereId});
    }
  });
  items.push({label: "See how well the rooms are trained and what you can do to improve the localization.",  type:'explanation', below: true});

  items.push({label: lang("CHANGES_AND_QUICKFIX"),  type:'explanation', alreadyPadded: true});
  items.push({
    label: lang("I_have_moved_a_Crownstone"),
    type: 'navigation',
    numberOfLines: 2,
    testID: 'LocalizationMistake',
    icon: <Icon name='ion5-move' size={28} color={colors.csBlueLight.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationCrownstoneMoved', {sphereId: props.sphereId});
    }
  });

  items.push({
    label: lang("Improve_from_localization"),
    type: 'navigation',
    numberOfLines: 2,
    testID: 'LocalizationMistake',
    icon: <Icon name='ion5-bandage-outline' size={28} color={colors.csBlueLighter.hex}/>,
    callback: () => {
      if (warning) {
        Alert.alert("Please fix the localization issues first.", "Tap the room training quality item above..",[{text:"OK"}]);
      }
      else {
        NavigationUtil.navigate('LocalizationQuickFix', {sphereId: props.sphereId});
      }
    }
  });
  items.push({label: lang("If_the_localization_was_w"),  type:'explanation', below: true});

  items.push({
    label: 'Find and fix difficult spots...',
    type: 'navigation',
    numberOfLines: 2,
    testID: 'FindAndFix',
    icon: <Icon name='ma-saved-search' size={28} color={colors.csBlueLight.hex}/>,
    callback: () => {
      if (warning) {
        Alert.alert("Please fix the localization issues first.", "Tap the room training quality item above..",[{text:"OK"}]);
      }
      else {
        NavigationUtil.navigate('LocalizationFindAndFix_noLocation', {sphereId: props.sphereId});
      }
    }
  });
  items.push({label: 'You can walk around the room to find weakspots in the localization and fix them immediately!',  type:'explanation', below: true});

  items.push({
    label: lang("Advanced_Settings"),
    type: 'navigation',
    numberOfLines: 1,
    testID: 'LocalizationAdvancedSettings',
    icon: <Icon name='ios-cog' size={28} color={colors.csBlue.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationAdvancedSettings', {sphereId: props.sphereId});
    }
  });
  items.push({label: lang('Look_here_to_configure_sm'),  type:'explanation', below: true});


  return (
    <SettingsBackground testID={"LocalizationMenu_active"}>
      <SettingsScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom:30 }}>
        <ListEditableItems items={items} />
      </SettingsScrollView>
    </SettingsBackground>
  );
}
