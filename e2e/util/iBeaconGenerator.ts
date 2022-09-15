interface ibeaconPackage {
  id    : string, // uuid + "_Maj:" + string(major) + "_Min:" + string(minor)
  uuid  : string, // this is the iBeacon UUID in uppercase: "E621E1F8-C36C-495A-93FC-0C247A3E6E5F"
  major : string | number, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
  minor : string | number, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
  rssi  : number,
  referenceId : string, // The sphere ID, as given in trackIBeacon().
}

export class iBeaconGenerator {
  spheres = {};

  loadSphere(sphere) {
    if (!sphere?.data?.data?.id) { return }

    this.spheres[sphere.data.data.id] = {
      config: sphere.data.data,
      locations: mapLocations(sphere),
      stones: mapStones(sphere),
      iBeaconData:{
        uuid: sphere.data.data.beaconUUID,
        sets: mapStoneSets(sphere),
      }};
  }

  generateIBeaconMessage(sphereId, locationId = null) {
    if (this.spheres[sphereId] === undefined) {
      throw new Error("Sphere not found");
    }

    if (locationId === null) {
      locationId = Object.keys(this.spheres[sphereId].locations)[0];
    }

    let payload : ibeaconPackage[] = []; //
    for (let stoneId in this.spheres[sphereId].iBeaconData.sets) {
      let stoneSet = this.spheres[sphereId].iBeaconData.sets[stoneId];
      payload.push({
        id:  this.spheres[sphereId].iBeaconData.uuid + "_Maj:" + stoneSet.major + "_Min:" + stoneSet.minor,
        uuid: this.spheres[sphereId].iBeaconData.uuid,
        major: stoneSet.major,
        minor: stoneSet.minor,
        rssi: this._getRssi(this.spheres[sphereId].locations[locationId]),
        referenceId: sphereId,
      })
    }
    return payload;
  }

  /**
   * We will support up to 10 rooms. The rssi is determined at a minimum of -50, and incremented with 5*uid increment of the location.
   * This should be deterministic enough for classification. Classification does not care about duplicates nor checks for them.
   * @param locationId
   */
  _getRssi(location) {
    return -50 + 5 * location.data.data.uid;
  }
}

function mapLocations(sphere) {
  let locations = sphere?.locations ?? {};
  let locationIds = Object.keys(locations)
  locationIds.sort();
  let result = {};
  for (let locationId of locationIds) {
    result[locationId] = locations[locationId].data.data;
  }
  return locations;
}

function mapStones(sphere) {
  let stones = sphere?.stones ?? {};
  let stoneIds = Object.keys(stones)
  stoneIds.sort();
  let result = {};
  for (let stoneId of stoneIds) {
    result[stoneId] = stones[stoneId].data.data;
  }
  return stones;
}

function mapStoneSets(sphere) {
  let stones = sphere?.stones ?? {};
  let stoneIds = Object.keys(stones)
  stoneIds.sort();
  let result = {};
  for (let stoneId of stoneIds) {
    result[stoneId] = {major: stones[stoneId].data.data.major, minor: stones[stoneId].data.data.minor}
  }
  return stones;
}
