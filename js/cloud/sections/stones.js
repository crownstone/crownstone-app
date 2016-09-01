export const stones = {
  /**
   * Create a crownstone in the cloud so the major and minor can be generated
   * @param groupId
   * @param MACAddress
   * @returns {*}
   */
  createStone: function(groupId, MACAddress, type) {
    return this._setupRequest(
      'POST',
      '/Stones',
      {data:{groupId:groupId, address:MACAddress, type:type}},
      'body'
    );
  },


  /**
   * Update a crownstone in the cloud
   * @param data
   * @param background
   * @returns {*}
   */
  updateStone: function(data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Stones',
      {background: background, data:data},
      'body'
    );
  },



  /**
   * request the data of all crownstones in this group
   * @returns {*}
   */
  getStonesInGroup: function() {
    return this._setupRequest(
      'GET',
      '/Groups/{id}/ownedStones'
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
      '/Stones/',
      {data:{where:{address:address}}},
      'query'
    );
  },

  /**
   * Delete the data from this crownstone in the cloud in case of a failed setup or factory reset.
   * stoneId  database id of crownstone
   * @returns {*}
   */
  deleteStone: function(stoneId) {
    return this._setupRequest(
      'DELETE',
      '/Stones/' + stoneId
    );
  },
};