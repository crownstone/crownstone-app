import {core} from "../../Core";
import {FingerprintUtil} from "../../util/FingerprintUtil";
// import {Get} from "../../util/GetUtil";


export class KNN {
  sortedSphereKeys : Record<sphereId,string[]> = {};
  fingerprints : Record<sphereId, Record<locationId, fingerprintSummary[]>> = {};

  initialize() {
    // this will generate sortedSphereKeys for each sphere. This will also clear any initialized state on the start of the call.
    // any change in stones, this has to be reinitialized.
    let sphereDeviceMap = {};
    this.sortedSphereKeys = {};

    let spheres = core.store.getState().spheres;
    for (let [sphereId, sphere] of Object.entries(spheres)) {
      sphereDeviceMap[sphereId] = {};
      for (let stone of Object.values(sphere.stones)) {
        sphereDeviceMap[sphereId][FingerprintUtil.getStoneIdentifierFromStone(stone)] = 0;
      }
      this.sortedSphereKeys[sphereId] = Object.keys(sphereDeviceMap[sphereId]).sort();
    }
  }


  addFingerprint(sphereId: sphereId, locationId: locationId, fingerprint: FingerprintCore) {
    // store the fingerprint for classification
    if (!this.fingerprints[sphereId]) {
      this.fingerprints[sphereId] = {};
    }
    if (!this.fingerprints[sphereId][locationId]) {
      this.fingerprints[sphereId][locationId] = [];
    }

    let keysInSphere = this.sortedSphereKeys[sphereId];
    let amountOfKeysInSphere = keysInSphere.length;

    // we will construct vectors for this fingerprint which are used to match later on.
    let vectorSet = [];
    for (let measurement of fingerprint.data) {
      let vector = new Array(amountOfKeysInSphere).fill(1);
      for (let i = 0; i < vector.length; i++) {
        if (measurement.data[keysInSphere[i]] !== undefined) {
          // fill the vector in the order of the sortedSphereKeys. Any keys that are in the sphere but not in the fingerprint data are set to 1.
          vector[i] = measurement.data[keysInSphere[i]];
        }
      }
      vectorSet.push(vector);
    }

    this.fingerprints[sphereId][locationId].push({id: fingerprint.id, dataset: vectorSet});
  }


  updateFingerprint(sphereId: sphereId, locationId: locationId, fingerprint: FingerprintCore) {
    this.removeFingerprint(sphereId, locationId, fingerprint.id);
    this.addFingerprint(sphereId, locationId, fingerprint);
  }


  removeFingerprint(sphereId: sphereId, locationId: locationId, fingerprintId: processedFingerprintId) {
    if (!this.fingerprints[sphereId]) { return; }
    if (!this.fingerprints[sphereId][locationId]) { return; }

    for (let i = 0; i < this.fingerprints[sphereId][locationId].length; i++) {
      if (this.fingerprints[sphereId][locationId][i].id === fingerprintId) {
        this.fingerprints[sphereId][locationId].splice(i, 1);
        return;
      }
    }
  }

  /**
   * method to map the ibeaconPackage[] format to a classification vector
   *
   * missing crownstones that should exist in the sphere are set to 1.
   *
   * Profiled. This is negligibly fast.
   */
  preprocessIBeacon(packages : ibeaconPackage[]) : Record<sphereId, vector> {
    let vector  : Record<sphereId, vector> = {};
    let spheresInIbeaconData : Record<sphereId, Record<CrownstoneIdentifier, rssi>> = {};

    for (let ibeaconPackage of packages) {
      let sphereId = ibeaconPackage.referenceId;
      // do not use measurments from unknown spheres. Should not happen since we only track known spheres.
      if (this.sortedSphereKeys[sphereId] === undefined) { continue; };

      if (spheresInIbeaconData[sphereId] === undefined) {
        spheresInIbeaconData[sphereId] = {};
        vector[sphereId] = new Array(this.sortedSphereKeys[sphereId].length).fill(1);
      };

      let identifier = FingerprintUtil.getStoneIdentifierFromIBeaconPackage(ibeaconPackage);
      spheresInIbeaconData[sphereId][identifier] = ibeaconPackage.rssi;
    }

    for (let sphereId in spheresInIbeaconData) {
      for (let i = 0; i < this.sortedSphereKeys[sphereId].length; i++) {
        let crownstoneIdentifier = this.sortedSphereKeys[sphereId][i];
        if (spheresInIbeaconData[sphereId][crownstoneIdentifier]) {
          vector[sphereId][i] = KNNsigmoid(spheresInIbeaconData[sphereId][crownstoneIdentifier]);
        }
      }
    }

    return vector;
  }


  classify(packages : ibeaconPackage[]) : Record<sphereId, locationId> {
    let inputVector = this.preprocessIBeacon(packages);
    let result = {};

    for (let sphereId in inputVector) {
      // find the closest fingerprint in the sphere.
      let sphereLocations = this.fingerprints[sphereId];

      let label = null;
      let minDistance = Infinity;
      for (let locationId in sphereLocations) {
        let fingerprintsInLocation = sphereLocations[locationId];
        for (let fingerprint of fingerprintsInLocation) {
          // calculate the distance between the inputVector and the fingerprint
          for (let fingerprintVector of fingerprint.dataset) {
            let distance = KNNgetDistance(inputVector[sphereId], fingerprintVector);
            if (distance < minDistance) {
              minDistance = distance;
              label       = locationId;
            }
          }
        }
      }

      if (label !== null) {
        result[sphereId] = label;
      }
    }

    return result;
  }


  classifyWithDistanceMap(sphereId, packages : ibeaconPackage[]) : Record<locationId, number> {
    let inputVector = this.preprocessIBeacon(packages);
    let distanceMap = {};

    // find the closest fingerprint in the sphere.
    let sphereLocations = this.fingerprints[sphereId];

    for (let locationId in sphereLocations) {
      distanceMap[locationId] = Infinity;

      let fingerprintsInLocation = sphereLocations[locationId];
      for (let fingerprint of fingerprintsInLocation) {
        // calculate the distance between the inputVector and the fingerprint
        for (let fingerprintVector of fingerprint.dataset) {
          let distance = KNNgetDistance(inputVector[sphereId], fingerprintVector);
          if (distance < distanceMap[locationId]) {
            distanceMap[locationId] = distance;
          }
        }
      }
    }

    return distanceMap;
  }


  reset() {
    this.fingerprints     = {};
    this.sortedSphereKeys = {};
  }
}


export function KNNgetDistance(vector: number[], fingerprint: number[]) {
  let d = 0; let x = 0; let y = 0;
  for (let i = 0; i < vector.length; i++) {
    x = vector[i];
    y = fingerprint[i];
    d += x*x + y*y - 1.95 * x * y;
  }
  return d;
}


export function KNNsigmoid(rssi) {
  return (1 / (1 + Math.exp((rssi + 50)*0.1)));
}


export const processingParameters = {
  sigmoid: { smooth_f: 0.1, offset: 50 },
}
