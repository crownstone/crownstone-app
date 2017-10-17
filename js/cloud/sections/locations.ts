import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {cloudApiBase} from "./cloudApiBase";

export const locations = {
  getLocations: function (background = false) {
    return cloudApiBase._setupRequest('GET', '/Spheres/{id}/ownedLocations', {background: background, data:{filter:{"include":"presentPeople"}}});
  },

  createLocation: function (data, background = false) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Spheres/{id}/ownedLocations',
      {data: data, background: background},
      'body'
    );
  },

  updateLocation: function (localLocationId, data, background = true) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'PUT',
      '/Spheres/{id}/ownedLocations/' + cloudLocationId,
      {background: background, data: data},
      'body'
    );
  },


  deleteLocation: function(localLocationId) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Spheres/{id}/ownedLocations/' + cloudLocationId
    );
  }
};