interface StoneMap {
  id: string, // redux database id
  cid: number,
  handle: string,
  name: string,
  sphereId: string,
  stone: any,
  stoneConfig: any,
  locationName?: string,
  locationId?: string
}

interface LocationMap {
  id: string, // redux database id
  uid: number,
  name: string,
  icon: string,
}

interface StoneSphereHandleMap {
  [sphereId: string]: {
    [handle: string]: StoneMap
  }
}

interface StoneHandleMap {
  [handle: string]: StoneMap
}

interface StoneSummaryMap {
  [key: string]: StoneMap
}

interface StoneCIDMap {
  [key: string]: {
    [key: string]: StoneMap
  }
}
interface locationUIDMap {
  [key: string]: {
    [key: string]: LocationMap
  }
}

interface StoneIBeaconMap {
  [key: string]: StoneMap
}