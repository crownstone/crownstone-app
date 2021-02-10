type timestamp = number;

interface SphereData {
  id: string,
  config: {
    name: string,
    iBeaconUUID: string, // ibeacon uuid
    uid: number,
    cloudId: string,
    meshAccessAddress: string,

    aiName: string,

    latitude: number | null,
    longitude: number | null,

    updatedAt: timestamp,
  },
  state: {
    lastPresentTime: number,
    reachable: boolean,
    present: boolean,
    smartHomeEnabled: boolean,
    newMessageFound: boolean,
  },
  users:       {[userId: string]: any},
  locations:   {[locationId: string]: any},
  stones:      {[stoneId: string]: StoneData},
  scenes:      {[sceneId: string]: any},
  hubs:        {[hubId: string]: HubData},
  messages:    {[messageId: string]: any},
  thirdParty:  any,
  sortedLists: any,
  keys:        any,
}

interface HubData {
  id: string,
  config: {
    name: string,
    cloudId:   string | null,
    ipAddress: string | null,
    linkedStoneId: string | null,
    locationId: string | null,
    httpPort: number,
    httpsPort: number,
    updatedAt: timestamp,
  },
  state: {
    uartAlive                          : boolean,
    uartAliveEncrypted                 : boolean,
    uartEncryptionRequiredByCrownstone : boolean,
    uartEncryptionRequiredByHub        : boolean,
    hubHasBeenSetup                    : boolean,
    hubHasInternet                     : boolean,
    hubHasError                        : boolean,
  },
  reachability: {
    reachable: boolean,
    lastSeen:  timestamp | null,
  },
};


interface StoneData {
  id: string,
  config: {
    name: string,
    description: string,
    icon: string,
    crownstoneId: number, // DEPRECATED
    uid: number,          // new field to generalize between sphere, location and stone uid.
    type: string,
    iBeaconMajor: number,
    iBeaconMinor: number,
    handle: string,

    cloudId: string | null,

    firmwareVersion: string | null,
    firmwareVersionSeenInOverview: string | null,
    bootloaderVersion: string | null,
    hardwareVersion: string | null,

    dfuResetRequired: boolean,
    locationId: string,

    macAddress:    string,
    meshNetworkId: string,

    hidden: boolean,
    locked: boolean,

    updatedAt: timestamp,
  },
  lastUpdated: {
    stoneTime: timestamp,
  },
  state: {
    timeSet: boolean,
    state: number,
    previousState: number,
    currentUsage: number,
    behaviourOverridden: boolean,
    dimmerReady: boolean,
    powerFactor: number,
    updatedAt: timestamp
  },
  reachability: {
    lastSeen: timestamp,
  },
  rules: any,
  abilities: {
    dimming: any,
    switchcraft: any,
    tapToToggle: any,
  },
  errors: {
    overCurrent:       boolean,
    overCurrentDimmer: boolean,
    temperatureChip:   boolean,
    temperatureDimmer: boolean,
    dimmerOnFailure:   boolean,
    dimmerOffFailure:  boolean,
    hasError:          boolean,
  },
  mesh:         any,
  lastUpdated:  any,
  reachability: any,
  keys:         any,
};


interface LocationData {
  id: string,
  config: {
    name:         string,
    icon:         string,
    uid:          number,
    picture:      string,
    pictureTaken: timestamp,
    pictureId:    string | null,
    cloudId:      string | null,
    updatedAt:    timestamp,

    fingerprintCloudId:   string | null,
    fingerprintRaw:       string | null,
    fingerprintParsed:    string | null,
    fingerprintUpdatedAt: timestamp,
  }
  presentUsers: [],
  layout: {
    x: number,
    y: number,
    setOnThisDevice: boolean,
    updatedAt: timestamp,
  }
}