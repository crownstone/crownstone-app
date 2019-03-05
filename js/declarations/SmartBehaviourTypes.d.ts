
type behaviourActionType     = "TURN_ON"    | "DIM_WHEN_TURNED_ON"
type behaviourLocationType   = "HOME"       | "SPECIFIC_LOCATIONS"
type behaviourTimeType       = "ALWAYS"     | "FROM_TO"
type behaviourSelectableType = "ACTION"     | "PRESENCE" | "LOCATION"    | "TIME"
type behaviourPresenceType   = "SOMEBODY"   | "NOBODY"   | "IGNORE"      | "SPECIFIC_USERS"
type behaviourTimeDetailType = "DARK_START" | "DARK_END" | "LIGHT_START" | "LIGHT_END" | "SPECIFIC"

interface behaviourAction {
  type:         behaviourActionType,
  fadeDuration: number, // minutes
  data:         number,
}
interface behaviourPresence {
  type:       behaviourPresenceType,
  data:       behaviourPresenceData,
}
interface behaviourPresenceData {
  type:        behaviourLocationType,
  locationIds: string[]
}

interface   behaviourTime {
  type:     behaviourTimeType,
  data:     behaviourTimeData | null,
}
interface behaviourTimeData {
  from:     behaviourTimeDetailData,
  to:       behaviourTimeDetailData,
}
interface behaviourTimeDetailData {
  type:     behaviourTimeDetailType,
  data:     string, // "22:32"
  offset:   behaviourOffsetDetails // no offset for specific times.
}
interface behaviourOffsetDetails {
  minutes:     number,
  variation:   number // +- amount of minutes (not used at the moment)
}

interface behaviourDayFlags {
  Mon: boolean,
  Tue: boolean,
  Wed: boolean,
  Thu: boolean,
  Fri: boolean,
  Sat: boolean,
  Sun: boolean,
}


interface behaviour {
  action:   behaviourAction,
  presence: behaviourPresence,
  time:     behaviourTime,
  repeat:   behaviourDayFlags

}