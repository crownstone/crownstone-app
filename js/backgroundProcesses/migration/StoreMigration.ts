import { core } from "../../core";
import { DataUtil } from "../../util/DataUtil";
import { xUtil } from "../../util/StandAloneUtil";
import DeviceInfo from "react-native-device-info";
import { Permissions } from "../PermissionManager";


function fromOldTo3_0() {
  let state = core.store.getState();
  let actions = [];
  let appVersion = DeviceInfo.getReadableVersion();
  if (xUtil.versions.isLower(state.app.migratedDataToVersion, appVersion) || !state.app.migratedDataToVersion) {
    let locationMap = {};
    Object.keys(state.spheres).forEach((sphereId) => {
      if (Object.keys(state.spheres[sphereId].locations).length === 0) {
        let localId = xUtil.getUUID();
        locationMap[sphereId] = localId;
        if (Permissions.inSphere(sphereId).addRoom) {
          core.store.dispatch({
            type:'ADD_LOCATION',
            sphereId: sphereId,
            locationId: localId,
            data: {name: "Living room", icon: "c1-tvSetup2"}
          });
        }
      }
    });

    DataUtil.callOnAllStones(state, (sphereId, stoneId, stone) => {
      if (Permissions.inSphere(sphereId).editCrownstone) {
        // check if we have an appliance
        let name = stone.config.name;
        let icon = stone.config.icon;
        // if icon is not a default!!
        if (icon !== 'c2-pluginFilled' && icon !== 'c2-crownstone') {
          return;
        }
        if (stone.config.applianceId) {
          let appliance = state.spheres[sphereId].appliances[stone.config.applianceId];
          if (appliance) {
            let applianceName = appliance.config.name;
            let applianceIcon = appliance.config.icon;
            if (name !== applianceName || icon !== applianceIcon) {

              actions.push({
                type: "UPDATE_STONE_CONFIG",
                sphereId: sphereId,
                stoneId: stoneId,
                data: {
                  name: appliance.config.name || name,
                  icon: appliance.config.icon || icon,
                  applianceId: null,
                  locationId: locationMap[sphereId] // this is either an id or undefined, if undefined, it won't update the field.
                }
              });
            }
          }
        }
      }
    });


    core.store.batchDispatch(actions);
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}

export function migrate() {
  // fromOldTo3_0();
}