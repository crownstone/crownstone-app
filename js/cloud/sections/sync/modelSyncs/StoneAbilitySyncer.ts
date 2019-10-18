/**
 *
 * Sync the messages from the cloud to the database.
 *
 */

import { SyncingSphereItemBase, SyncingStoneItemBase } from "./SyncingBase";
import { shouldUpdateInCloud, shouldUpdateLocally } from "../shared/syncUtil";


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

export class StoneAbilitySyncer extends SyncingStoneItemBase {

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
        if (shouldUpdateInCloud(localAbilities[cloudAbility.type], cloudAbility)) {
          // update in cloud
        }
        else if (shouldUpdateLocally(localAbilities[cloudAbility.type], cloudAbility)) {
          // update locally
        }
      }
      else {
        // create locally.
      }
    }


    for (let i = 0; i < localAbilityTypes.length; i++) {
      if (abilitiesPresentInCloud[localAbilityTypes[i]] === false) {
        // make in cloud
      }
    }
  }

}
