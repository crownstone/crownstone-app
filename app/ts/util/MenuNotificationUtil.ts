import { enoughCrownstonesInLocationsForIndoorLocalization } from "./DataUtil";
import { Get } from "./GetUtil";
import { core } from "../Core";
import { requireMoreFingerprintsBeforeLocalizationCanStart } from "./FingerprintUtil";


export const MenuNotificationUtil = {

  isThereALocalizationAlert: function(sphereId: string) : boolean {
    let enoughForLocalizationInLocations = enoughCrownstonesInLocationsForIndoorLocalization(sphereId);
    let requiresFingerprints             = requireMoreFingerprintsBeforeLocalizationCanStart(sphereId);

    let state  = core.store.getState();
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return false; }

    return sphere.state.present                 &&
            enoughForLocalizationInLocations    &&
            requiresFingerprints                &&
            state.app.indoorLocalizationEnabled;
  }
};
