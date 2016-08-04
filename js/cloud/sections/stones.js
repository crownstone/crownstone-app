export const stones = {
  /**
   * Create a crownstone in the cloud so the major and minor can be generated
   * @param groupId
   * @param MacAddress
   * @returns {*}
   */
  createStone: function(groupId, MacAddress) {
    return this._setupRequest(
      'POST',
      '/Stones',
      {data:{groupId:groupId, address:MacAddress}},
      'body'
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
}