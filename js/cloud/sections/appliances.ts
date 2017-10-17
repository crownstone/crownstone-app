/**
 * Created by alex on 25/08/16.
 */
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {cloudApiBase} from "./cloudApiBase";

export const appliances = {

  getAppliancesInSphere: function(background = true) {
    return cloudApiBase._setupRequest('GET', '/Spheres/{id}/ownedAppliances', background);
  },

  createAppliance: function (data, background = false) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Spheres/{id}/ownedAppliances',
      {data: data},
      'body'
    );
  },

  updateAppliance: function (localApplianceId, data, background = true) {
    let cloudApplianceId = MapProvider.local2cloudMap.appliances[localApplianceId] || localApplianceId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'PUT',
      '/Spheres/{id}/ownedAppliances/' + cloudApplianceId,
      {background: background, data: data},
      'body'
    );
  },

  deleteAppliance: function (localApplianceId) {
    let cloudApplianceId = MapProvider.local2cloudMap.appliances[localApplianceId] || localApplianceId; // the OR is in case a cloudId has been put into this method.
    if (cloudApplianceId) {
      return cloudApiBase._setupRequest(
        'DELETE',
        '/Spheres/{id}/ownedAppliances/' + cloudApplianceId,
      );
    }
  },

};