import { cloudApiBase } from "./cloudApiBase";
import { MapProvider } from "../../backgroundProcesses/MapProvider";

export const stonesBehaviours = {

  createBehaviour: function(data, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Stones/{id}/behaviour/',
      {data: data, background: background},
      'body'
    );
  },
  updateBehaviour: function(localBehaviourId, data, background = true) {
    let cloudBehaviourId = MapProvider.local2cloudMap.behaviours[localBehaviourId] || localBehaviourId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'PUT',
      '/Stones/{id}/behaviour/' + cloudBehaviourId,
      {data:data, background: background},
      'body'
    );
  },
  deleteBehaviour: function(localBehaviourId, background = true) {
    let cloudBehaviourId = MapProvider.local2cloudMap.behaviours[localBehaviourId] || localBehaviourId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Stones/{id}/behaviour/' + cloudBehaviourId,
      {background: background},
    );
  },
  getBehaviours: function(background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Stones/{id}/behaviour/',
      {background: background},
    );
  },


};