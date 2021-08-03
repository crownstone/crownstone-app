import { CLOUD } from "../cloudAPI";
import {LOGe} from "../../logging/Log";


import { transferUtil } from "./shared/transferUtil";
import { PICTURE_GALLERY_TYPES } from "../../views/scenesViews/ScenePictureGallery";
import { CodedError } from "../../util/Errors";

let fieldMap : fieldMap = [
  {local: 'name',          cloud: 'name'},
  {local: 'updatedAt',     cloud: 'updatedAt'},
  {local: 'data',          cloud: 'data'},
  {local: 'pictureId',     cloud: 'customPictureId',       cloudToLocalOnly: true},
  {local: 'picture',       cloud: 'stockPictureAvailable', cloudToLocalOnly: true, onlyIfValue: true }, // this is added to the cloudData afterwards if there is a stockPicture.
  {local: 'pictureSource', cloud: 'pictureSource',         cloudToLocalOnly: true, onlyIfValue: true },

  {local: 'stockPicture', cloud: 'stockPicture',           localToCloudOnly: true, onlyIfValue: true }, // this is added to the cloudData afterwards if there is a stockPicture.


  // used for local config
  {local: 'cloudId',   cloud: 'id',  cloudToLocalOnly: true },
];

export const transferScenes = {
  fieldMap: fieldMap,

  createOnCloud: function(actions, data : transferNewToCloudData ) {
    let payload = {};
    let localData = data.localData;

    transferUtil.fillFieldsForCloud(payload, localData, fieldMap);
    if (data.localData.pictureSource === PICTURE_GALLERY_TYPES.STOCK) {
      payload["stockPicture"] = data.localData.picture;
    }

    return CLOUD.forSphere(data.cloudSphereId).createScene(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_SCENE_CLOUD_ID', sphereId: data.localSphereId, sceneId: data.localId, data: { cloudId: result.id }});
        return result.id;
      })
      .catch((err) => {
        LOGe.cloud("Transfer-Scene: Could not create scene in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( data : transferToCloudData ) {
    if (data.cloudId === undefined) {
      return Promise.reject(new CodedError(404,"Can not update in cloud, no cloudId available"));
    }

    if (data.localData.pictureSource === PICTURE_GALLERY_TYPES.STOCK) {
      data.localData['stockPicture'] = data.localData.picture;
    }
    else {
      data.localData['stockPicture'] = null;
    }

    let payload = {};
    let localData = data.localData;
    transferUtil.fillFieldsForCloud(payload, localData, fieldMap);

    return CLOUD.forSphere(data.cloudSphereId).updateScene(data.cloudId, payload)
      .then((result) => { })
      .catch((err) => {
        LOGe.cloud("Transfer-Scene: Could not update scene in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    if (data.cloudData.stockPicture !== null) {
      data.cloudData["stockPictureAvailable"] = data.cloudData.stockPicture;
      data.cloudData["pictureSource"]         = PICTURE_GALLERY_TYPES.STOCK;
    }

    // the custom picture will be downloaded elsewhere.
    transferUtil._handleLocal(
      actions,
      'ADD_SCENE',
      { sphereId: data.localSphereId, sceneId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalData) {
    if (data.cloudData.stockPicture !== null) {
      data.cloudData["stockPictureAvailable"] = data.cloudData.stockPicture;
      data.cloudData["pictureSource"]         = PICTURE_GALLERY_TYPES.STOCK;
    }

    transferUtil._handleLocal(
      actions,
      'UPDATE_SCENE',
      { sphereId: data.localSphereId, sceneId: data.localId },
      data,
      fieldMap
    );
  },
};