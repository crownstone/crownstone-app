
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
  return lang("unknown");
}

export function LocalizationAdvancedSettings(props: {sphereId: sphereId}) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeLocalizationAppSettings','changeTransforms','changeProcessedFingerprint']);

  let state = core.store.getState();

  let items = [];
  items.push({label: lang("SMOOTHING__REACTION_SPEED"),  type:'explanation'});
  let values : {label:string, value: LocalizationSmoothingMethod}[] = [
    {label: lang("None"),            value: 'NONE'},
    {label: lang("Last_2__seconds"),  value: 'SEQUENTIAL_2'},
    {label: lang("Last_5___seconds"),  value: 'BEST_OUT_OF_5'},
    {label: lang("Last_10___seconds"), value: 'BEST_OUT_OF_10'},
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
      label: lang("Delete_all_phone_optimiza"),
      numberOfLines: 2,
      callback: () => {
        Alert.alert(
          lang("Are_you_sure_"),
          lang("Youll_have_to_perform_the"),
          [{ text: lang("Cancel"), style: 'cancel' }, {
            text: lang("Delete"), style: 'destructive', onPress: () => {
              core.store.dispatch({ type: "REMOVE_ALL_TRANSFORMS" });
              Alert.alert(lang("Done"), lang("You_can_repeat_the_optimi"),[{text: lang("OK")}]);
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
      label: lang("Delete_all_localization_d"),
      numberOfLines: 2,
      callback: () => {
        Alert.alert(
          lang("Are_you_sure_"),
          lang("Everyone_will_have_to_per"),
          [{ text: lang("Cancel"), style: 'cancel' }, {
            text: lang("Delete"), style: 'destructive', onPress: () => {
              FingerprintUtil.deleteAllFingerprints(props.sphereId);
              Alert.alert(lang("Done"), lang("You_will_need_to_retrain_"),[{text: lang("OK")}]);
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
        label: lang("Only_delete_my_datasets"),
        numberOfLines:2,
        callback: () => {
          Alert.alert(
            lang("Are_you_sure_"),
            lang("You_will_have_to_train_al"),
            [{text: lang("Cancel"), style: 'cancel'}, {text: lang("Delete"), style:'destructive', onPress: () => {
                FingerprintUtil.deleteAllUsedFingerprints(props.sphereId);
                Alert.alert(lang("Done"), lang("You_will_need_to_retrain_"),[{text: lang("OK")}]);
              }}], {cancelable: false});
        }
      });
      items.push({label: lang("Since_you_have_phone_excl"),  type:'explanation', below: true});
    }
  }
  else if (state.app.localization_onlyOwnFingerprints) {
    items.push( {
      type:  'button',
      label: lang("Delete_localization_datas"),
      numberOfLines:2,
      callback: () => {
        Alert.alert(
          lang("Are_you_sure_"),
          lang("You_will_have_to_train_all"),
          [{text: lang("Cancel"), style: 'cancel'}, {text: lang("Delete"), style:'destructive', onPress: () => {
              FingerprintUtil.deleteAllUsedFingerprints(props.sphereId);
              Alert.alert(lang("Done"), lang("You_will_need_to_retrain_"),[{text: lang("OK")}]);
            }}], {cancelable: false});
      }
    });
    items.push({label: lang("Since_you_have_phone_exclu"),  type:'explanation', below: true});
  }



  items.push({label: lang("LAST_RESORT"),  type:'explanation', alreadyPadded: true});
  items.push({
    type: 'switch',
    label: lang("Phone_exclusivity"),
    value: state.app.localization_onlyOwnFingerprints,
    callback: (newValue) => {
      if (newValue === true) {
        Alert.alert(
          lang("Are_you_sure_"),
          lang("This_will_mark_all_datase"),
          [{text: lang("Cancel"), style: 'cancel'}, {text: lang("OK"), style:'destructive', onPress: () => {
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

