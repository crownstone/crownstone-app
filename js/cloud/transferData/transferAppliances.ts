import { CLOUD }        from "../cloudAPI";
import {LOGe} from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";
import { Permissions } from "../../backgroundProcesses/PermissionManager";

let fieldMap : fieldMap = [
  {local: 'name',           cloud: 'name'   },
  {local: 'icon',           cloud: 'icon'   },
  {local: 'hidden',         cloud: 'hidden' },
  {local: 'locked',         cloud: 'locked' },
  {local: 'onlyOnWhenDark', cloud: 'onlyOnWhenDark'},
  {local: 'updatedAt',      cloud: 'updatedAt' },
  {local: 'json',           cloud: 'json',  localToCloudOnly: true},
  {local: 'dimmable',       cloud:  null    },
  {local: 'cloudId',        cloud:  'id' ,  cloudToLocalOnly: true    },
];

export const transferAppliances = {
  fieldMap: fieldMap,

  createOnCloud: function( actions, data : transferNewToCloudData ) {
    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    if (Permissions.inSphere(data.localSphereId).setBehaviourInCloud && data.localData.behaviour) {
      payload['json'] = JSON.stringify(data.localData.behaviour);
    }

    return CLOUD.forSphere(data.cloudSphereId).createAppliance(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_APPLIANCE_CLOUD_ID', sphereId: data.localSphereId, applianceId: data.localId, data: { cloudId: result.id }});
        return result.id;
      })
      .catch((err) => {
        LOGe.cloud("Transfer-Appliance: Could not create Appliance in cloud", err);
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

    return CLOUD.forSphere(data.cloudSphereId).updateAppliance(data.cloudId, payload)
      .then(() => {})
      .catch((err) => {
        LOGe.cloud("Transfer-Appliance: Could not update Appliance in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    transferUtil._handleLocal(
      actions,
      'ADD_APPLIANCE',
      { sphereId: data.localSphereId, applianceId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalData) {
    transferUtil._handleLocal(
      actions,
      'UPDATE_APPLIANCE_CONFIG',
      { sphereId: data.localSphereId, applianceId: data.localId },
      data,
      fieldMap
    );
  },

  // todo: create new

};