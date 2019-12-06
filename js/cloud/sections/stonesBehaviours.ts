import { cloudApiBase } from "./cloudApiBase";
import { MapProvider } from "../../backgroundProcesses/MapProvider";

export const stonesBehaviours = {

  createBehaviour: function(data, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Stones/{id}/behaviours/',
      {data: data, background: background},
      'body'
    );
  },
  updateBehaviour: function(localBehaviourId, data, background = true) {
    let cloudBehaviourId = MapProvider.local2cloudMap.behaviours[localBehaviourId] || localBehaviourId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'PUT',
      '/Stones/{id}/behaviours/' + cloudBehaviourId,
      {data:data, background: background},
      'body'
    );
  },
  deleteBehaviour: function(localBehaviourId, background = true) {
    console.log("HERE", localBehaviourId, MapProvider.local2cloudMap)
    let cloudBehaviourId = MapProvider.local2cloudMap.behaviours[localBehaviourId] || localBehaviourId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Stones/{id}/behaviours/' + cloudBehaviourId,
      {background: background},
    );
  },
  deleteAllBehaviours: function(background = true) {
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Stones/{id}/behaviours/',
      {background: background},
    );
  },
  getBehaviours: function(background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Stones/{id}/behaviours/',
      {background: background},
    );
  },


};