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

import { Platform } from 'react-native'
import { Util } from "../../../../util/Util";
import { SyncingBase } from "./SyncingBase";
import { CLOUD } from "../../../cloudAPI";


export class FingerprintSyncer extends SyncingBase {
  userId: string;

  globalSphereMap;

  constructor(actions : any[], transferPromises: any[], globalCloudIdMap: globalIdMap, globalSphereMap : globalSphereMap) {
    super(actions, transferPromises, globalCloudIdMap);
    this.globalSphereMap = globalSphereMap
  }

  download() {

  }

  sync(state) {
    let deviceId = this._getDeviceId(state);
    if (!deviceId) { return; }

    let locationIdsRequiringFingerprints = this._getLocationIdsRequiringFingerprints(state);


    this.syncDown(state, deviceId, locationIdsRequiringFingerprints)
      .then(() => {
        return this.syncUp(state)
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


  _getLocationIdsRequiringFingerprints(state) {
    let missingFingerprints = {};

    // for all existing rooms in our database, check if they require fingerprints. If so, ask the cloud for an appropriate fingerprint
    let sphereIds = Object.keys(state.spheres);
    for (let i = 0; i < sphereIds.length; i++) {
      let sphere = state.spheres[sphereIds[i]];
      let locationIds = Object.keys(sphere.locations);
      for (let j = 0; j < locationIds.length; j++) {
        let location = sphere.locations[locationIds[j]];
        if (location.config.fingerprintRaw === null) {
          missingFingerprints[location.config.cloudId] = {localLocationId: locationIds[j], sphereId: sphereIds[i]};
        }
      }
    }


    // for all the rooms that will be added to our database after this sync, ask the cloud for fingerprints.
    let newSphereIds = Object.keys(this.globalSphereMap);
    for (let i = 0; i < newSphereIds.length; i++) {
      let newLocationsData = this.globalSphereMap[newSphereIds[i]].locations;
      let newLocationCloudIds = Object.keys(newLocationsData);
      for (let j = 0; j < newLocationCloudIds.length; j++) {
        let localId = newLocationsData[newLocationCloudIds[j]];
        missingFingerprints[newLocationCloudIds[j]] = {localLocationId: localId, sphereId: newSphereIds[i]};
      }
    }

    return missingFingerprints;
  }

  syncUp(state) {
    // all the fingerprints we have and that do not have a cloudId, upload them to the cloud.
  }


  syncDown(state, deviceId, locationIdsRequiringFingerprints) {
    let cloudIds = Object.keys(locationIdsRequiringFingerprints);
    // download fingerprints for rooms that need it from our database.
    return CLOUD.forDevice(deviceId).getFingerprintsInLocations(cloudIds)
      .then((fingerprints) => {
        // match and store the fingerprints we can use
        for (let i = 0; i < fingerprints.length; i++) {
          let fingerprint = fingerprints[i];
          let dataInfo = locationIdsRequiringFingerprints[fingerprint.locationId];
          this.actions.push({
            type:'UPDATE_LOCATION_FINGERPRINT',
            sphereId: dataInfo.sphereId,
            locationId: dataInfo.localLocationId,
            data:{ fingerprintRaw: JSON.stringify(fingerprint.data), fingerprintCloudId: fingerprint.id }
          });
          delete locationIdsRequiringFingerprints[fingerprint.locationId];
        }

        // the rooms that do not have fingerprints, check if we can find matching fingerprints for it.
        let remainingRoomIds = Object.keys(locationIdsRequiringFingerprints);


      })
      .catch((err) => { console.log("ERROR GETTING THE FINGERPRINTS", err)})


  }


}
