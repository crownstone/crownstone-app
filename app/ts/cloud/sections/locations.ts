import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { cloudApiBase } from "./cloudApiBase";

export const locations = {
  getLocations: function (background = true) {
    return cloudApiBase._setupRequest('GET', '/Spheres/{id}/ownedLocations', {background: background, data:{filter:{"include":["sphereOverviewPosition","presentPeople"]}}});
  },

  createLocation: function (data, background = true) {
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

  updateLocationPosition: function (data, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Locations/{id}/sphereOverviewPosition/',
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
  },

  downloadLocationPicture: function(toPath) {
    return cloudApiBase._download({endPoint:'/Locations/{id}/image'}, toPath);
  },

  uploadLocationPicture: function(file: string) {
    return cloudApiBase._uploadImage({endPoint:'/Locations/{id}/image', path:file, type:'body'})
  },

  deleteLocationPicture: function() {
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Locations/{id}/image/'
    );
  },
};