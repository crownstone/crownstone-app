
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";


import { colors, deviceStyles, background } from "../../styles";
import {Background} from "../../components/Background";
import {IconButton} from "../../components/IconButton";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { ListEditableItems } from "../../components/ListEditableItems";
import {
  DataUtil,
  enoughCrownstonesForIndoorLocalization
} from "../../../util/DataUtil";
import {Icon} from "../../components/Icon";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import {FingerprintUtil} from "../../../util/FingerprintUtil";
import { LocalizationMenu_notInSphere }          from "./LocalizationMenu/LocalizationMenu_notInSphere";
import { LocalizationMenu_notEnoughCrownstones } from "./LocalizationMenu/LocalizationMenu_notEnoughCrownstones";
import { LocalizationMenu_active }               from "./LocalizationMenu/LocalizationMenu_active";
import { LocalizationMenu_gettingStarted }       from "./LocalizationMenu/LocalizationMenu_gettingStarted";


export function LocalizationMenu(props) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeFingerprint','changeSphereState', 'changeLocations']);

  if (!DataUtil.inSphere(props.sphereId)) {
    return <LocalizationMenu_notInSphere {...props} />;
  }

  let enoughCrownstones = enoughCrownstonesForIndoorLocalization(props.sphereId);
  if (!enoughCrownstones) {
    return <LocalizationMenu_notEnoughCrownstones {...props} />;
  }

  let trainingRequired  = FingerprintUtil.requireMoreFingerprintsBeforeLocalizationCanStart(props.sphereId);
  if (!trainingRequired) {
    return <LocalizationMenu_active {...props} />;
  }

  return <LocalizationMenu_gettingStarted {...props} />;
}

LocalizationMenu.options = TopBarUtil.getOptions({ title: "Localization", closeModal: true });


