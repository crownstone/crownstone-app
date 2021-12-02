import { StoreManager } from "../../../database/storeManager";
import { core } from "../../../Core";
import { xUtil } from "../../../util/StandAloneUtil";

export const clean_upTo5_0 = async function() {
  await StoreManager.persistor.destroyDataFields([{spheres: { _id_ : {stones: { _id_ : 'mesh'}}}}], "MIGRATED_5.0.0")
  await StoreManager.persistor.destroyDataFields([{spheres: { _id_ : {stones: { _id_ : 'rules'}}}}], "MIGRATED_5.0.1")
}

export const upTo5_0 = function(lastMigrationVersion, appVersion) {
  if (xUtil.versions.isLower(lastMigrationVersion, appVersion, 4) || !lastMigrationVersion) {
    resetAbilities();
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}

function resetAbilities() {
  let state = core.store.getState();
  let actions = [];

  for (let [sphereId, sphere] of Object.entries<SphereData>(state.spheres)) {
    for (let [stoneId, stone] of Object.entries<StoneData>(sphere.stones)) {
      if (stone.abilities.dimming.properties !== undefined) { continue; }

      let dimming     = stone.abilities.dimming;
      let switchcraft = stone.abilities.switchcraft;
      let tapToToggle = stone.abilities.tapToToggle;


      actions.push({type:"REMOVE_ALL_ABILITIES", sphereId, stoneId});
      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'dimming',
        data: {type:'dimming', enabled: dimming.enabled, enabledTarget: dimming.enabledTarget, syncedToCrownstone:dimming.syncedToCrownstone, updatedAt:dimming.updatedAt}
      });

      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'dimming', propertyId: 'softOnSpeed',
        data: {type:'softOnSpeed', value: dimming.softOnSpeed, valueTarget: dimming.softOnSpeed,  syncedToCrownstone:dimming.syncedToCrownstone, updatedAt:dimming.updatedAt}
      });

      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'switchcraft',
        data: {type:'switchcraft', enabled: switchcraft.enabled, enabledTarget: switchcraft.enabledTarget, syncedToCrownstone: switchcraft.syncedToCrownstone, updatedAt: switchcraft.updatedAt}
      });

      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'tapToToggle',
        data: {type:'tapToToggle', enabled: tapToToggle.enabled, enabledTarget: tapToToggle.enabledTarget, syncedToCrownstone: tapToToggle.syncedToCrownstone, updatedAt: tapToToggle.updatedAt}
      });

      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'tapToToggle', propertyId: 'rssiOffset',
        data: {type:'rssiOffset', value: tapToToggle.rssiOffset, valueTarget: tapToToggle.rssiOffset, syncedToCrownstone: tapToToggle.syncedToCrownstone, updatedAt: tapToToggle.updatedAt}
      });
    }
  }

  core.store.batchDispatch(actions);
}