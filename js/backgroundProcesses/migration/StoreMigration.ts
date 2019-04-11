import { core } from "../../core";
import { DataUtil } from "../../util/DataUtil";
import { xUtil } from "../../util/StandAloneUtil";
import DeviceInfo from "react-native-device-info";


function fromOldTo3_0() {
  let state = core.store.getState();
  let actions = [];
  let appVersion = DeviceInfo.getReadableVersion();
  if (xUtil.versions.isLower(state.app.migratedDataToVersion, appVersion)) {
    DataUtil.callOnAllStones(state, (sphereId, stoneId, stone) => {
      // check if we have an appliance
      let name = stone.config.name;
      let icon = stone.config.icon;
      // if icon is not a default!!
      if (icon === 'c2-pluginFilled' || icon === 'c2-crownstone') { return; }

      if (stone.config.applianceId) {
        let appliance = state.spheres[sphereId].appliances[stone.config.applianceId];
        if (appliance) {
          let applianceName = appliance.config.name;
          let applianceIcon = appliance.config.icon;
          if (name !== applianceName || icon !== applianceIcon) {
            actions.push({
              type:"UPDATE_STONE_CONFIG",
              sphereId: sphereId,
              stoneId: stoneId,
              data: { name: appliance.config.name || name, icon: appliance.config.icon ||  icon, applianceId: null }
            });
          }
        }
      }
    });

    core.store.batchDispatch(actions);

    actions = [];
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      actions.push({
        type:"DANGER_REMOVE_ALL_APPLIANCES",
        sphereId: sphereId,
      });
    })
    // TODO: uncomment the deletion.
    // core.store.batchDispatch(actions);
    // core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}})
  }
}

export function migrate() {
  fromOldTo3_0();
}