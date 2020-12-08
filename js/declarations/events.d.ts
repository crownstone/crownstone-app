interface EventFilter {
  type?:     "presence"  | "command" | "*" | "all",
  // stoneIds?  : { [key: string]: boolean }, // only get events from this Crownstone
  sphereIds? : { [key: string]: boolean }
}

type oauthScope = "all" | "user_location" | "stone_information" | "sphere_information" | "switch_stone" | "location_information" | "user_information" | "power_consumption" | "user_id";

interface ScopeFilter {
  [key: string]: {
    [key: string] : (arg0: any) => boolean
  }
}

interface AccessModel {
  accessToken: string,
  ttl: number,
  createdAt: number,
  userId: string,
  spheres: {
    [key: string] : boolean
  },
  scopes: oauthScope[]
}

type SseEvent = SseSystemEvent | SseDataEvent
type SseSystemEvent = SystemEvent | PingEvent
type SseDataEvent = SwitchStateUpdateEvent     |
  MultiSwitchCrownstoneEvent |
  SphereTokensUpdatedEvent   |
  PresenceSphereEvent        |
  PresenceLocationEvent      |
  DataChangeEvent            |
  AbilityChangeEvent         |
  InvitationChangeEvent

interface PingEvent {
  type:    "ping",
  counter:  number,
}

type SystemSubType = "TOKEN_EXPIRED" | "NO_ACCESS_TOKEN" | "NO_CONNECTION" | "STREAM_START" | "STREAM_CLOSED" | "COULD_NOT_REFRESH_TOKEN"
interface SystemEvent {
  type:    "system",
  subType:  SystemSubType,
  code:     number,
  message:  string,
}

interface MultiSwitchCrownstoneEvent {
  type:        "command",
  subType:     "multiSwitch"
  sphere:      sseSphereData,
  switchData:  sseCrownstoneSwitchCommand[],
}

interface PresenceSphereEvent {
  type:     "presence",
  subType:  "enterSphere" | "exitSphere"
  user:     sseUserData,
  sphere:   sseSphereData
}

interface PresenceLocationEvent {
  type:     "presence",
  subType:  "enterLocation" | "exitLocation"
  user:     sseUserData,
  sphere:   sseSphereData,
  location: sseLocationData,
}

interface DataChangeEvent {
  type:        "dataChange",
  subType:     "users"   | "spheres" | "stones" | "locations",
  operation:   "create"  | "delete"  | "update"
  sphere:      sseSphereData,
  changedItem: NameIdSet,
}

interface SphereTokensUpdatedEvent {
  type:        "sphereTokensChanged",
  subType:     "sphereAuthorizationTokens",
  operation:   "update"
  sphere:      sseSphereData,
}

interface AbilityChangeEvent {
  type:        "abilityChange",
  subType:     "dimming"   | "switchcraft" | "tapToToggle",
  sphere:      sseSphereData,
  stone:       sseCrownstoneData,
  ability:     sseAbilityData
}

interface InvitationChangeEvent {
  type:        "invitationChange",
  operation:   "invited" | "invitationRevoked"
  sphere:      sseSphereData,
  email:       string,
}
interface SwitchStateUpdateEvent {
  type:        'switchStateUpdate',
  subType:     'stone',
  sphere:       sseSphereData,
  crownstone:   sseCrownstoneSwitchState,
}

interface NameIdSet {
  id:   string,
  name: string
}
interface sseSphereData     extends NameIdSet {
  uid: number
}
interface sseUserData       extends NameIdSet {}
interface sseLocationData   extends NameIdSet {}
interface sseCrownstoneData extends NameIdSet {
  macAddress: string,
  uid: number,
}
interface sseCrownstoneSwitchState extends sseCrownstoneData {
  percentage: number, // 0 .. 100
}

interface sseCrownstoneSwitchCommand extends sseCrownstoneData {
  type: "TURN_ON" | "TURN_OFF" | "PERCENTAGE"
  percentage?: number, // 0 .. 100
}



interface sseAbilityData {
  type: string,
  enabled: boolean,
  syncedToCrownstone: boolean,
}


type RoutingMap = {
  all: ArrayMap,
  presence: ArrayMap,
  command: ArrayMap,
}
type ArrayMap = { [key: string] : string[] }