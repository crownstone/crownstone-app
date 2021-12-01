import { core } from "../../../Core";
import { xUtil } from "../../../util/StandAloneUtil";

export const upTo4_3 = function(lastMigrationVersion, appVersion) {
  if (xUtil.versions.isLower(lastMigrationVersion, appVersion, 4) || !lastMigrationVersion) {
    migrateSceneSwitchRanges();
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}


function migrateSceneSwitchRanges() {
  let state = core.store.getState();
  let actions = [];

  Object.keys(state.spheres).forEach((sphereId) => {
    let sphere = state.spheres[sphereId];
    let scenes = sphere.scenes;

    Object.keys(sphere.scenes).forEach((sceneId) => {
      let scene = sphere.scenes[sceneId];
      let {migrationRequired, action} = migrateScene(sphereId, sceneId, scene);
      if (migrationRequired) {
        actions.push(action);
      }
    })
  });

  core.store.batchDispatch(actions);
}

export function migrateScene(sphereId, sceneId, scene = null) : {migrationRequired: boolean, action: any, switchData: any} {
  let noAction = {migrationRequired:false, action:{}, switchData: {}};
  if (scene === null) {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere) { return noAction; }
    scene = sphere.scenes[sceneId];
    if (!scene) { return noAction; }
  }
  if (scene.data) {
    let { migrationRequired, switchData } = verifyMigrateSceneSwitchData(scene.data);
    if (migrationRequired) {
      return {
        migrationRequired,
        action: { type: "UPDATE_SCENE", sphereId, sceneId, data: { data: switchData } },
        switchData: switchData
      };
    }
  }
  return noAction;
}

function verifyMigrateSceneSwitchData(switchData) : { migrationRequired: boolean, switchData: any } {
  let migratedData = {};
  let migrationRequired = false;
  if (switchData) {
    Object.keys(switchData).forEach((stoneUID) => {
      let value = switchData[stoneUID];
      if (value > 0 && value <= 1) {
        migrationRequired = true;
        migratedData[stoneUID] = Math.round(value*100);
      }
      else {
        migratedData[stoneUID] = value;
      }
    })
    return { migrationRequired: migrationRequired, switchData: migratedData };
  }
  return { migrationRequired: migrationRequired, switchData: migratedData }
}

export function migrateSceneSwitchData(switchData) : { [stoneUID: number] : number } {
  let { migrationRequired, switchData: migratedData } = verifyMigrateSceneSwitchData(switchData);
  return migratedData;
}