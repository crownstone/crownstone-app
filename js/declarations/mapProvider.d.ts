interface StoneMap {
  id: string, // redux database id
  cid: number,
  handle: string,
  name: string,
  sphereId: string,
  stoneConfig: any,
  locationName?: string,
  locationId?: string
}

interface StoneSphereHandleMap {
  [key: string]: {
    [key: string]: StoneMap
  }
}

interface StoneHandleMap {
  [key: string]: StoneMap
}

interface StoneSummaryMap {
  [key: string]: StoneMap
}

interface StoneCIDMap {
  [key: string]: {
    [key: string]: StoneMap
  }
}

interface StoneIBeaconMap {
  [key: string]: StoneMap
}