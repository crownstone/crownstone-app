import { CLOUD }        from "../cloudAPI";
import {LOG, LOGe} from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";


type transferNewSphereToCloudData = {
  localId: string,
  localData: any,
}
type transferSphereToCloudData = {
  localData: any,
  cloudId : any,
}

type transferNewSphereToLocalData = {
  localId: string,
  cloudData: any,
}
type transferSphereToLocalData = {
  localId: string,
  cloudData: any,
}

let fieldMap : fieldMap = [
  {local:'name',                cloud: 'name'},
  {local:'aiName',              cloud: 'aiName'},
  {local:'aiSex',               cloud: 'aiSex'},
  {local:'exitDelay',           cloud: 'exitDelay'},
  {local:'iBeaconUUID',         cloud: 'uuid'},
  {local:'meshAccessAddress',   cloud: 'meshAccessAddress'},
  {local:'updatedAt',           cloud: 'updatedAt'},

  // keys are set elsewhere
  {local:'adminKey',            cloud:  null },
  {local:'memberKey',           cloud:  null },
  {local:'guestKey',            cloud:  null },

  // used for local
  {local:'cloudId',             cloud:  'id',  cloudToLocalOnly: true  },
];

export const transferSpheres = {
  fieldMap: fieldMap,

  createOnCloud: function (actions, data: transferNewSphereToCloudData) {
    // let payload = {};
    // let localConfig = data.localData.config;
    // transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.createSphere({}, false)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_SPHERE_CLOUD_ID', sphereId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOGe.cloud("Transfer-Sphere: Could not create Sphere in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( data : transferSphereToCloudData ) {
    if (data.cloudId === undefined) {
      return new Promise((resolve,reject) => { reject({status: 404, message:"Can not update in cloud, no cloudId available"}); });
    }


    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.updateSphere(data.cloudId, payload)
      .then(() => {})
      .catch((err) => {
        LOGe.cloud("Transfer-Sphere: Could not update sphere in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferNewSphereToLocalData) {
    // TODO: fix lat/long

    return transferUtil._handleLocal(
      actions,
      'ADD_SPHERE',
      { sphereId: data.localId },
      data,
      fieldMap
    );
  },

  updateLocal: function( actions, data: transferSphereToLocalData) {
    // TODO: fix lat/long

    return transferUtil._handleLocal(
      actions,
      'UPDATE_SPHERE_CONFIG',
      { sphereId: data.localId },
      data,
      fieldMap
    );
  },

};