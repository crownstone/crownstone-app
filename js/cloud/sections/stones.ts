import {MapProvider} from "../../backgroundProcesses/MapProvider";

export const stones = {
  /**
   * Create a crownstone in the cloud so the major and minor can be generated
   * @param data
   * @returns {*}
   */
  createStone: function(data : any, background = false) {
    return this._setupRequest(
      'POST',
      '/Spheres/{id}/ownedStones/',
      {data:data, background: background},
      'body'
    );
  },


  /**
   * Update a crownstone in the cloud
   * @param localStoneId
   * @param data
   * @param background
   * @returns {*}
   */
  updateStone: function(localStoneId, data, background = true) {
    let cloudStoneId = MapProvider.local2cloudMap.stones[localStoneId] || localStoneId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'PUT',
      '/Spheres/{id}/ownedStones/' + cloudStoneId,
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
  updatePowerUsage: function(data, background = true) {
    return this._setupRequest(
      'POST',
      '/Stones/{id}/currentPowerUsage/',
      { background: background, data: data },
      'body'
    );
  },

  /**
   * Update a current energy usage
   * @param data
   * @param background
   * @returns {*}
   */
  updateBatchPowerUsage: function(data : any[], background = true) {
    return this._setupRequest(
      'POST',
      '/Stones/{id}/batchPowerUsage/',
      { background: background, data: data },
      'body'
    );
  },


  /**
   * Update the link from a crownstone to a room.
   * @param localLocationId
   * @param localSphereId
   * @param updatedAt
   * @param background
   * @param doNotSetUpdatedTimes
   * @returns {*}
   */
  updateStoneLocationLink: function(localLocationId, localSphereId, updatedAt, background = true, doNotSetUpdatedTimes = false) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
        'PUT',
        '/Stones/{id}/locations/rel/' + cloudLocationId,
        {background: background},
      )
      .then(() => {
        if (doNotSetUpdatedTimes !== true) {
          let promises = [];
          promises.push(this.forSphere(localSphereId).updateStone(this._stoneId,      {updatedAt: updatedAt}));
          promises.push(this.forSphere(localSphereId).updateLocation(localLocationId, {updatedAt: updatedAt}));
          // we set the updatedAt time in the cloud since changing the links does not update the time there
          return Promise.all(promises);
        }
      })
  },


  /**
   * Delete the link from a crownstone to a room.
   * @param localLocationId
   * @param localSphereId
   * @param updatedAt
   * @param background
   * @returns {*}
   */
  deleteStoneLocationLink: function(localLocationId, localSphereId, updatedAt, background = true) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
        'DELETE',
        '/Stones/{id}/locations/rel/' + cloudLocationId,
        {background: background},
      )
      .then(() => {
        let promises = [];
        promises.push(this.forSphere(localSphereId).updateStone(this._stoneId, {updatedAt: updatedAt}));
        promises.push(this.forSphere(localSphereId).updateLocation(localLocationId, {updatedAt: updatedAt}));
        // we set the updatedAt time in the cloud since changing the links does not update the time there
        return Promise.all(promises);
      })
  },




  /**
   * request the data of all crownstones in this sphere
   * @returns {*}
   */
  getStonesInSphere: function(background = true) {
    return this._setupRequest(
      'GET',
      '/Spheres/{id}/ownedStones',
      {background: background, data: {filter:{"include":["schedules", "locations"]}}}
    );
  },


  /**
   * request the data from this crownstone in the cloud
   * @param localStoneId  database id of crownstone
   * @returns {*}
   */
  getStone: function(localStoneId) {
    let cloudStoneId = MapProvider.local2cloudMap.stones[localStoneId] || localStoneId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'GET',
      '/Stones/' + cloudStoneId
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
  deleteStone: function(localStoneId) {
    let cloudStoneId = MapProvider.local2cloudMap.stones[localStoneId] || localStoneId; // the OR is in case a cloudId has been put into this method.
    if (cloudStoneId) {
      return this._setupRequest(
        'DELETE',
        '/Spheres/{id}/ownedStones/' + cloudStoneId
      );
    }
  },


};