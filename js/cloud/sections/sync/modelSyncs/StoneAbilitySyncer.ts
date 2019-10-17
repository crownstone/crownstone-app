/**
 *
 * Sync the messages from the cloud to the database.
 *
 */

import {SyncingSphereItemBase} from "./SyncingBase";
import { shouldUpdateInCloud } from "../shared/syncUtil";


const ABILITY_TYPE = {
  dimming:      "dimming",
  switchcraft:  "switchcraft",
  tapToToggle:  "tapToToggle",
};

const ABILITY_PROPERTY_TYPE = {
  dimming:      {},
  switchcraft:  {},
  tapToToggle:  { rssiOffset: 'rssiOffset' },
};

export class StoneAbilitySyncer extends SyncingSphereItemBase {

  sync(localAbilities, abilities_in_cloud) {
    let localAbilityTypes = Object.keys(localAbilities);

    let abilitiesPresentInCloud = {};
    for (let i = 0; i < localAbilityTypes.length; i++) {
      abilitiesPresentInCloud[localAbilityTypes[i]] = false;
    }

    // check if the ability entries are present in the cloud
    for (let i = 0; i < abilities_in_cloud.length; i++) {
      let cloudAbility = abilities_in_cloud[i];
      abilitiesPresentInCloud[cloudAbility.type] = true;

      // this ability is present both locally and in the cloud!
      if (localAbilityTypes[cloudAbility.type]) {
        // if (shouldUpdateInCloud(localAbilities[cloudAbility.type]))
      }
      else {
        // create locally.
      }

    }


    // otherwise make them

    // if all are present, check times
  }

}
