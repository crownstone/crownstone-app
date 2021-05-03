import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { cloudApiBase, TokenStore } from "./cloudApiBase";
import { CLOUD } from "../cloudAPI";

export const stones = {
  /**
   * Create a crownstone in the cloud so the major and minor can be generated
   * @param data
   * @param background
   * @returns {*}
   */
  createStone: function(data : any, background = true) {
    return cloudApiBase._setupRequest(
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
    return cloudApiBase._setupRequest(
      'PUT',
      '/Spheres/{id}/ownedStones/' + cloudStoneId,
      {background: background, data: data},
      'body'
    );
  },

  /**
   * Update a crownstone in the cloud
   * @param switchState
   * @param background
   * @returns {*}
   */
  updateStoneSwitchState: function(switchState, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Stones/{id}/currentSwitchState?switchState='  + switchState,
      {background: background},
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
    return cloudApiBase._setupRequest(
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
    return cloudApiBase._setupRequest(
      'POST',
      '/Stones/{id}/batchPowerUsage/',
      { background: background, data: data },
      'body'
    );
  },



  /**
   * request the data of all crownstones in this sphere
   * @returns {*}
   */
  getStonesInSphere: function(background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Spheres/{id}/ownedStones',
      {background: background, data: {filter:{"include":[{"abilities":"properties"}, "behaviours"]}}}
    );
  },


  /**
   * request the data from this crownstone in the cloud
   * @param localStoneId  database id of crownstone
   * @returns {*}
   */
  getStone: function(localStoneId) {
    let cloudStoneId = MapProvider.local2cloudMap.stones[localStoneId] || localStoneId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
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
    return cloudApiBase._setupRequest(
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
      return cloudApiBase._setupRequest(
        'DELETE',
        '/Spheres/{id}/ownedStones/' + cloudStoneId
      );
    }
  },

};