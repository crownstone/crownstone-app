import { enoughCrownstonesInLocationsForIndoorLocalization } from "./DataUtil";
import { Get } from "./GetUtil";
import { core } from "../Core";
import { FingerprintUtil } from "./FingerprintUtil";
import { LocalizationUtil } from "./LocalizationUtil";


export const MenuNotificationUtil = {

  isThereALocalizationAlert: function(sphereId: string) : boolean {
    let enoughForLocalizationInLocations = enoughCrownstonesInLocationsForIndoorLocalization(sphereId);
    let requiresFingerprints             = FingerprintUtil.requireMoreFingerprintsBeforeLocalizationCanStart(sphereId);
    let transformsRequired               = FingerprintUtil.transformsRequired(sphereId);

    let state  = core.store.getState();
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return false; }

    return sphere.state.present                         &&
           enoughForLocalizationInLocations             &&
          (requiresFingerprints || transformsRequired ) &&
           state.app.indoorLocalizationEnabled;
  },

  isThereALocalizationBadge: function(sphereId: string) : BadgeIndicator {
    let indicator          = LocalizationUtil.getLocationsInNeedOfAttention(sphereId).length > 0 ? "!" : false;
    let transformsRequired = FingerprintUtil.transformsRequired(sphereId);

    let state  = core.store.getState();
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return false; }

    if (sphere.state.present && state.app.indoorLocalizationEnabled) {
      return indicator || transformsRequired;
    }
    return false;
  }
};
