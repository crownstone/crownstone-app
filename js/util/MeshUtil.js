export const MeshUtil = {


  getStonesInNetwork: function(state, sphereId, networkId) {
    if (networkId === null) {
      return [];
    }

    let sphere = state.spheres[sphereId];
    let stoneIds = Object.keys(sphere.stones);

    let result = [];

    for (let i = 0; i < stoneIds.length; i++) {
      let stone = sphere.stones[stoneIds[i]];
      if (stone.config.meshNetworkId === networkId) {
        result.push({id: stoneIds[i], stone: stone});
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