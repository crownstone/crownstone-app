import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { cloudApiBase, TokenStore } from "./cloudApiBase";
import { CLOUD } from "../cloudAPI";

export const scenes = {
  createScene: function(data : any, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Spheres/{id}/scenes/',
      {data:data, background: background},
      'body'
    );
  },

  updateScene: function(localSceneId, data, background = true) {
    let cloudSceneId = MapProvider.local2cloudMap.scenes[localSceneId] || localSceneId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'PUT',
      '/Scenes/' + cloudSceneId,
      {background: background, data: data},
      'body'
    );
  },

  getScenesInSphere: function(background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Spheres/{id}/scenes',
      {background: background}
    );
  },


  getScene: function(localSceneId) {
    let cloudSceneId = MapProvider.local2cloudMap.scenes[localSceneId] || localSceneId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'GET',
      '/Scenes/' + cloudSceneId
    );
  },


  deleteScene: function(localSceneId) {
    let cloudSceneId = MapProvider.local2cloudMap.scenes[localSceneId] || localSceneId; // the OR is in case a cloudId has been put into this method.
    if (cloudSceneId) {
      return cloudApiBase._setupRequest(
        'DELETE',
        '/Spheres/{id}/scenes/' + cloudSceneId
      );
    }
  },


  downloadSceneCustomPicture: function(toPath) {
    return cloudApiBase._download({endPoint:'/Scenes/{id}/customImage'}, toPath);
  },

  uploadSceneCustomPicture: function(file: string) {
    return cloudApiBase._uploadImage({endPoint:'/Scenes/{id}/customImage', path:file, type:'body'})
  },

  deleteSceneCustomPicture: function() {
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Scenes/{id}/customImage/'
    );
  },




};