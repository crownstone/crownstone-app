
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
import { Permissions } from "../../../backgroundProcesses/PermissionManager";

function getLabel(value: LocalizationSmoothingMethod, allValues: {label:string, value: LocalizationSmoothingMethod}[]) : string {
  for (let val of allValues) {
    if (val.value === value) {
      return val.label;
    }
  }
  return "unknown";
}

export function LocalizationAdvancedSettings(props: {sphereId: sphereId}) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeLocalizationAppSettings']);

  let state = core.store.getState();

  let items = [];
  items.push({label: lang("SMOOTHING__REACTION_SPEED"),  type:'explanation'});
  let values : {label:string, value: LocalizationSmoothingMethod}[] = [
    {label: lang("None"),            value: 'NONE'},
    {label: lang("Last___seconds"),  value: 'SEQUENTIAL_2'},
    {label: lang("Last___seconds"),  value: 'BEST_OUT_OF_5'},
    {label: lang("Last____seconds"), value: 'BEST_OUT_OF_10'},
  ];

  items.push({
    type: 'popup',
    label: lang("Smoothing_method"),
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
  items.push({label: lang("If_the_localization_is_er"),  type:'explanation', below: true});

  items.push({label: lang("PHONE_OPTIMIZATIONS"),  type:'explanation', below: false, alreadyPadded: true});
  if (Object.keys(state.transforms).length > 0) {
    items.push({
      type: 'button',
      label: "Delete all phone optimizations",
      numberOfLines: 2,
      callback: () => {
        Alert.alert(
          "Are you sure?",
          "You'll have to perform the optimizations again.",
          [{ text: lang("Cancel"), style: 'cancel' }, {
            text: lang("Delete"), style: 'destructive', onPress: () => {
              core.store.dispatch({ type: "REMOVE_ALL_TRANSFORMS" });
            }
          }], { cancelable: false });
      }
    });
  }
  else {
    items.push({
      type:"info",
      label: lang("No_optimizations_to_delet"),
      style: {color: colors.black.rgba(0.3)}
    })
  }
  items.push({label: lang("You_can_delete_your_phone"),  type:'explanation', below: true});


  items.push({label: lang("DANGER"),  type:'explanation', alreadyPadded: true});
  if (Permissions.inSphere(props.sphereId).canDeleteExternalFingerprints) {
    items.push({
      type: 'button',
      label: "Delete all localization datasets",
      numberOfLines: 2,
      callback: () => {
        Alert.alert(
          "Are you sure?",
          "Everyone will have to perform the training again. This will not affect other users who have phone exclusivity enabled.",
          [{ text: lang("Cancel"), style: 'cancel' }, {
            text: lang("Delete"), style: 'destructive', onPress: () => {
              FingerprintUtil.deleteAllFingerprints(props.sphereId);
            }
          }], { cancelable: false });
      }
    });
    items.push({
      label: lang("Deleting_datasets_will_af"),
      type: 'explanation',
      below: true
    });

    if (state.app.localization_onlyOwnFingerprints) {
      items.push( {
        type:  'button',
        label: "Only delete my datasets",
        numberOfLines:2,
        callback: () => {
          Alert.alert(
            "Are you sure?",
            "You will have to train all the rooms again...",
            [{text: lang("Cancel"), style: 'cancel'}, {text: lang("Delete"), style:'destructive', onPress: () => {
                FingerprintUtil.deleteAllUsedFingerprints(props.sphereId);
              }}], {cancelable: false});
        }
      });
      items.push({label: lang("Since_you_have_phone_excl"),  type:'explanation', below: true});
    }
  }
  else if (state.app.localization_onlyOwnFingerprints) {
    items.push( {
      type:  'button',
      label: "Delete localization datasets",
      numberOfLines:2,
      callback: () => {
        Alert.alert(
          "Are you sure?",
          "You will have to train all the rooms again...",
          [{text: lang("Cancel"), style: 'cancel'}, {text: lang("Delete"), style:'destructive', onPress: () => {
              FingerprintUtil.deleteAllUsedFingerprints(props.sphereId);
            }}], {cancelable: false});
      }
    });
    items.push({label: lang("Since_you_have_phone_exclu"),  type:'explanation', below: true});
  }



  items.push({label: lang("LAST_RESORT"),  type:'explanation', alreadyPadded: true});
  items.push({
    type: 'switch',
    label: "Phone exclusivity",
    value: state.app.localization_onlyOwnFingerprints,
    callback: (newValue) => {
      if (newValue === true) {
        Alert.alert(
          "Are you sure?",
          "This will mark all datasets you have trained exclusive to your device.",
          [{text: lang("Cancel"), style: 'cancel'}, {text: lang("Delete"), style:'destructive', onPress: () => {
              FingerprintUtil.enableExclusivity();
            }}], {cancelable: false});

      }
      else {
        core.store.dispatch({type: "UPDATE_APP_LOCALIZATION_SETTINGS", data: { localization_onlyOwnFingerprints: newValue }});
      }
    }
  })
  items.push({label: lang("If_your_localization_suff"),  type:'explanation', below: true});

  return (
    <SettingsBackground>
      <SettingsScrollView>
        <ListEditableItems items={items} />
      </SettingsScrollView>
    </SettingsBackground>
  );
}

LocalizationAdvancedSettings.options = TopBarUtil.getOptions({ title: lang("Advanced_Settings")});

