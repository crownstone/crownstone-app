import {core} from "../../Core";
import {FingerprintUtil} from "../../util/FingerprintUtil";
// import {Get} from "../../util/GetUtil";

type vector = sigmoid[];
type fingerprintSummary = { id: processedFingerprintId, dataset: vector[]};

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


  addFingerprint(sphereId: sphereId, locationId: locationId, fingerprint: FingerprintProcessedData) {
    // store the fingerprint for classification
    if (!this.fingerprints[sphereId]) {
      this.fingerprints[sphereId] = {};
    }
    if (!this.fingerprints[sphereId][locationId]) {
      this.fingerprints[sphereId][locationId] = [];
    }

    let keysInSphere = this.sortedSphereKeys[sphereId];
    let amountOfKeysInSphere = keysInSphere.length;

    // the ones that existed in the fingerprint when it was created are set to 1
    // let mask = new Array(amountOfKeysInSphere).fill(1);
    // TODO: check if masks can be used
    // for (let i = 0; i < mask.length; i++) {
      // if (!fingerprint.crownstonesAtCreation[keysInSphere[i]]) {
      //   mask[i] = 0;
      // }
    // }

    // additionally, we will construct vectors for this fingerprint which are used to match later on.
    let vectorSet = [];
    for (let measurement of fingerprint.data) {
      let vector = new Array(amountOfKeysInSphere).fill(1);
      for (let i = 0; i < vector.length; i++) {
        if (measurement.data[keysInSphere[i]] !== undefined) {
          // apply the mask on the vector, this way the crownstones that should be ignored are 0 both in the fingerprint and in the measurement vector.
          vector[i] = measurement.data[keysInSphere[i]];
        }
      }
      vectorSet.push(vector);
    }

    this.fingerprints[sphereId][locationId].push({id: fingerprint.id, dataset: vectorSet});
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
    let spheres : Record<sphereId, Record<CrownstoneIdentifier, rssi>> = {};

    for (let ibeaconPackage of packages) {
      if (spheres[ibeaconPackage.referenceId] === undefined) {
        spheres[ibeaconPackage.referenceId] = {};
        vector[ibeaconPackage.referenceId]  = [];
      };

      let identifier = FingerprintUtil.getStoneIdentifierFromIBeaconPackage(ibeaconPackage);
      spheres[ibeaconPackage.referenceId][identifier] = ibeaconPackage.rssi;
    }

    for (let sphereId in spheres) {
      for (let crownstoneIdentifier of this.sortedSphereKeys[sphereId]) {
        if (spheres[sphereId][crownstoneIdentifier]) {
          vector[sphereId].push(KNNsigmoid(spheres[sphereId][crownstoneIdentifier]));
        }
        else {
          vector[sphereId].push(1);
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
          // we now apply the mask on the inputVector
          // TODO: profile this. Optimize this. Check the map.reduce alternative
          //  dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
          //  console.log(dot([1,2,3], [1,0,1]));
          // let vectorForFingerprint = inputVector[sphereId].concat([])
          // for (let i = 0; i < vectorForFingerprint.length; i++) {
          //   vectorForFingerprint[i] *= fingerprint.mask[i];
          // }

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
