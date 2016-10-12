/**
 * Created by alex on 25/08/16.
 */

export const appliances = {

  getAppliancesInSphere: function(options) {
    return this._setupRequest('GET', '/Spheres/{id}/ownedAppliances', options);
  },

  createAppliance: function (applianceName, sphereId, icon) {
    return this._setupRequest(
      'POST',
      '/Spheres/{id}/ownedAppliances',
      {data: {name: applianceName, sphereId:sphereId, icon: icon}},
      'body'
    );
  },

  updateAppliance: function (applianceId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Spheres/{id}/ownedAppliances/' + applianceId,
      {background: background, data: data},
      'body'
    );
  },

  deleteAppliance: function (applianceId) {
    if (applianceId) {
      return this._setupRequest(
        'DELETE',
        '/Spheres/{id}/ownedAppliances/' + applianceId,
      );
    }
  },

};