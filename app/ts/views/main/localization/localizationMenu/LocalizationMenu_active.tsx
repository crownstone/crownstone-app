
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu_active", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Alert } from "react-native";
import { Icon } from "../../../components/Icon";
import { colors } from "../../../styles";
import { NavigationUtil } from "../../../../util/navigation/NavigationUtil";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";
import { FingerprintUtil } from "../../../../util/FingerprintUtil";
import { LocalizationUtil } from "../../../../util/LocalizationUtil";
import { SettingsScrollView } from "../../../components/SettingsScrollView";



export function LocalizationMenu_active(props) {
  let items = [];

  let locationsAttention = LocalizationUtil.getLocationsInNeedOfAttention(props.sphereId);
  let roomWarning = false;
  if (locationsAttention.length > 0) {
    roomWarning = true;
  }

  let transformsRequired = FingerprintUtil.transformsRequired(props.sphereId);
  if (transformsRequired && !roomWarning) {
    items.push({label: lang("PHONE_OPTIMIZATION"),  type:'explanation'});
    items.push({
      label: lang("Phone_optimization_requir"),
      type: 'navigation',
      warning: true,
      numberOfLines: 1,
      testID: 'optimization',
      icon: <Icon name='fa-mobile-phone' size={28} color={colors.red.hex}/>,
      callback: () => {
        let options = FingerprintUtil.getOptimizationOptions(props.sphereId);
        if (options.length === 1) {
          NavigationUtil.navigate('LocalizationTransform_intro', { sphereId: props.sphereId, ...options[0] });
        }
        else {
          NavigationUtil.navigate('LocalizationTransform_userSelect', { sphereId: props.sphereId, options: options });
        }
      }
    });
    items.push({label: lang("Other_phone_s__have_colle"),  type:'explanation', below: true});
  }


  if (locationsAttention.length > 0) {
    roomWarning = true;
    items.push({label: lang("THESE_ROOMS_NEED_ATTENTIO"),  type:'explanation'});
  }
  else {
    items.push({label: lang("LOCALIZATION_TRAINING_QUA"),  type:'explanation'});
  }

  items.push({
    label: lang("Room_training_quality"),
    type: 'navigation',
    numberOfLines: 1,
    warning: roomWarning,
    testID: 'RoomTrainingQuality',
    icon: <Icon name='ma-stars' size={28} color={roomWarning ? colors.red.hex : colors.csBlue.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationRoomQuality', {sphereId: props.sphereId});
    }
  });
  items.push({label: lang("See_how_well_the_rooms_ar"),  type:'explanation', below: true});

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
      if (roomWarning) {
        Alert.alert(
          lang("_Please_fix_the_localizat_header"),
          lang("_Please_fix_the_localizat_body"),
          [{text:lang("_Please_fix_the_localizat_left")}]);
      }
      else {
        NavigationUtil.navigate('LocalizationQuickFix', {sphereId: props.sphereId});
      }
    }
  });
  items.push({label: lang("If_the_localization_was_w"),  type:'explanation', below: true});

  items.push({
    label: lang("Find_and_fix_difficult_sp"),
    type: 'navigation',
    numberOfLines: 2,
    testID: 'FindAndFix',
    icon: <Icon name='ma-saved-search' size={28} color={colors.csBlueLight.hex}/>,
    callback: () => {
      if (roomWarning) {
        Alert.alert(
          lang("_Please_fix_the_localizati_header"),
          lang("_Please_fix_the_localizati_body"),
          [{text:lang("_Please_fix_the_localizati_left")}]);
      }
      else {
        NavigationUtil.navigate('LocalizationFindAndFix_noLocation', {sphereId: props.sphereId});
      }
    }
  });
  items.push({label: lang("You_can_walk_around_the_r"),  type:'explanation', below: true});

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
