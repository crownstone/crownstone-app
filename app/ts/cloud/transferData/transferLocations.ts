import { CLOUD } from "../cloudAPI";
import {LOGe} from "../../logging/Log";


import { transferUtil } from "./shared/transferUtil";
import { CodedError } from "../../util/Errors";

let fieldMap : fieldMap = [
  {local: 'name',      cloud: 'name'},
  {local: 'icon',      cloud: 'icon'},
  {local: 'uid',       cloud: 'uid',  cloudToLocalOnly: false},
  {local: 'updatedAt', cloud: 'updatedAt'},
  {local: 'pictureId', cloud:'imageId', cloudToLocalOnly: true},

  // used for local config
  {local: 'cloudId',           cloud: 'id',  cloudToLocalOnly: true },
  {local: 'fingerprintRaw',    cloud: null},
  {local: 'fingerprintParsed', cloud: null},
];

export const transferLocations = {
  fieldMap: fieldMap,

  createOnCloud: function(actions, data : transferNewToCloudData ) {
    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.forSphere(data.cloudSphereId).createLocation(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_LOCATION_CLOUD_ID', sphereId: data.localSphereId, locationId: data.localId, data: { cloudId: result.id, uid: result.uid }});
        return result.id;
      })
      .catch((err) => {
        LOGe.cloud("Transfer-Location: Could not create location in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( data : transferToCloudData ) {
    if (data.cloudId === undefined) {
      return Promise.reject(new CodedError(404,"Can not update in cloud, no cloudId available"));
    }

    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.forSphere(data.cloudSphereId).updateLocation(data.cloudId, payload)
      .then((result) => { })
      .catch((err) => {
        LOGe.cloud("Transfer-Location: Could not update location in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    transferUtil._handleLocal(
      actions,
      'ADD_LOCATION',
      { sphereId: data.localSphereId, locationId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalData) {
    transferUtil._handleLocal(
      actions,
      'UPDATE_LOCATION_CONFIG',
      { sphereId: data.localSphereId, locationId: data.localId },
      data,
      fieldMap
    );
  },


};