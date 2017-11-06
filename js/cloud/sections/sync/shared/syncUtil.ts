
export const getTimeDifference = function(localVersion, cloudVersion) {
  return new Date(localVersion.updatedAt).valueOf() - new Date(cloudVersion.updatedAt).valueOf();
};

export const shouldUpdateInCloud = function(localVersion, cloudVersion) {
  // local version is newer than the cloud version --> update cloud
  return getTimeDifference(localVersion, cloudVersion) > 0;
};

export const shouldUpdateLocally = function(localVersion, cloudVersion) {
  // cloud version is newer than the local version --> update local
  return getTimeDifference(localVersion, cloudVersion) < 0;
};