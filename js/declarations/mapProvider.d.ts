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
  [stoneId: string]: StoneMap
}

interface StoneCIDMap {
  [sphereId: string]: {
    [crownstoneId: string]: StoneMap
  }
}
interface MeshIdMap {
  [meshId: string]: {
    [stoneId: string]: StoneMap
  }
}
interface HandleMeshMap {
  [stoneHandle : string]: string
}
interface locationUIDMap {
  [key: string]: {
    [key: string]: LocationMap
  }
}

interface StoneIBeaconMap {
  [ibeaconString: string]: StoneMap
}