interface ReduxAppState {
  app:           appData,
  devices:       any,
  development:   any,
  events:        any,
  installations: any,
  spheres:       Record<sphereId, SphereData>,
  user:          UserData,
  devApp:        any,
}

interface appData {
  activeSphere: null | string,
  notificationToken: null | string,

  tapToToggleEnabled: boolean,
  indoorLocalizationEnabled: boolean,

  hasSeenDeviceSettings: boolean,
  hasZoomedOutForSphereOverview: boolean,
  hasSeenSwitchView: boolean,

  hasSeenEditLocationIcon: boolean,
  hasSeenDimmingButton: boolean,

  migratedDataToVersion: null | string,

  localization_temporalSmoothingMethod: LocalizationSmoothingMethod,
  localization_onlyOwnFingerprints:     boolean,

  updatedAt: timestamp
}

type LocalizationSmoothingMethod = 'NONE' | 'SEQUENTIAL_2' | 'BEST_OUT_OF_5' | '60_PERCENT_IN_10';

interface SphereData {
  id:     string,
  config: SphereDataConfig,
  state: {
    lastPresentTime:  number,
    reachable:        boolean,
    present:          boolean,
    smartHomeEnabled: boolean,
  },
  users:       {[userId:     string]: SphereUserData},
  locations:   {[locationId: string]: LocationData},
  stones:      {[stoneId:    string]: StoneData},
  scenes:      {[sceneId:    string]: SceneData},
  hubs:        {[hubId:      string]: HubData},
  messages:    {[messageId:  string]: MessageData},
  sortedLists: {[sortedListId: string]: SortedListData },
  features:  {
    ENERGY_COLLECTION_PERMISSION?: FeatureData
  },
  thirdParty:  any,
  keys:        any,
}

interface FeatureData {
  enabled: boolean,
}


type MessageTriggerEvent = 'enter' | 'exit';

interface MessageData {
  id: string,
  cloudId: string | null,

  triggerLocationId: locationId | null,
  triggerEvent:      MessageTriggerEvent,
  everyoneInSphere:  boolean,
  includeSenderInEveryone: boolean,
  recipients: Record<userId, true>,

  content:    string,

  visible:    boolean,
  notified:   boolean,

  read:       {} | {read:    MessageStateData},     // the 'id' is hardcoded since it is guarenteed to be a single entry.
  deleted:    {} | {deleted: MessageStateData},  // the 'id' is hardcoded since it is guarenteed to be a single entry.

  sendFailed: boolean,
  senderId:   userId,
  sent:       boolean,
  sentAt:     timestamp,
  updatedAt:  timestamp,
}

interface MessageData_settable {
  cloudId: string | null,

  triggerLocationId: locationId | null,
  triggerEvent:      MessageTriggerEvent,
  everyoneInSphere:  boolean,
  includeSenderInEveryone: boolean,
  recipients: Record<userId, true>,

  content:    string,

  visible:    boolean,
  notified:   boolean,

  sendFailed: boolean,
  senderId:   userId,
  sent:       boolean,
  sentAt:     timestamp,
  updatedAt:  timestamp,
}

interface MessageStateData {
  id: string,
  cloudId: string,
  updatedAt: number,
  value: boolean
}

interface SphereDataConfig {
  name:        string,
  iBeaconUUID: string, // ibeacon uuid
  uid:         number,
  cloudId:     string,

  latitude:    number | null,
  longitude:   number | null,
  timezone:    string | null,

  updatedAt:   timestamp,
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
}

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
  state: StoneState,
  reachability: {
    lastSeen: timestamp,
  },
  behaviours: {
    [behaviourId: string] : behaviourWrapper
  },
  abilities: {
    [itemId in abilityId] : AbilityData
  },
  errors: StoneErrors,
  mesh:         any,
  lastUpdated:  any,
  reachability: any,
  keys:         any,
}

interface StoneErrors  {
  errorCode:         number,
  overCurrent:       boolean,
  overCurrentDimmer: boolean,
  temperatureChip:   boolean,
  temperatureDimmer: boolean,
  dimmerOnFailure:   boolean,
  dimmerOffFailure:  boolean,
  hasError:          boolean,
}

interface StoneState {
  timeSet: boolean,
  state: number,
  previousState: number,
  currentUsage: number,
  behaviourOverridden: boolean,
  dimmerReady: boolean,
  powerFactor: number,
  updatedAt: timestamp
}

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
  uicr:               UICRData | null,

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
  presentUsers: string[],
  fingerprints: {
    raw:       Record<fingerprintId, FingerprintData>,
    processed: Record<fingerprintId, FingerprintProcessedData>,
  },
  layout: {
    x: number,
    y: number,
  }
}

type FingerprintType = 'IN_HAND' | 'IN_POCKET' | 'AUTO_COLLECTED' | 'FIND_AND_FIX';
type TransformState  = 'NOT_REQUIRED' | 'NOT_TRANSFORMED_YET' | 'TRANSFORMED_EXACT' | 'TRANSFORMED_APPROXIMATE';
type CrownstoneIdentifier = string; // maj_min as identifier representing the Crownstone.

interface FingerprintDataSettable {
  cloudId: string | null,
  type: FingerprintType,
  createdOnDeviceType: string, // ${device type string}]  `${DeviceInfo.getDeviceId()}_${DeviceInfo.getManufacturerSync()}_${DeviceInfo.getModel()}`;
  createdByUser: userId,       // ${user id}
  crownstonesAtCreation: Record<CrownstoneIdentifier, true>, // maj_min as id representing the Crownstone.
  data: FingerprintMeasurementData[],
  updatedAt: timestamp,
  createdAt: timestamp,
}

interface FingerprintData extends FingerprintDataSettable{
  id: string,
}

interface FingerprintProcessedData extends FingerprintCore {
  fingerprintId: string, // processed based on parent id
  type: FingerprintType,
  transformState: TransformState,
  createdOnDeviceType:   string, // ${device type string}]
  createdByUser:         userId, // ${user id}
  crownstonesAtCreation: Record<CrownstoneIdentifier, true>, // maj_min as id representing the Crownstone.
  processingParameterHash: string, // this contains the parameters used to process the data. (sigmoid)
  transformedAt: timestamp,  // if the transform data has changed since the last time it was transformed, repeat the transform.
  processedAt:   timestamp,  // if the base fingerprint has changed since the processing time, update the processed fingerprint.
  createdAt:     timestamp,
}

interface FingerprintCore {
  id: string,
  data: FingerprintProcessedMeasurementData[],
}

interface FingerprintMeasurementData {
  dt: number, // ms diff from createdAt
  data: Record<CrownstoneIdentifier, rssi>
}

interface FingerprintProcessedMeasurementData {
  dt: number, // ms diff from createdAt
  data: Record<CrownstoneIdentifier, sigmoid>
}

interface LocationDataConfig {
  name:         string,
  icon:         string,
  uid:          number,
  picture:      string,
  pictureTaken: timestamp,
  pictureId:    string | null,
  pictureSource: PICTURE_SOURCE,

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

type AbilityType = abilityId;
interface AbilityData {
  enabled:            boolean | null,
  enabledTarget:      boolean,
  cloudId:            string,
  type:               AbilityType,
  syncedToCrownstone: boolean,
  updatedAt:          number,
  properties: {
    rssiOffset?:           AbilityPropertyData,
    softOnSpeed?:          AbilityPropertyData,
    doubleTapSwitchcraft?: AbilityPropertyData,
    defaultDimValue?:      AbilityPropertyData,
  }
}

type AbilityPropertyType = propertyId;
interface AbilityPropertyData {
  type:             AbilityPropertyType,
  cloudId:          string,
  value:            string | number | boolean,
  valueTarget:      string | number | boolean,
  syncedToCrownstone: boolean,
  updatedAt:        number
}


interface SceneData {
  id:            string,
  name:          string,
  picture:       string,
  pictureId:     string,
  pictureSource: PICTURE_SOURCE,
  cloudId:       string | null,
  data:          { [key: number] : number }, // stoneUID: switchState
  updatedAt:     number
}


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

type PICTURE_SOURCE = "STOCK" | "CUSTOM";
