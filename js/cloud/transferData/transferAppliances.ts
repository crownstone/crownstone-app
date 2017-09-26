import { CLOUD }        from "../cloudAPI";
import { LOG }          from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";

let fieldMap : fieldMap = [
  {local:'name',           cloud: 'name'   },
  {local:'icon',           cloud: 'icon'   },
  {local:'hidden',         cloud: 'hidden' },
  {local:'locked',         cloud: 'locked' },
  {local:'onlyOnWhenDark', cloud: 'onlyOnWhenDark'},
  {local:'updatedAt',      cloud: 'updatedAt' },

  {local:'dimmable',       cloud:  null    },
  {local:'cloudId',        cloud:  null    },
];

export const transferAppliances = {

  createOnCloud: function( actions, data : transferData ) {
    let payload = {};
    payload['sphereId'] = data.sphereId;
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);

    CLOUD.forSphere(data.sphereId).createAppliance(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_APPLIANCE_CONFIG', sphereId: data.sphereId, applianceId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOG.error("Transfer-Appliance: Could not create location in cloud", err);
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

    return CLOUD.forSphere(data.sphereId).updateAppliance(data.cloudId, payload)
      .then(() => {})
      .catch((err) => {
        LOG.error("Transfer-Appliance: Could not update location in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferData) {
    return transferUtil._handleLocal(
      actions,
      'ADD_APPLIANCE',
      { sphereId: data.sphereId, applianceId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferData) {
    return transferUtil._handleLocal(
      actions,
      'UPDATE_APPLIANCE_CONFIG',
      { sphereId: data.sphereId, applianceId: data.localId },
      data,
      fieldMap
    );
  },

};