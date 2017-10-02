import { CLOUD } from "../cloudAPI";
import { LOG }   from "../../logging/Log";


import { transferUtil } from "./shared/transferUtil";

let fieldMap : fieldMap = [
  {local: 'name',      cloud: 'name'},
  {local: 'icon',      cloud: 'icon'},
  {local: 'cloudId',   cloud:  null},
  {local: 'updatedAt', cloud: 'updatedAt'},

  // used for local config
  {local: 'cloudId',           cloud: 'id' ,  cloudToLocalOnly: true },
  {local: 'fingerprintRaw',    cloud: null},
  {local: 'fingerprintParsed', cloud: null},
];

export const transferLocations = {

  createOnCloud: function( actions, data : transferToCloudData ) {
    let payload = {};
    payload['sphereId'] = data.sphereId;

    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.forSphere(data.sphereId).createLocation(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_LOCATION_CLOUD_ID', sphereId: data.sphereId, locationId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOG.error("Transfer-Location: Could not create location in cloud", err);
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

    return CLOUD.forSphere(data.sphereId).updateLocation(data.cloudId, payload)
      .then((result) => { })
      .catch((err) => {
        LOG.error("Transfer-Location: Could not update location in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    return transferUtil._handleLocal(
      actions,
      'ADD_LOCATION',
      { sphereId: data.sphereId, locationId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalData) {
    return transferUtil._handleLocal(
      actions,
      'UPDATE_LOCATION_CONFIG',
      { sphereId: data.sphereId, locationId: data.localId },
      data,
      fieldMap
    );
  },



};