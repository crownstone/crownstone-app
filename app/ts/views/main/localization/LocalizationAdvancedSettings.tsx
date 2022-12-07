
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationAdvancedSettings", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Text, View, Alert, Linking } from "react-native";


import { colors, topBarHeight } from "../../styles";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { SettingsBackground } from "../../components/SettingsBackground";
import { ListEditableItems } from "../../components/ListEditableItems";
import { core } from "../../../Core";
import {SettingsScrollView} from "../../components/SettingsScrollView";
import {FingerprintUtil} from "../../../util/FingerprintUtil";


function getLabel(value: LocalizationSmoothingMethod, allValues: {label:string, value: LocalizationSmoothingMethod}[]) : string {
  for (let val of allValues) {
    if (val.value === value) {
      return val.label;
    }
  }
  return "unknown";
}

export function LocalizationAdvancedSettings(props) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeLocalizationAppSettings']);

  let state = core.store.getState();

  let items = [];
  items.push({label: "SMOOTHING (REACTION SPEED VS STABILITY)",  type:'explanation'});
  let values : {label:string, value: LocalizationSmoothingMethod}[] = [
    {label: "None",            value: 'NONE'},
    {label: "Last 2 seconds",  value: 'SEQUENTIAL_2'},
    {label: "Last 5 seconds",  value: 'BEST_OUT_OF_5'},
    {label: "Last 10 seconds", value: 'BEST_OUT_OF_10'},
  ];

  items.push({
    type: 'popup',
    label: "Smoothing method",
    valueRight: true,
    buttons: true,
    valueStyle: {color: colors.darkGray2.hex, textAlign: 'right', fontSize: 15},
    value: state.app.localization_temporalSmoothingMethod,
    valueLabel: getLabel(state.app.localization_temporalSmoothingMethod, values),
    items: values,
    callback: (newValue) => {
      core.store.dispatch({type: "UPDATE_APP_LOCALIZATION_SETTINGS", data: { localization_temporalSmoothingMethod: newValue }})
    }
  })
  items.push({label: "If the localization is erratic, first try to improve the training data via the 'Localization has made a mistake' or 'Find and fix difficult spots'.\n\nIf that is not enough, you can use smoothing. Increased smoothing will take longer to respond to changes in your position.",  type:'explanation', below: true});


  items.push( {
    type:  'button',
    label: "Delete all phone optimizations",
    numberOfLines:2,
    callback: () => {
      Alert.alert(
        "Are you sure?",
        "You'll have to perform the optimizations again.",
        [{text: lang("Cancel"), style: 'cancel'}, {text: lang("Delete"), style:'destructive', onPress: () => {
            core.store.dispatch({type: "REMOVE_ALL_TRANSFORMS"});
          }}], {cancelable: false});
     }
  });
  items.push({label: "You can delete your phone optimizations if you'd like to try them again. This requires other users in your Sphere to help you.",  type:'explanation', below: true});

  items.push({label: "LAST RESORT",  type:'explanation'});
  items.push( {
    type:  'button',
    label: "Delete all localization datasets",
    numberOfLines:2,
    callback: () => {
      Alert.alert(
        "Are you sure?",
        "Everyone will have to perform the training again. This will not affect people who have phone exclusivity enabled.",
        [{text: lang("Cancel"), style: 'cancel'}, {text: lang("Delete"), style:'destructive', onPress: () => {
            FingerprintUtil.deleteAllFingerprints();
          }}], {cancelable: false});
    }
  });
  items.push({label: "You can delete your phone optimizations if you'd like to try them again. This requires other users in your Sphere to help you.",  type:'explanation', below: true});


  items.push({
    type: 'switch',
    label: "Phone exclusivity",
    value: state.app.localization_onlyOwnFingerprints,
    callback: (newValue) => {
      core.store.dispatch({type: "UPDATE_APP_LOCALIZATION_SETTINGS", data: { localization_onlyOwnFingerprints: newValue }})
    }
  })
  items.push({label: "If your localization suffers regardless of all other methods, you can enable phone exclusivity to ensure your phone only uses datasets collected by you, on your phone.\n\nYou may have to re-train your rooms.",  type:'explanation', below: true});




  return (
    <SettingsBackground>
      <SettingsScrollView>
        <ListEditableItems items={items} />
      </SettingsScrollView>
    </SettingsBackground>
  );
}

LocalizationAdvancedSettings.options = TopBarUtil.getOptions({ title: lang("Advanced_Settings")});

