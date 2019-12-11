import { CLOUD }        from "../cloudAPI";
import {LOGe} from "../../logging/Log";
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
  {local:'name',               cloud: 'name'},
  {local:'aiName',             cloud: 'aiName'},
  {local:'aiSex',              cloud: 'aiSex'},
  {local:'exitDelay',          cloud: 'exitDelay'},
  {local:'iBeaconUUID',        cloud: 'uuid',             },
  {local:'meshAccessAddress',  cloud: 'meshAccessAddress',},
  {local:'updatedAt',          cloud: 'updatedAt'},

  // used for local
  {local:'uid',                cloud: 'uid',  cloudToLocalOnly: true },
  {local:'cloudId',            cloud:  'id',  cloudToLocalOnly: true },
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
      return Promise.reject({status: 404, message:"Can not update in cloud, no cloudId available"});
    }


    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    if (localConfig.latitude && localConfig.longitude) {
      payload['gpsLocation'] = {lat:localConfig.latitude, lng: localConfig.longitude}
    }

    return CLOUD.updateSphere(data.cloudId, payload)
      .then(() => {})
      .catch((err) => {
        LOGe.cloud("Transfer-Sphere: Could not update sphere in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferNewSphereToLocalData) {
    transferUtil._handleLocal(
      actions,
      'ADD_SPHERE',
      { sphereId: data.localId },
      data,
      fieldMap
    );

    if (data.cloudData.gpsLocation && data.cloudData.gpsLocation.lat && data.cloudData.gpsLocation.lng) {
      actions.push({type:"SET_SPHERE_GPS_COORDINATES", sphereId:data.localId, data:{ latitude:data.cloudData.gpsLocation.lat, longitude:data.cloudData.gpsLocation.lng, updatedAt: data.cloudData.updatedAt }});
    }
  },

  updateLocal: function( actions, data: transferSphereToLocalData) {
    transferUtil._handleLocal(
      actions,
      'UPDATE_SPHERE_CONFIG',
      { sphereId: data.localId },
      data,
      fieldMap
    );

    if (data.cloudData.gpsLocation && data.cloudData.gpsLocation.lat && data.cloudData.gpsLocation.lng) {
      actions.push({type:"SET_SPHERE_GPS_COORDINATES", sphereId:data.localId, data:{ latitude:data.cloudData.gpsLocation.lat, longitude:data.cloudData.gpsLocation.lng, updatedAt: data.cloudData.updatedAt }});
    }
  },

};