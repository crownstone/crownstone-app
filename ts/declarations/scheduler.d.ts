interface bridgeScheduleEntry {
  scheduleEntryIndex?    : number, // 0 .. 9
  nextTime               : number, // timestamp since epoch in seconds
  switchState            : number, // 0 .. 1
  fadeDuration           : number, // # seconds
  intervalInMinutes      : number, // # minutes
  ignoreLocationTriggers : boolean,
  active                 : boolean,
  repeatMode             : "24h" | "minute" | "none",
  activeMonday           : boolean,
  activeTuesday          : boolean,
  activeWednesday        : boolean,
  activeThursday         : boolean,
  activeFriday           : boolean,
  activeSaturday         : boolean,
  activeSunday           : boolean,
}



