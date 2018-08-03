/**
 * Created by alex on 25/08/16.
 */

export const preferences = {

  getPreferences: function (background = true) {
    return this._setupRequest(
      'GET',
      '/Devices/{id}/preferences',
      {background: background},
      'query'
    );
  },

  createPreference: function (data, background = true) {
    return this._setupRequest(
      'POST',
      '/Devices/{id}/preferences',
      {data: data, background: background},
      'body'
    );
  },

  updatePreference: function (preferenceCloudId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Devices/{id}/preferences/' + preferenceCloudId,
      {data: data, background: background},
      'body'
    );
  },

  deletePreference: function (preferenceCloudId, background = true) {
    return this._setupRequest(
      'DELETE',
      '/Devices/{id}/preferences/' + preferenceCloudId,
      { background: background },
      'body'
    );
  },
};