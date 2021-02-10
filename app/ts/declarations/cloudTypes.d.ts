type filter = string | number | RegExp

interface cloud_UserData {
  id: string,
  firstName: string,
  lastName: string
  language: "en_us" | "nl_nl",
  email: string,

  profilePicId?: string,
  createdAt: string,
  updatedAt: string,
}
interface cloud_Sphere {
  id: string,
  uid: number,
  uuid: string,
  name: string,
  aiName: string,
  meshAccessAddress: string,
  exitDelay: number,
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
  meshAccessAddress?: string,
  updatedAt: string,
}

interface cloud_Hub {
  id: string,
  name: string,
  sphereId: string,
  localIPAddress: string,
  linkedStoneId: string,
  locationId: string,
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
  id: string;
  name: string;
  address: string;
  description: string;
  type: string;
  dimmingEnabled: false;
  deviceType: string;
  major: number;
  minor: number;
  uid: number;
  icon: string;
  json: string;
  touchToToggle: boolean;
  tapToToggle: boolean;
  firmwareVersion: string;
  bootloaderVersion: string;
  hardwareVersion: string;
  onlyOnWhenDark: boolean;
  hidden: boolean;
  locked: boolean;
  switchCraft: boolean;
  meshDeviceKey: string;
  locationId: string;
  sphereId: string;
  createdAt: string;
  updatedAt: string;
  currentPowerUsageId: string;
  currentEnergyUsageId: string;
  applianceId: string;
  currentSwitchState?: cloud_SwitchState,
  currentSwitchStateId: string;
  abilities?: cloud_Ability[];
}



interface cloud_Ability {
  type: 'dimming' | 'switchcraft' | 'tapToToggle';
  enabled: boolean;
  syncedToCrownstone: boolean;
  id: string;
  stoneId: string;
  sphereId: string;
  createdAt: string;
  updatedAt: string;
  properties: any[];
}


interface SpherePresentPeople {
  userId: string;
  locations: [];
}


interface cloud_Location {
  name: string,
  uid: number,
  icon: string,
  id: string,
  sphereId:  string,
  createdAt: string,
  updatedAt: string,
}

interface cloud_User {

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
  triggerEvent: string;
  content: string;
  everyoneInSphere: boolean;
  everyoneInSphereIncludingOwner: boolean;
  deliveredAll: boolean;
  triggerLocationId: string;
  ownerId: string;
  recipients: cloud_User[];
  delivered: cloud_MessageState[];
  read: cloud_MessageState[];
  sphereId: string;
  createdAt: string,
  updatedAt: string,
}

interface cloud_Scene {
  id: string,
  name: string;
  stockPicture: string;
  customPictureId: string;
  data: string;
  sphereId: string;
  createdAt: string,
  updatedAt: string,
}


interface cloud_MessageState {
  id: string
  timestamp: string;
  enabled: string;
  syncedToCrownstone: string;
  messageDeliveredId: string;
  messageReadId: string;
  userId: string;
  sphereId: string;
  createdAt: string,
  updatedAt: string,
}

interface cloud_SphereTrackingNumber {
  id: string,
  trackingNumber: number;
  trackingNumberId: string;
  trackingNumberType: string;
  sphereId: string;
  createdAt: string,
  updatedAt: string,
}

interface cloud_Toon {
  id: string,
  toonAgreementId: string;
  toonAddress: string;
  refreshToken: string;
  refreshTokenTTL: number;
  refreshTokenUpdatedAt: number;
  refreshTokenUpdatedFrom: number;
  schedule: string;
  updatedScheduleTime: number;
  changedToProgram: string;
  changedProgramTime: number;
  sphereId: string;
  createdAt: string,
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
  type: string;
  data: string;
  syncedToCrownstone: boolean;
  idOnCrownstone: number;
  profileIndex: number;
  deleted: boolean;
  activeDays: ActiveDays;
  sphereId: string;
  stoneId: string;
  createdAt: string,
  updatedAt: string,
}

interface cloud_AbilityProperty {
  id: string,
  type: string;
  value: string;
  abilityId: string;
  sphereId: string;
  stoneId: string;
  createdAt: string,
  updatedAt: string,
}



interface cloud_SwitchState {
  timestamp: string,
  switchState: number
}
interface cloud_SphereAuthorizationTokens {
  [userId: string]: { role: string, token: string },
}

interface cloud_UserLocation {
  deviceId: string,
  deviceName: string,
  inSpheres: inSphereLocation[]
}

interface inSphereLocation {
  sphereId: string,
  sphereName: string,
  inLocation: inSphereLocationData[]
}

interface inSphereLocationData {
  locationId: string,
  locationName: string
}

interface cloud_sphereUserDataSet {
  admins:  cloud_UserData[],
  members: cloud_UserData[],
  guests:  cloud_UserData[],
}


interface Count {
  count: number
}