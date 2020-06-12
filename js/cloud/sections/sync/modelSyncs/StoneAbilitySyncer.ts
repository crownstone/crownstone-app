/**
 *
 * Sync the messages from the cloud to the database.
 *
 */

import { SyncingSphereItemBase, SyncingStoneItemBase } from "./SyncingBase";
import { shouldUpdateInCloud, shouldUpdateLocally } from "../shared/syncUtil";
import { CLOUD } from "../../../cloudAPI";
import { Permissions } from "../../../../backgroundProcesses/PermissionManager";

const ABILITY_TYPE = {
  dimming:      "dimming",
  switchcraft:  "switchcraft",
  tapToToggle:  "tapToToggle",
};

const ABILITY_PROPERTY_TYPE = {
  dimming:      { softOnSpeed: 'softOnSpeed'},
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

    let abilitiesToSetInCloud = {};

    let updateAbilityInCloud = (ability, type) => {
      abilitiesToSetInCloud[type] = {enabled: ability.enabledTarget, syncedToCrownstone: ability.syncedToCrownstone, updatedAt: ability.updatedAt}
      switch (type) {
        case ABILITY_TYPE.dimming:
          abilitiesToSetInCloud[type].properties = [{type: ABILITY_PROPERTY_TYPE.dimming.softOnSpeed, value: ability.softOnSpeed}]
          break;
        case ABILITY_TYPE.tapToToggle:
          abilitiesToSetInCloud[type].properties = [{type: ABILITY_PROPERTY_TYPE.tapToToggle.rssiOffset, value: ability.rssiOffsetTarget}]
          break;
        default:
          break;
      }
    }

    let setLocally = (localAbility, ability_in_cloud) => {
      switch(ability_in_cloud.type) {
        case ABILITY_TYPE.dimming:
          let actionType = "UPDATE_ABILITY_DIMMER";

          let softOnSpeed = localAbility && localAbility.softOnSpeed || 0;
          if (ability_in_cloud.properties && ability_in_cloud.properties.length > 0) {
            for (let i = 0; i < ability_in_cloud.properties.length; i++) {
              if (ability_in_cloud.properties[i].type === ABILITY_PROPERTY_TYPE.dimming.softOnSpeed) {
                softOnSpeed = ability_in_cloud.properties[i].value;
              }
            }
          }
          let softOnSpeedData = {softOnSpeed: softOnSpeed}

          if (ability_in_cloud.syncedToCrownstone) {
            actionType = "UPDATE_ABILITY_DIMMER_AS_SYNCED_FROM_CLOUD"
          }
          this.actions.push({type: actionType, sphereId: this.localSphereId, stoneId: this.localStoneId, data: {
            enabledTarget: ability_in_cloud.enabled,
            updatedAt: ability_in_cloud.updatedAt,
            ...softOnSpeedData
          }});
          break;
        case ABILITY_TYPE.switchcraft:
          actionType = "UPDATE_ABILITY_SWITCHCRAFT";
          if (ability_in_cloud.syncedToCrownstone) {
            actionType = "UPDATE_ABILITY_SWITCHCRAFT_AS_SYNCED_FROM_CLOUD"
          }
          this.actions.push({type: actionType, sphereId: this.localSphereId, stoneId: this.localStoneId, data: {
            enabledTarget: ability_in_cloud.enabled,
            updatedAt: ability_in_cloud.updatedAt
          }});
          break;
        case ABILITY_TYPE.tapToToggle:
          actionType = "UPDATE_ABILITY_TAP_TO_TOGGLE";
          let rssiOffset = localAbility && localAbility.rssiOffset || 0;
          if (ability_in_cloud.properties && ability_in_cloud.properties.length > 0) {
            for (let i = 0; i < ability_in_cloud.properties.length; i++) {
              if (ability_in_cloud.properties[i].type === ABILITY_PROPERTY_TYPE.tapToToggle.rssiOffset) {
                rssiOffset = ability_in_cloud.properties[i].value;
              }
            }
          }
          let rssiOffsetData = {rssiOffsetTarget: rssiOffset}
          if (ability_in_cloud.syncedToCrownstone) {
            actionType = "UPDATE_ABILITY_TAP_TO_TOGGLE_AS_SYNCED_FROM_CLOUD";
            rssiOffsetData["rssiOffset"] = rssiOffset;
          }
          this.actions.push({type: actionType, sphereId: this.localSphereId, stoneId: this.localStoneId, data: {
            enabledTarget: ability_in_cloud.enabled,
            updatedAt: ability_in_cloud.updatedAt,
            ...rssiOffsetData
          }});
          break;
      }
    }

    // check if the ability entries are present in the cloud
    for (let i = 0; i < abilities_in_cloud.length; i++) {
      let ability_in_cloud = abilities_in_cloud[i];
      abilitiesPresentInCloud[ability_in_cloud.type] = true;
      let localAbility = localAbilities[ability_in_cloud.type];
      // this ability is present both locally and in the cloud!
      if (localAbility) {
        if (shouldUpdateInCloud(localAbility, ability_in_cloud) && Permissions.inSphere(this.localSphereId).canUploadAbilities) {
          // update in cloud
          updateAbilityInCloud(localAbility, ability_in_cloud.type);
        }
        else if (shouldUpdateLocally(localAbility, ability_in_cloud)) {
          // set locally
          setLocally(localAbility, ability_in_cloud);
        }
      }
      else {
        // create locally.
        setLocally(localAbility, ability_in_cloud);
      }
    }

    if (Permissions.inSphere(this.localSphereId).canUploadAbilities) {
      for (let i = 0; i < localAbilityTypes.length; i++) {
        if (abilitiesPresentInCloud[localAbilityTypes[i]] === false) {
          updateAbilityInCloud(localAbilities[localAbilityTypes[i]], localAbilityTypes[i]);
        }
      }

      if (Object.keys(abilitiesToSetInCloud).length > 0) {
        // update Cloud.
        this.transferPromises.push(CLOUD.forStone(this.cloudStoneId).setStoneAbilities(abilitiesToSetInCloud));
      }
    }

    return Promise.all(this.transferPromises);
  }

}
