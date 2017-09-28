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

  // used for local config
  {local: 'cloudId',            cloud:  null },
  {local: 'nearThreshold',      cloud:  null },
  {local: 'rssi',               cloud:  null },
  {local: 'disabled',           cloud:  null },
  {local: 'dfuResetRequired',   cloud:  null },
  {local: 'handle',             cloud:  null },
  {local: 'locationId',         cloud:  null },
];

export const transferStones = {

  createOnCloud: function( actions, data : transferData ) {
    let payload = {};
    payload['sphereId'] = data.sphereId;
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);

    return CLOUD.forSphere(data.sphereId).createStone(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_STONE_CONFIG', sphereId: data.sphereId, stoneId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOG.error("Transfer-Stone: Could not create stone in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( actions, data : transferData ) {
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
      .then(() => {})
      .catch((err) => {
        LOG.error("Transfer-Stone: Could not update stone in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferData) {
    return transferUtil._handleLocal(
      actions,
      'ADD_STONE',
      { sphereId: data.sphereId, stoneId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferData) {
    return transferUtil._handleLocal(
      actions,
      'UPDATE_STONE_CONFIG',
      { sphereId: data.sphereId, stoneId: data.localId },
      data,
      fieldMap
    );
  },

};