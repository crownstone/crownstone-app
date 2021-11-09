/**
 * Sync Fingerprints in this device.
 * @param actions
 * @param transferPromises
 * @param state
 * @param cloudSpheresData
 * @param sphere
 * @param stone_from_cloud
 * @param cloudScheduleIds
 * @param sphereInState
 */

import { Util } from "../../../../util/Util";
import { SyncingBase } from "./SyncingBase";
import { CLOUD } from "../../../cloudAPI";
import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {LOGe} from "../../../../logging/Log";
import abilities from "../../../../database/reducers/stoneSubReducers/abilities";

interface locationSummary {
  [key: string]: { locationConfig?: LocationDataConfig, localLocationId: string, localSphereId: string}
}

interface locationCoverageMap {
  missing:  locationSummary,
  existing: locationSummary,
  new:      locationSummary,
}

export class FingerprintSyncer extends SyncingBase {
  userId: string;

  reinitializeTracking = false;

  sphereIdMap: sphereIdMap;

  constructor(actions : any[], transferPromises: any[], globalCloudIdMap: syncIdMap, syncSphereIdMap: sphereIdMap) {
    super(actions, transferPromises, globalCloudIdMap);
    this.sphereIdMap = syncSphereIdMap;
  }

  sync(state) {
    let deviceId = this._getDeviceId(state);
    if (!deviceId) { return; }

    // get all locationIds we have access to.
    let locationIdObject = this._getLocationIds(state);

    // these we download in full.
    let locationIdsRequiringFingerprints = locationIdObject.missing;

    // these we only get the timestamps of to save bandwidth
    let locationIdsWithCloudFingerprints = locationIdObject.existing;

    let locationIdsWithNewFingerprints = locationIdObject.new;

    return this.syncDown(state, deviceId, locationIdsRequiringFingerprints)
      .then(() => {
        return this.checkForUpdates(state, deviceId, locationIdsWithCloudFingerprints);
      })
      .then((additionalNewFingerprints) => {
        this.syncUp(state, deviceId, locationIdsWithNewFingerprints);
        return Promise.all(this.transferPromises);
      })
      .then(() => {
        return this.reinitializeTracking;
      })
  }


  _getDeviceId(state) {
    let deviceIds = Object.keys(this.globalCloudIdMap.devices);
    if (deviceIds.length == 0) {
      let deviceId = Util.data.getCurrentDeviceId(state);
      return deviceId;
    }

    return deviceIds[0];
  }


  _getLocationIds(state) : locationCoverageMap {
    let newFingerprints      : locationSummary = {};
    let existingFingerprints : locationSummary = {};
    let missingFingerprints  : locationSummary = {};

    let existingLocations = {};


    // for all existing rooms in our database, check if they require fingerprints. If so, ask the cloud for an appropriate fingerprint
    let sphereIds = Object.keys(state.spheres);
    for (let i = 0; i < sphereIds.length; i++) {
      let sphere = state.spheres[sphereIds[i]];
      let locationIds = Object.keys(sphere.locations);
      for (let j = 0; j < locationIds.length; j++) {
        existingLocations[locationIds[j]] = true;

        let location = sphere.locations[locationIds[j]];
        let payload = {locationConfig: location.config, localLocationId: locationIds[j], localSphereId: sphereIds[i]};
        // rooms without fingerprints.
        if (location.config.fingerprintRaw === null) {
          missingFingerprints[location.config.cloudId] = payload;
        }
        // rooms with fingerprints that also exist in the cloud.
        else if (location.config.fingerprintCloudId) {
          existingFingerprints[location.config.cloudId] = payload;
        }
        // rooms with fingerprints that have not been synced to the cloud yet.
        else {
          newFingerprints[location.config.cloudId] = payload;
        }
      }
    }


    // for all the rooms that will be added to our database after this sync, ask the cloud for fingerprints.
    for (let sphereId in this.sphereIdMap) {
      let newLocationsData = this.sphereIdMap[sphereId].locations;
      let newLocationCloudIds = Object.keys(newLocationsData);
      for (let j = 0; j < newLocationCloudIds.length; j++) {
        let localId = newLocationsData[newLocationCloudIds[j]];
        if (existingLocations[localId] === undefined) {
          let localSphereId = this.globalCloudIdMap.spheres[sphereId];
          missingFingerprints[newLocationCloudIds[j]] = {localLocationId: localId, localSphereId: localSphereId};
        }
      }
    }

    return {existing: existingFingerprints, missing: missingFingerprints, new: newFingerprints};
  }


  syncUp(state, deviceId, locationIdsWithNewFingerprints : locationSummary) {
    // all the fingerprints we have and that do not have a cloudId, upload them to the cloud.
    let locationIds = Object.keys(locationIdsWithNewFingerprints);
    for ( let i = 0; i < locationIds.length; i++ ) {
      let locationData = locationIdsWithNewFingerprints[locationIds[i]];
      this.transferPromises.push(
        CLOUD.forDevice(deviceId).createFingerprint(locationIds[i], locationData.locationConfig.fingerprintRaw)
          .then((fingerprint) => {
            this.actions.push({
              type:'UPDATE_LOCATION_FINGERPRINT_CLOUD_ID',
                sphereId: locationData.localSphereId,
                locationId: locationData.localLocationId,
                data:{ fingerprintCloudId: fingerprint.id, fingerprintUpdatedAt: fingerprint.updatedAt }
            })
          })
          .catch((err) => {
            LOGe.cloud("FingerprintSyncer: Could not create fingerprint in cloud", err);
          })
      )
    }
  }


  checkForUpdates(state, deviceId, locationIdsWithCloudFingerprints : locationSummary) : Promise<void> {
    // get the fingerprints ids from the locationIdObject.
    let locationIds = Object.keys(locationIdsWithCloudFingerprints);

    if (locationIds.length === 0) {
      return new Promise((resolve, reject) => { resolve(); });
    }


    let locationMap = {};
    let fingerprintIds = [];
    let availabilityMap = {};
    for ( let i = 0; i < locationIds.length; i++ ) {
      let item = locationIdsWithCloudFingerprints[locationIds[i]];
      let fingerprintCloudId = item.locationConfig.fingerprintCloudId;
      fingerprintIds.push(fingerprintCloudId);
      locationMap[fingerprintCloudId] = item;
      availabilityMap[fingerprintCloudId] = false;
    }

    // nothing to declare
    if (fingerprintIds.length === 0) { return; }

    let fingerprintsToUpdateFromCloud = [];
    return CLOUD.forDevice(deviceId).getFingerprintUpdateTimes(fingerprintIds)
      .then((updatedTimeEntries) => {
        for (let i = 0; i < updatedTimeEntries.length; i++) {
          let timeData = updatedTimeEntries[i];
          let fingerprintCloudId = timeData.id;

          // tell the system this fingerprint was not deleted in the cloud.
          availabilityMap[fingerprintCloudId] = true;

          let localConfig = locationMap[timeData.id].locationConfig;


          if (shouldUpdateInCloud(localConfig.fingerprintUpdatedAt, timeData.updatedAt)) {
            // upload the new fingerprint to to the cloud.
            this.transferPromises.push(
              CLOUD.forDevice(deviceId).updateFingerprint(fingerprintCloudId, localConfig.fingerprintRaw)
                .then((updatedFingerprint) => {
                  // if this is a new fingerprint that has been duplicated especially for you, you must update the id!
                  if (updatedFingerprint.id !== fingerprintCloudId) {
                    let locationData = locationMap[fingerprintCloudId];
                    this.actions.push({
                      type: 'UPDATE_LOCATION_FINGERPRINT',
                      sphereId: locationData.sphereId,
                      locationId: locationData.localLocationId,
                      data: {
                        fingerprintCloudId:   updatedFingerprint.id,
                        fingerprintUpdatedAt: updatedFingerprint.updatedAt
                      }
                    });
                  }
                })
                .catch((err) => {
                  LOGe.cloud("FingerprintSyncer: Could not update fingerprint in cloud", err);
                })
            );
          }
          else if (shouldUpdateLocally(localConfig.fingerprintUpdatedAt, timeData.updatedAt)) {
            fingerprintsToUpdateFromCloud.push(fingerprintCloudId);
          }
        }

        return Promise.all(this.transferPromises);
      })
      .then(() => {
        this.transferPromises = [];
        if (fingerprintsToUpdateFromCloud.length > 0) {
          return CLOUD.forDevice(deviceId).getFingerprints(fingerprintsToUpdateFromCloud)
            .then((updatedFingerprints) => {
              for (let i = 0; i < updatedFingerprints.length; i++) {
                let updatedFingerprint = updatedFingerprints[i];
                let locationData = locationMap[updatedFingerprint.id];
                this.reinitializeTracking = true;
                this.actions.push({
                  type:'UPDATE_LOCATION_FINGERPRINT',
                  sphereId: locationData.sphereId,
                  locationId: locationData.localLocationId,
                  data:{ fingerprintRaw: JSON.stringify(updatedFingerprint.data), fingerprintCloudId: updatedFingerprint.id, fingerprintUpdatedAt: updatedFingerprint.updatedAt }
                });
              }
            })
        };
      })
      .then(() => {
        // we will now check if fingerprints have been removed from the cloud
        // let fingerprintIds = Object.keys(availabilityMap);
        // for (let i = 0; i < fingerprintIds.length; i++) {
        //   let fingerprintId = fingerprintIds[i];
        //   if ( availabilityMap[fingerprintId] === false ) {
        //     // this fingerprint has been deleted from the cloud.
        //     // we will
        //   }
        // }
      })
      .catch((err) => {
        LOGe.cloud("FingerprintSyncer: Could not check updared for fingerprints in cloud.", err);
      })
  }


  /**
   * - Download the fingerprints for the locations we have, assuming the cloud has them for our specific device.
   * - Store those we have
   * - For all locations that still do not have a fingerprint, check if we can find a matching one in the cloud
   * - For all matches we found, collect the storage actions and link them in the cloud first
   * - Link succesful, store the fingerprints in our local database.
   * @param state
   * @param deviceId
   * @param locationIdsRequiringFingerprints
   * @returns {Promise<any>}
   */
  syncDown(state, deviceId, locationIdsRequiringFingerprints : locationSummary) : Promise<void> {
    let cloudIds = Object.keys(locationIdsRequiringFingerprints);
    // download fingerprints for rooms that need it from our cloud database.
    let pendingActions =  [];

    if (cloudIds.length === 0) {
      return new Promise((resolve, reject) => { resolve(); });
    }

    return CLOUD.forDevice(deviceId).getFingerprintsInLocations(cloudIds)
      .then((fingerprints) => {
        // match and store the fingerprints we can use
        for (let i = 0; i < fingerprints.length; i++) {
          let fingerprint = fingerprints[i];
          let dataInfo = locationIdsRequiringFingerprints[fingerprint.locationId];
          this.reinitializeTracking = true;
          this.actions.push({
            type:'UPDATE_LOCATION_FINGERPRINT',
            sphereId: dataInfo.localSphereId,
            locationId: dataInfo.localLocationId,
            data:{ fingerprintRaw: JSON.stringify(fingerprint.data), fingerprintCloudId: fingerprint.id, fingerprintUpdatedAt: fingerprint.updatedAt }
          });
          delete locationIdsRequiringFingerprints[fingerprint.locationId];
        }

        // the rooms that do not have fingerprints, check if we can find matching fingerprints for it.
        let remainingRoomIds = Object.keys(locationIdsRequiringFingerprints);
        return CLOUD.forDevice(deviceId).getMatchingFingerprintsInLocations(remainingRoomIds);
      })
      .then((matchingFingerprints) => {
        let linkIdList = [];
        for (let i = 0; i < matchingFingerprints.length; i++) {
          let fingerprint = matchingFingerprints[i];
          let dataInfo = locationIdsRequiringFingerprints[fingerprint.locationId];
          pendingActions.push({
            type:'UPDATE_LOCATION_FINGERPRINT',
            sphereId: dataInfo.localSphereId,
            locationId: dataInfo.localLocationId,
            data:{ fingerprintRaw: JSON.stringify(fingerprint.data), fingerprintCloudId: fingerprint.id, fingerprintUpdatedAt: fingerprint.updatedAt }
          });
          linkIdList.push(fingerprint.id);
          delete locationIdsRequiringFingerprints[fingerprint.locationId];
        }

        if (linkIdList.length > 0) {
          return CLOUD.forDevice(deviceId).linkFingerprints(linkIdList);
        }
        else {
          return false;
        }
      })
      .then((itemsWereLinked) => {
        if (itemsWereLinked === false) { return; }

        // the items have been linked. We will store the fingerprints in the database.
        for (let i = 0; i < pendingActions.length; i++) {
          this.reinitializeTracking = true;
          this.actions.push(pendingActions[i]);
        }
      })
      .catch((err) => {
        LOGe.cloud("FingerprintSyncer: Could not check get fingerprints in locations.", err);
      })
  }


}
