type timestamp = number;

interface SphereData {
  id: string,
  config: SphereDataConfig,
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

interface SphereDataConfig {
  name: string,
  iBeaconUUID: string, // ibeacon uuid
  uid: number,
  cloudId: string,

  aiName: string,

  latitude: number | null,
  longitude: number | null,

  updatedAt: timestamp,
}

interface HubData {
  id: string,
  config: HubDataConfig,
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

interface HubDataConfig {
  name:            string,
  cloudId:         string | null,
  ipAddress:       string | null,
  linkedStoneId:   string | null,
  locationId:      string | null,
  httpPort:        number,
  httpsPort:       number,
  lastSeenOnCloud: timestamp,
  updatedAt:       timestamp,
}

interface StoneData {
  id: string,
  config: StoneDataConfig,
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
  rules: {
    [behaviourId: string] : behaviourWrapper
  },
  abilities: {
    [abilityId: string] : AbilityBaseData
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

interface StoneDataConfig {
  name:         string,
  description:  string,
  icon:         string,
  uid:          number,
  type:         string,
  iBeaconMajor: number,
  iBeaconMinor: number,
  handle:       string,

  cloudId:      string | null,

  firmwareVersion:    string | null,
  bootloaderVersion:  string | null,
  hardwareVersion:    string | null,

  dfuResetRequired: boolean,
  locationId:       string,

  macAddress:    string,

  hidden: boolean,
  locked: boolean,

  updatedAt: timestamp,
}


interface LocationData {
  id: string,
  config: LocationDataConfig
  presentUsers: [],
  layout: {
    x: number,
    y: number,
    setOnThisDevice: boolean,
    updatedAt: timestamp,
  }
}

interface LocationDataConfig {
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

interface SphereUserData {
  id:          string,
  firstName:   string,
  lastName:    string,
  email:       string,
  invitationPending: boolean,
  present:     boolean,
  picture:     string,
  pictureId:   string,
  accessLevel: ACCESS_ROLE,
  updatedAt:   number
}

interface SphereUserDataLocalSettable {
  firstName?:   string,
  lastName?:    string,
  email?:       string,
  invitationPending?: boolean,
  language?:    string,
  picture?:     string,
  pictureId?:   string,
  accessLevel?: ACCESS_ROLE,
  updatedAt?:   number
}


interface UserData {
  firstName:                          string,
  lastName:                           string,
  email:                              string,
  accessToken:                        string,
  passwordHash:                       string,
  userId:                             string,
  isNew:                              boolean,
  language:                           string,
  picture:                            string,
  pictureId:                          string,
  firmwareVersionsAvailable:          FirmwareBootloaderList,
  bootloaderVersionsAvailable:        FirmwareBootloaderList,
  betaAccess:                         boolean,
  seenTapToToggle:                    boolean,
  seenTapToToggleDisabledDuringSetup: boolean,
  appIdentifier:                      string,
  developer:                          boolean,
  uploadLocation:                     boolean,
  uploadSwitchState:                  boolean,
  uploadDeviceDetails:                boolean,
  updatedAt:                          number,
}

type AbilityType = 'dimming' | 'switchcraft' | 'tapToToggle';
interface AbilityData {
  enabled:            boolean | null,
  enabledTarget:      boolean,
  cloudId:            string,
  type:               AbilityType,
  syncedToCrownstone: boolean,
  updatedAt:          number,
  properties: {
    [propertyId: string]: AbilityPropertyData
  }
};

type AbilityPropertyType = "rssiOffset" | "softOnSpeed";
interface AbilityPropertyData {
  type:             AbilityPropertyType,
  cloudId:          string,
  value:            string | number,
  valueTarget:      string | number,
  syncedToCrownstone: boolean,
  updatedAt:        number
};


interface ToonData {
  id:                      string,
  toonAgreementId:         string,
  toonAddress:             string,
  cloudId:                 string,
  schedule:                string,
  updatedScheduleTime:     number,
  enabled:                 boolean,
  cloudChangedProgram:     string,
  cloudChangedProgramTime: number,
  updatedAt:               number,
}