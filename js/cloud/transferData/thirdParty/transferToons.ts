import { CLOUD } from "../../cloudAPI";
import {LOG, LOGe} from "../../../logging/Log";


import { transferUtil } from "../shared/transferUtil";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";

let fieldMap : fieldMap = [
  {local: 'toonAgreementId',    cloud: 'toonAgreementId'},
  {local: 'toonAddress',        cloud: 'toonAddress'},

  {local: 'schedule',            cloud: 'schedule', cloudToLocalOnly: true},
  {local: 'updatedScheduleTime', cloud: 'updatedScheduleTime', cloudToLocalOnly: true},

  {local: 'cloudChangedProgramTime', cloud: 'changedProgramTime', cloudToLocalOnly: true},

  // used for local config
  {local: 'cloudId',            cloud: 'id' ,  cloudToLocalOnly: true },
  {local: 'updatedAt',          cloud: 'updatedAt'},
];

export const transferToons = {
  fieldMap: fieldMap,

  createOnCloud: function( actions, data : transferNewToCloudData ) {
    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.forSphere(data.cloudSphereId).thirdParty.createToonInCrownstoneCloud(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_TOON_CLOUD_ID', sphereId: data.localSphereId, locationId: data.localId, data: { cloudId: result.id }});
        return result.id;
      })
      .catch((err) => {
        LOGe.cloud("Transfer-Toon: Could not create Toon in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( data : transferToCloudData ) {
    if (!Permissions.inSphere(data.localSphereId).setToonInCloud) { return new Promise((resolve, reject) => { resolve() })}

    if (data.cloudId === undefined) {
      return new Promise((resolve,reject) => { reject({status: 404, message:"Can not update in cloud, no cloudId available"}); });
    }

    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.forSphere(data.cloudSphereId).thirdParty.updateToonInCrownstoneCloud(data.cloudId, payload)
      .then((result) => {})
      .catch((err) => {
        LOGe.cloud("Transfer-Location: Could not update location in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    transferUtil._handleLocal(
      actions,
      'ADD_TOON',
      { sphereId: data.localSphereId, toonId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalData) {
    // enabled is per user, do not update this field.
    delete data['enabled'];
    transferUtil._handleLocal(
      actions,
      'UPDATE_TOON',
      { sphereId: data.localSphereId, toonId: data.localId },
      data,
      fieldMap
    );
  },

};