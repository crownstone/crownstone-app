export const stones = {
  /**
   * Create a crownstone in the cloud so the major and minor can be generated
   * @param sphereId
   * @param MACAddress
   * @param type
   * @returns {*}
   */
  createStone: function(sphereId, MACAddress, type) {
    return this._setupRequest(
      'POST',
      '/Spheres/{id}/ownedStones/',
      {data:{sphereId:sphereId, address:MACAddress, type:type}},
      'body'
    );
  },


  /**
   * Update a crownstone in the cloud
   * @param stoneId
   * @param data
   * @param background
   * @returns {*}
   */
  updateStone: function(stoneId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Spheres/{id}/ownedStones/' + stoneId,
      {background: background, data:data},
      'body'
    );
  },

  /**
   * Update a current energy usage
   * @param data
   * @param background
   * @returns {*}
   */
  updateUsage: function(data, background = true) {
    return this._setupRequest(
      'POST',
      '/Stones/{id}/currentEnergyUsage/',
      { background: background, data: data },
      'body'
    );
  },


  /**
   * Update the link from a crownstone to a room.
   * @param locationId
   * @param sphereId
   * @param updatedAt
   * @param background
   * @returns {*}
   */
  updateStoneLocationLink: function(locationId, sphereId, updatedAt, background = true, doNotSetUpdatedTimes = false) {
    return this._setupRequest(
        'PUT',
        '/Stones/{id}/locations/rel/' + locationId,
        {background: background},
      )
      .then(() => {
        if (doNotSetUpdatedTimes !== true) {
          let promises = [];
          promises.push(this.forSphere(sphereId).updateStone(this._stoneId, {updatedAt: updatedAt}));
          promises.push(this.forSphere(sphereId).updateLocation(locationId, {updatedAt: updatedAt}));
          // we set the updatedAt time in the cloud since changing the links does not update the time there
          return Promise.all(promises);
        }
      })
  },


  /**
   * Delete the link from a crownstone to a room.
   * @param locationId
   * @param sphereId
   * @param updatedAt
   * @param background
   * @returns {*}
   */
  deleteStoneLocationLink: function(locationId, sphereId, updatedAt, background = true) {
    let stoneId = this._stoneId;
    return this._setupRequest(
        'DELETE',
        '/Stones/' + stoneId + '/locations/rel/' + locationId,
        {background: background},
      )
      .then(() => {
        let promises = [];
        promises.push(this.forSphere(sphereId).updateStone(stoneId, {updatedAt: updatedAt}));
        promises.push(this.forSphere(sphereId).updateLocation(locationId, {updatedAt: updatedAt}));
        // we set the updatedAt time in the cloud since changing the links does not update the time there
        return Promise.all(promises);
      })
  },




  /**
   * request the data of all crownstones in this sphere
   * @returns {*}
   */
  getStonesInSphere: function(options = {}) {
    return this._setupRequest(
      'GET',
      '/Spheres/{id}/ownedStones',
      {...options, data: {filter:{"include":{"relation":"locations"}}}}
    );
  },


  /**
   * request the data from this crownstone in the cloud
   * @param stoneId  database id of crownstone
   * @returns {*}
   */
  getStone: function(stoneId) {
    return this._setupRequest(
      'GET',
      '/Stones/' + stoneId
    );
  },


  /**
   * search for crownstone with this mac address
   * @param address  mac address
   * @returns {*}
   */
  findStone: function(address) {
    return this._setupRequest(
      'GET',
      '/Spheres/{id}/ownedStones/',
      {data:{filter:{where:{address:address}}}},
      'query'
    );
  },

  /**
   * Delete the data from this crownstone in the cloud in case of a failed setup or factory reset.
   * stoneId  database id of crownstone
   * @returns {*}
   */
  deleteStone: function(stoneId) {
    if (stoneId) {
      return this._setupRequest(
        'DELETE',
        '/Spheres/{id}/ownedStones/' + stoneId
      );
    }
  },
};