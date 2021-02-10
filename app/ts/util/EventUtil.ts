export const EventUtil = {
  getViaMeshTopic: function (sphereId, meshNetworkId) {
    return 'updateViaMeshNetwork_' + sphereId + '_' + meshNetworkId;
  },
  getMeshTopic: function (sphereId, meshNetworkId) {
    return 'updateMeshNetwork_' + sphereId + '_' + meshNetworkId;
  },
  getCrownstoneTopic: function (sphereId, stoneId) {
    return 'update_' + sphereId + '_' + stoneId;
  },
  getSetupTopic: function (handle) {
    return 'setupAdvertisement_' + handle;
  },
  getDfuTopic: function (handle) {
    return 'dfuAdvertisement_' + handle;
  },
  getIgnoreTopic: function (stoneId) {
    return 'temporaryStopListening_' + stoneId;
  },
  getIgnoreConditionFulfilledTopic: function (stoneId) {
    return 'ignoreConditionFulfilled_' + stoneId;
  },
};
