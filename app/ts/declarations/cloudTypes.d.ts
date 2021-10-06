type filter = string | number | RegExp

type ACCESS_ROLE = 'admin' | 'member' | 'guest' | 'hub';

interface cloud_UserData {
  id: string,
  firstName: string,
  lastName: string
  language: "en_us" | "nl_nl",
  email: string,
  profilePicId?:  string,
  invitePending?: boolean,
  accessLevel?:   ACCESS_ROLE
  updatedAt: string,
}


interface cloud_User {
  firstName:           string,
  lastName:            string,
  email:               string,
  new:                 boolean,
  profilePicId:        string,
  id:                  string,
  language:            string,
  uploadLocation:      boolean,
  uploadSwitchState:   boolean,
  uploadDeviceDetails: boolean,
  updatedAt:           string,
}

interface cloud_User_settable {
  firstName:           string,
  lastName:            string,
  email:               string,
  new:                 boolean,
  language:            string,
  uploadLocation:      boolean,
  uploadSwitchState:   boolean,
  uploadDeviceDetails: boolean,
  updatedAt:           string,
}

interface cloud_Sphere {
  id: string,
  uid: number,
  uuid: string,
  name: string,
  aiName: string,
  gpsLocation?: {
    lat: number,
    lng: number,
  },
  createdAt: string,
  updatedAt: string,
}
interface cloud_Sphere_settable {
  uid?: number,
  uuid?: string,
  name?: string,
  aiName?: string,
  gpsLocation?: {
    lat?: localData.config.latitude,
    lng?: localData.config.longitude,
  },
  updatedAt: string,
}

interface cloud_Hub {
  id: string,
  name: string,
  sphereId: string,
  localIPAddress: string,
  linkedStoneId: string,
  locationId?: string,
  lastSeen: string,
  httpPort: number,
  httpsPort: number,
  externalIPAddress: string,
  createdAt: string,
  updatedAt: string,
}

interface cloud_Hub_settable {
  name?: string,
  localIPAddress?: string,
  linkedStoneId?: string,
  locationId?: string,
  updatedAt?: string,
}

interface cloud_LoginReply {
  id: string,
  userId: string,
  ttl: number,
  created: string,
  principalType: string
}


interface cloud_Stone {
  id: string,
  name: string,
  address: string,
  description: string,
  type: string,
  major: number;
  minor: number;
  uid: number;
  icon: string,
  firmwareVersion: string,
  bootloaderVersion: string,
  hardwareVersion: string,
  locked: boolean;
  locationId?: string,
  sphereId: string,
  createdAt: string,
  updatedAt: string,

  currentSwitchState?: cloud_SwitchState,
  currentSwitchStateId?: string,
  abilities?: cloud_Ability[];
  behaviours?: cloud_Behaviour[];
}


interface cloud_Stone_settable {
  name: string,
  address: string,
  description: string,
  type: string,
  major: number;
  minor: number;
  uid: number;
  icon: string,
  firmwareVersion: string,
  bootloaderVersion: string,
  hardwareVersion: string,
  hidden: boolean;
  locked: boolean;
  locationId: string,
  updatedAt: string,
}


interface cloud_Ability {
  type:       AbilityType,
  enabled:    boolean;
  syncedToCrownstone: boolean;
  id:         string,
  stoneId:    string,
  sphereId:   string,
  updatedAt:  string,
  createdAt:  string,
  properties?: any[];
}


interface cloud_Ability_settable {
  type:       AbilityType,
  enabled:    boolean;
  syncedToCrownstone: boolean;
  updatedAt:  string,
}

interface cloud_AbilityProperty {
  type:       AbilityPropertyType,
  value:      string;
  syncedToCrownstone: boolean;
  id:         string,
  stoneId:    string,
  sphereId:   string,
  abilityId:  string,
  updatedAt:  string,
  createdAt:  string
}


interface cloud_AbilityProperty_settable {
  type:       AbilityPropertyType,
  value:      number | string;
  syncedToCrownstone: boolean;
  updatedAt:  string,
}


interface SpherePresentPeople {
  userId: string,
  locations: [];
}


interface cloud_Location {
  name:      string,
  uid:       number,
  icon:      string,
  id:        string,
  imageId?:  string,
  sphereId:  string,
  updatedAt: string,
  createdAt: string,
}


interface cloud_Location_settable {
  name?: string,
  uid?:  number,
  icon?: string,
  updatedAt?: string,
}



interface UserLoginData { accessToken: string, ttl: number, userId: string }
interface HubLoginData  { accessToken: string, ttl: number }

interface cloud_Keys {
  sphereId: string,
  sphereAuthorizationToken: string,
  sphereKeys: cloud_SphereKey[]
  stoneKeys?: cloud_StoneKey[]
}

type keyType = "ADMIN_KEY"            |
               "MEMBER_KEY"           |
               "BASIC_KEY"            |
               "LOCALIZATION_KEY"     |
               "SERVICE_DATA_KEY"     |
               "MESH_APPLICATION_KEY" |
               "MESH_NETWORK_KEY"


interface cloud_SphereKey {
  id: string,
  keyType: keyType,
  key: string,
  ttl: number,
  createdAt: string
}

interface cloud_StoneKey {
  [stoneId: string] : {
    id: string,
    keyType: "MESH_DEVICE_KEY",
    key: string,
    ttl: number,
    createdAt: string
  },
}

interface cloud_EventListener {
  id: string,
  token: string,
  userId: string,
  expiresAt: string,
  eventTypes: string[],
  url: string,
  ownerId: string,
}

interface cloud_SphereFeature {
  id: string,
  from: string,
  until: string,
  name: string,
  data: string,
  enabled: boolean,
  createdAt: string,
  updatedAt: string,
}

interface cloud_Message {
  id: string,
  triggerEvent: string,
  content: string,
  everyoneInSphere: boolean;
  everyoneInSphereIncludingOwner: boolean;
  deliveredAll: boolean;
  triggerLocationId: string,
  ownerId: string,
  recipients: cloud_User[];
  delivered: cloud_MessageState[];
  read: cloud_MessageState[];
  sphereId: string,
  createdAt: string,
  updatedAt: string,
}

interface cloud_Scene {
  id:              string,
  name:            string,
  stockPicture?:    string,
  customPictureId?: string,
  data:            string | {[stoneUID: string]:number},
  sphereId:        string,
  createdAt:       string,
  updatedAt:       string,
}

interface cloud_Scene_settable {
  name?:            string,
  stockPicture?:    string,
  customPictureId?: string,
  data?:            string,
  updatedAt?:       string | number
}


interface cloud_MessageState {
  id: string
  timestamp: string,
  enabled: string,
  syncedToCrownstone: string,
  messageDeliveredId: string,
  messageReadId: string,
  userId: string,
  sphereId: string,
  createdAt: string,
  updatedAt: string,
}

interface cloud_SphereTrackingNumber {
  id: string,
  trackingNumber:     number;
  trackingNumberId:   string,
  trackingNumberType: string,
  sphereId:  string,
  createdAt: string,
  updatedAt: string,
}

interface cloud_Toon {
  id: string,
  toonAgreementId: string,
  toonAddress: string,
  refreshToken: string,
  refreshTokenTTL: number;
  refreshTokenUpdatedAt: number;
  refreshTokenUpdatedFrom: number;
  schedule: string,
  updatedScheduleTime: number;
  changedToProgram: string,
  changedProgramTime: number;
  sphereId: string,
  createdAt: string,
  updatedAt: string,
}

interface cloud_Toon_settable {
  toonAgreementId: string,
  toonAddress: string,
  updatedAt: string,
}

interface ActiveDays {
  Mon: boolean;
  Tue: boolean;
  Wed: boolean;
  Thu: boolean;
  Fri: boolean;
  Sat: boolean;
  Sun: boolean;
}

interface cloud_Behaviour {
  id: string,
  type: string,
  data: string,
  syncedToCrownstone: boolean;
  idOnCrownstone: number;
  profileIndex: number;
  deleted: boolean;
  activeDays: ActiveDays;
  sphereId: string,
  stoneId: string,
  createdAt: string,
  updatedAt: string,
}

interface cloud_Behaviour_settable {
  type:               string,
  data:               string,
  syncedToCrownstone: boolean;
  idOnCrownstone:     number;
  profileIndex:       number;
  deleted:            boolean;
  activeDays:         ActiveDays;
  updatedAt:          string,
}



interface cloud_SwitchState {
  timestamp:   string,
  switchState: number
}
interface cloud_SphereAuthorizationTokens {
  [userId: string]: { role: string, token: string },
}

interface cloud_UserLocation {
  deviceId:   string,
  deviceName: string,
  inSpheres:  inSphereLocation[]
}

interface inSphereLocation {
  sphereId:   string,
  sphereName: string,
  inLocation: inSphereLocationData[]
}

interface inSphereLocationData {
  locationId:   string,
  locationName: string
}

interface Count {
  count: number
}