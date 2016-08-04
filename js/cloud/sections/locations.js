export const locations = {
  getLocations: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/ownedLocations', options);
  },

  createLocation: function (locationName) {
    return this._setupRequest(
      'POST',
      'Groups/{id}/ownedLocations',
      {data: {name: locationName}},
      'body'
    );
  },
}