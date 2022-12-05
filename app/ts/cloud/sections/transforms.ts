import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { cloudApiBase } from "./cloudApiBase";
import {CloudAddresses} from "../../backgroundProcesses/indirections/CloudAddresses";

export const transforms = {

  requestTransformSession: function (localSphereId: string, deviceType: string, targetUserId: string, targetDeviceType: string, background = true) : Promise<uuid> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + `spheres/${cloudSphereId}/transform`,
      {data: {userDeviceType:deviceType, targetUserId: targetUserId, targetDeviceType:targetDeviceType}, background: background},
      'query'
    );
  },

  endTransformSession: function (localSphereId: string, transformId: uuid, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'DELETE',
      CloudAddresses.cloud_v2 + `spheres/${cloudSphereId}/transform/${transformId}`,
      {background: background},
      'body'
    );
  },

  joinTransformSession: function (localSphereId: string, transformId: uuid, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + `spheres/${cloudSphereId}/transform/${transformId}/join`,
      {background: background},
      'body'
    );
  },


  finalizeTransformSession: function (localSphereId: string, transformId: uuid, background = true) : Promise<{sessionId: uuid, fromDevice: string, toDevice: string, transform: TransformSet}[]> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + `spheres/${cloudSphereId}/transform/${transformId}/finalize`,
      {background: background},
      'body'
    );
  },

  getTransformSessionResult: function (localSphereId: string, transformId: uuid, background = true) : Promise<{sessionId: uuid, fromDevice: string, toDevice: string, transform: TransformSet}[]>  {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'GET',
      CloudAddresses.cloud_v2 + `spheres/${cloudSphereId}/transform/${transformId}/result`,
      {background: background},
      'body'
    );
  },

  startTransformCollectionSession: function (localSphereId: string, transformId: uuid, background = true) : Promise<uuid>{
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + `spheres/${cloudSphereId}/transform/${transformId}/collection`,
      {background: background},
      'body'
    );
  },

  postTransformCollectionSessionData: function (localSphereId: string, transformId: uuid, collectionId: uuid, data: MeasurementMap, background = true) : Promise<uuid>{
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + `spheres/${cloudSphereId}/transform/${transformId}/collection/${collectionId}/data`,
      {data: {data}, background: background},
      'body'
    );
  }
};