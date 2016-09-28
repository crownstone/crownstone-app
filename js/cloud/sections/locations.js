export const locations = {
  getLocations: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/ownedLocations', options);
  },

  createLocation: function (locationName, icon) {
    return this._setupRequest(
      'POST',
      '/Groups/{id}/ownedLocations',
      {data: {name: locationName, icon:icon}},
      'body'
    );
  },

  updateLocation: function (locationId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Groups/{id}/ownedLocations/' + locationId,
      {background: background, data: data},
      'body'
    );
  },


  deleteLocation: function(locationId) {
    return this._setupRequest(
      'DELETE',
      '/Groups/{id}/ownedLocations/' + locationId
    );
  }
};