export const locations = {
  getLocations: function (background = false) {
    return this._setupRequest('GET', '/Spheres/{id}/ownedLocations', {background: background, data:{filter:{"include":"presentPeople"}}});
  },

  createLocation: function (data, background = false) {
    return this._setupRequest(
      'POST',
      '/Spheres/{id}/ownedLocations',
      {data: data, background: background},
      'body'
    );
  },

  updateLocation: function (locationId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Spheres/{id}/ownedLocations/' + locationId,
      {background: background, data: data},
      'body'
    );
  },


  deleteLocation: function(locationId) {
    return this._setupRequest(
      'DELETE',
      '/Spheres/{id}/ownedLocations/' + locationId
    );
  }
};