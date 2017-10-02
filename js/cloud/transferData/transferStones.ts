import { CLOUD }        from "../cloudAPI";
import { LOG }          from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";

let fieldMap : fieldMap = [
  {local: 'applianceId',        cloud: 'applianceId'},
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
  {local: 'macAddress',         cloud: 'address'},
  {local: 'meshNetworkId',      cloud: 'meshNetworkId'},
  {local: 'name',               cloud: 'name'},
  {local: 'onlyOnWhenDark',     cloud: 'onlyOnWhenDark'},
  {local: 'touchToToggle',      cloud: 'touchToToggle'},
  {local: 'type',               cloud: 'type'},
  {local: 'updatedAt',          cloud: 'updatedAt'},

  // this is custom inserted.
  {local: 'locationId',         cloud: 'locationId'},

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

  createOnCloud: function( actions, data : transferToCloudData ) {
    // TODO: include the switch state
    // TODO: add behaviour

    let payload = {};
    payload['sphereId'] = data.sphereId;
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.forSphere(data.sphereId).createStone(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_STONE_CLOUD_ID', sphereId: data.sphereId, stoneId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOG.error("Transfer-Stone: Could not create stone in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( actions, data : transferToCloudData ) {
    if (data.cloudId === undefined) {
      return new Promise((resolve,reject) => { reject({status: 404, message:"Can not update in cloud, no cloudId available"}); });
    }

    let payload = {};
    payload['sphereId'] = data.sphereId;
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);

    // add optional extra fields to payload
    if (data.extraFields) {
      let extraFieldKeys = Object.keys(data.extraFields);
      extraFieldKeys.forEach((extraFieldKey) => {
        payload[extraFieldKey] = data.extraFields[extraFieldKey];
      })
    }

    return CLOUD.forSphere(data.sphereId).updateStone(data.cloudId, payload)
      .then(() => {
        // TODO: update location as well.
      })
      .catch((err) => {
        LOG.error("Transfer-Stone: Could not update stone in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    this._injectLocationId(data);

    return transferUtil._handleLocal(
      actions,
      'ADD_STONE',
      { sphereId: data.sphereId, stoneId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalData) {
    this._injectLocationId(data);

    return transferUtil._handleLocal(
      actions,
      'UPDATE_STONE_CONFIG',
      { sphereId: data.sphereId, stoneId: data.localId },
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

};