
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationAdvancedSettings", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Text, View, Alert, Linking } from "react-native";


import { colors, deviceStyles, background, topBarHeight, styles, screenHeight, screenWidth } from "../../styles";
import {Background} from "../../components/Background";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { Button } from "../../components/Button";
import { NavigationBar } from "../../components/editComponents/NavigationBar";
import { OverlayUtil } from "../../../util/OverlayUtil";
import { Spacer } from "../../components/Spacer";
import { Get } from "../../../util/GetUtil";
import { LocalizationMonitor } from "../../../localization/LocalizationMonitor";
import { FingerprintAppender } from "../../../localization/fingerprints/FingerprintAppender";
import { SettingsBackground } from "../../components/SettingsBackground";
import { Icon } from "../../components/Icon";
import { LocalizationUtil } from "../../../util/LocalizationUtil";
import { ListEditableItems } from "../../components/ListEditableItems";
import { LOG_LEVEL } from "../../../logging/LogLevels";
import { core } from "../../../Core";


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
  items.push({label: "SMOOTHING",  type:'explanation'});
  let values : {label:string, value: LocalizationSmoothingMethod}[] = [
    {label: "None",               value: 'NONE'},
    {label: "Same result twice",  value: 'SEQUENTIAL_2'},
    {label: "Best out of 5",      value: 'BEST_OUT_OF_5'},
    {label: "Majority in 10",     value: '60_PERCENT_IN_10'},
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
      console.log("Selected Value", newValue);
      // core.store.dispatch({type: "UPDATE_APP_LOCALIZATION_SETTINGS", data: { localization_temporalSmoothingMethod: newValue }})
    }
  })
  items.push({label: "If the localization is irratic, first try to improve the training data via the 'Localization has made a mistake' or 'Find and fix difficult spots'. That last one is found by tapping a room in the previous view.\n\nIf that is not enough, you can use smoothing.",  type:'explanation', below: true});


  return (
    <SettingsBackground>
      <View style={{height:topBarHeight}}/>
      <ListEditableItems items={items} />
    </SettingsBackground>
  );
}

LocalizationAdvancedSettings.options = TopBarUtil.getOptions({ title: lang("Advanced_Settings")});

