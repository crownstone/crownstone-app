import { StoreManager } from "../../../database/storeManager";
import { core } from "../../../Core";
import DeviceInfo from "react-native-device-info";
import { xUtil } from "../../../util/StandAloneUtil";

export const clean_upTo5_0 = function() {

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
      actions.push({type:"REMOVE_ALL_ABILITIES", sphereId, stoneId});
      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'dimming',
        data: {type:'dimming', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });
      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'dimming', propertyId: 'softOnSpeed',
        data: {type:'softOnSpeed', value: 8, valueTarget: 8, syncedToCrownstone: true, updatedAt:100}
      });

      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'switchcraft',
        data: {type:'switchcraft', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });

      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'tapToToggle',
        data: {type:'tapToToggle', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });
      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'tapToToggle', propertyId: 'rssiOffset',
        data: {type:'rssiOffset', value: 0, valueTarget: 0, syncedToCrownstone: true, updatedAt:100}
      });
    }
  }

  core.store.batchDispatch(actions);
}