
export const getTimeDifference = function(localVersion, cloudVersion) {
  return new Date(localVersion.updatedAt).valueOf() - new Date(cloudVersion.updatedAt).valueOf();
};