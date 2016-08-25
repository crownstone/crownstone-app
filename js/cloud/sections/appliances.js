/**
 * Created by alex on 25/08/16.
 */

export const appliances = {

  getAppliances: function (options = {}) {
    return this._setupRequest('GET', '/Appliances', options);
  },

  createAppliance: function (applianceName, groupId) {
    return this._setupRequest(
      'POST',
      'Appliances',
      {data: {name: applianceName, groupId:groupId}},
      'body'
    );
  },

}