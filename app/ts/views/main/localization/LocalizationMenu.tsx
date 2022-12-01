
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu", key)(a,b,c,d,e);
}
import * as React from 'react';
import { TopBarUtil } from "../../../util/TopBarUtil";
import {
  DataUtil,
  enoughCrownstonesForIndoorLocalization
} from "../../../util/DataUtil";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import {FingerprintUtil} from "../../../util/FingerprintUtil";
import { LocalizationMenu_notInSphere }          from "./localizationMenu/LocalizationMenu_notInSphere";
import { LocalizationMenu_notEnoughCrownstones } from "./localizationMenu/LocalizationMenu_notEnoughCrownstones";
import { LocalizationMenu_active }               from "./localizationMenu/LocalizationMenu_active";
import { LocalizationMenu_gettingStarted }       from "./localizationMenu/LocalizationMenu_gettingStarted";


export function LocalizationMenu(props) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeFingerprint','changeSphereState', 'changeLocations', 'changeLocalizationAppSettings', 'changeProcessedFingerprint']);

  if (!DataUtil.inSphere(props.sphereId)) {
    return <LocalizationMenu_notInSphere {...props} />;
  }

  let enoughCrownstones = enoughCrownstonesForIndoorLocalization(props.sphereId);
  let trainingRequired  = FingerprintUtil.requireMoreFingerprintsBeforeLocalizationCanStart(props.sphereId);

  if (!enoughCrownstones) {
    return <LocalizationMenu_notEnoughCrownstones {...props} />;
  }

  if (!trainingRequired) {
    return <LocalizationMenu_active {...props} />;
  }

  return <LocalizationMenu_gettingStarted {...props} />;
}

LocalizationMenu.options = TopBarUtil.getOptions({ title: lang("Localization"), closeModal: true });


