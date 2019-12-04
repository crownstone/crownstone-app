import { CLOUD }        from "../cloudAPI";
import {LOGe} from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";
import {Permissions} from "../../backgroundProcesses/PermissionManager";

let fieldMap : fieldMap = [
  {local: 'uid',                cloud: 'uid'},
  {local: 'crownstoneId',       cloud: 'uid'},
  {local: 'dimmingEnabled',     cloud: 'dimmingEnabled'},
  {local: 'firmwareVersion',    cloud: 'firmwareVersion'},
  {local: 'bootloaderVersion',  cloud: 'bootloaderVersion'},
  {local: 'hardwareVersion',    cloud: 'hardwareVersion'},
  {local: 'hidden',             cloud: 'hidden'},
  {local: 'icon',               cloud: 'icon'},
  {local: 'iBeaconMajor',       cloud: 'major'},
  {local: 'iBeaconMinor',       cloud: 'minor'},
  {local: 'locked',             cloud: 'locked'},
  {local: 'switchCraft',        cloud: 'switchCraft'},
  {local: 'macAddress',         cloud: 'address'},
  // {local: 'meshNetworkId',      cloud: 'meshNetworkId', localToCloudOnly: true},
  {local: 'name',               cloud: 'name'},
  {local: 'onlyOnWhenDark',     cloud: 'onlyOnWhenDark'},
  {local: 'tapToToggle',        cloud: 'tapToToggle'},
  {local: 'type',               cloud: 'type'},
  {local: 'updatedAt',          cloud: 'updatedAt'},
  {local: 'json',               cloud: 'json', localToCloudOnly: true},

  // this is custom inserted.
  {local: 'locationId',         cloud: 'localLocationId',  cloudToLocalOnly: true},
  {local: 'cloudLocationId',    cloud: 'locationId',       localToCloudOnly: true},

  // used for local config
  {local: 'cloudId',            cloud:  'id',  cloudToLocalOnly: true  },
  {local: 'nearThreshold',      cloud:  null },
  {local: 'rssi',               cloud:  null },
  {local: 'disabled',           cloud:  null },
  {local: 'dfuResetRequired',   cloud:  null },
  {local: 'handle',             cloud:  null },
  {local: 'locationId',         cloud:  null },
];

export const transferStones = {
  fieldMap: fieldMap,

  createOnCloud: function( actions, data : transferNewToCloudData ) {
    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.forSphere(data.cloudSphereId).createStone(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_STONE_CLOUD_ID', sphereId: data.localSphereId, stoneId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOGe.cloud("Transfer-Stone: Could not create stone in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( data : transferToCloudData ) {
    if (data.cloudId === undefined) {
      return Promise.reject({status: 404, message:"Can not update in cloud, no cloudId available"});
    }

    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    if (Permissions.inSphere(data.localSphereId).setBehaviourInCloud) {
      payload['json'] = JSON.stringify(data.localData.behaviour);
    }

    return CLOUD.forSphere(data.cloudSphereId).updateStone(data.cloudId, payload)
      .catch((err) => {
        LOGe.cloud("Transfer-Stone: Could not update stone in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    this._injectLocationId(data);

    transferUtil._handleLocal(
      actions,
      'ADD_STONE',
      { sphereId: data.localSphereId, stoneId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalData) {
    this._injectLocationId(data);

    transferUtil._handleLocal(
      actions,
      'UPDATE_STONE_CONFIG',
      { sphereId: data.localSphereId, stoneId: data.localId },
      data,
      fieldMap
    );
  },

  /**
   * Since the locationId is handled differently in the cloud, we have to inject it manually.
   * @param data
   * @private
   */
  _injectLocationId(data) {
    let locationId = null;
    if (data.cloudData && data.cloudData.locationId !== undefined) {
      // no need for insert
      return;
    }

    if (data.cloudData && data.cloudData.locations && Array.isArray(data.cloudData.locations) && data.cloudData.locations.length > 0) {
      locationId = data.cloudData.locations[0].id;

      data.cloudData['locationId'] = locationId;
    }
  }

  // todo: create new

};