export const MeshUtil = {

  /**
   * Returns an array of all the stones in the mesh network, optionally filtered for matching an rssi threshold.
   * @param state
   * @param sphereId
   * @param meshNetworkId
   * @param rssiThreshold
   * @returns {Array}
   */
  getStonesInNetwork: function(state, sphereId, meshNetworkId, rssiThreshold = null) {
    if (meshNetworkId === null) {
      return [];
    }

    let sphere = state.spheres[sphereId];
    let stoneIds = Object.keys(sphere.stones);

    let result = [];

    for (let i = 0; i < stoneIds.length; i++) {
      let stone = sphere.stones[stoneIds[i]];
      if (stone.config.meshNetworkId === meshNetworkId) {
        // allow this method to be used to filter for specific rssi requirements on the mesh network.
        if (rssiThreshold !== null) {
          if (stone.config.disabled === false && stone.config.rssi > rssiThreshold) {
            result.push({id: stoneIds[i], stone: stone});
          }
        }
        else {
          result.push({id: stoneIds[i], stone: stone});
        }
      }
    }

    return result;
  },


  /**
   * Set the ID of an existing target network.
   * @param { Object}  store            // Redux store
   * @param { String } sphereId         // Id of the sphere where the network lives.
   * @param { Array }  targetNetwork    // Array obtained from getStonesInNetwork: [{id: String, stone: Object}]
   * @param { Number } newId            // new network id that will be applied to the target network.
   */
  setNetworkId: function(store, sphereId, targetNetwork, newId) {
    let actions = [];
    for (let i = 0; i < targetNetwork.length; i++) {
      actions.push(this.getChangeMeshIdAction(sphereId, targetNetwork[i].id, newId))
    }

    if (actions.length > 0)
      store.batchDispatch(actions);
  },


  getChangeMeshIdAction: function(sphereId, stoneId, networkId) {
    return {
      type: 'UPDATE_MESH_NETWORK_ID',
      sphereId: sphereId,
      stoneId: stoneId,
      data: {meshNetworkId: networkId}
    }
  }

};