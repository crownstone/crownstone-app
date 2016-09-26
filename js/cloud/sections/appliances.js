/**
 * Created by alex on 25/08/16.
 */

export const appliances = {

  getAppliances: function (options = {}) {
    return this._setupRequest('GET', '/Appliances', options);
  },

  getAppliancesInSphere: function(options) {
    // TODO: change to sphere owned query when it becomes available
    return this._setupRequest('GET', '/Appliances', options);
  },

  createAppliance: function (applianceName, sphereId, icon) {
    return this._setupRequest(
      'POST',
      '/Appliances',
      {data: {name: applianceName, groupId:sphereId, icon: icon}},
      'body'
    );
  },

  updateAppliance: function (data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Appliances',
      {background: background, data: data},
      'body'
    );
  },

  deleteAppliance: function (applianceId) {
    return this._setupRequest(
      'DELETE',
      '/Appliances/' + applianceId,
    );
  },

};