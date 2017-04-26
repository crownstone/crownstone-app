import { LOG } from '../logging/Log'

export const EventUtil = {
  getViaMeshTopic: function (sphereId, meshNetworkId) {
    return 'updateViaMeshNetwork_' + sphereId + '_' + meshNetworkId;
  },
  getMeshTopic: function (sphereId, meshNetworkId) {
    return 'updateMeshNetwork_' + sphereId + '_' + meshNetworkId;
  },
  getCrownstoneTopic: function (sphereId, stoneId) {
    return 'update_' + sphereId + '_' + stoneId;
  }
};
