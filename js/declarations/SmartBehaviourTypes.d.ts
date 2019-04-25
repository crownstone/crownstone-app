type aicorePresenceType   = "SOMEBODY" | "NOBODY"  | "IGNORE"  | "SPECIFIC_USERS"
type sunTimes             = "SUNSET"   | "SUNRISE"

type aicorePresenceGeneric  = { type: "SOMEBODY" | "NOBODY", data: aicorePresenceSphereData | aicorePresenceLocationData | aicorePresenceStoneLocationData, delay: number }
type aicorePresenceSpecific = { type: "SPECIFIC_USERS",      data: aicorePresenceSphereData | aicorePresenceLocationData | aicorePresenceStoneLocationData, delay: number, profileIds:number[] }
type aicorePresenceNone     = { type: "IGNORE" }
type aicorePresence         = aicorePresenceGeneric | aicorePresenceSpecific | aicorePresenceNone


type aicorePresenceSphereData   = { type: "SPHERE" }
type aicorePresenceLocationData = { type: "LOCATION", locationIds: string[] }
type aicorePresenceStoneLocationData = { type: "IN_STONE_LOCATION", locationIds: string[] }

type aicoreTimeAlways   = { type: "ALL_DAY" }
type aicoreTimeRange    = { type: "RANGE", from: aicoreTimeData, to: aicoreTimeData }
type aicoreTimeRangeTwilight = { from: aicoreTimeData, to: aicoreTimeData }
type aicoreTime         = aicoreTimeAlways | aicoreTimeRange

type aicoreTimeDataSun   = { type: sunTimes, offsetMinutes: number}
type aicoreTimeDataClock = { type: "CLOCK", data: cron }
type aicoreTimeData      = aicoreTimeDataSun | aicoreTimeDataClock

interface aicoreBehaviourOptions {
  type: "SPHERE_PRESENCE_AFTER" | "LOCATION_PRESENCE_AFTER"
}

type cron = {
  minutes:    number,
  hours:      number,
  dayOfMonth: string,   // allowed values are: 1-31 , - * (comma for set, hyphen for range, star for any) currently only * is supported.
  month:      string,   // allowed values are: 1-12 , - * (comma for set, hyphen for range, star for any) currently only * is supported.
}


// Active days are defined on when the FROM time starts.
// When there is no from time (type ALL_DAY), the days are from sunrise to sunrise!
type dayOfWeek = {
  Mon: boolean,
  Tue: boolean,
  Wed: boolean,
  Thu: boolean,
  Fri: boolean,
  Sat: boolean,
  Sun: boolean
}

type eventAction = { type: "TURN_ON",  fadeDuration: number, data: number } |
                   { type: "TURN_OFF", fadeDuration: number }               |
                   { type: "COPY_STATE" | "TOGGLE" | "PULSE" }

type eventCondition = { type: "PRESENCE", data: aicorePresence } |
                      { type: "TIME", from: aicoreTimeData, to: aicoreTimeData }


// TYPE: behaviour
interface behaviour {
  action: {
    type: "BE_ON",
    data: number, // 0 .. 1
  },
  time: aicoreTime,
  presence: aicorePresence,
  options?: aicoreBehaviourOptions
}

// TYPE: TWILIGHT
interface twilight {
  action:  {
    type: "DIM_WHEN_TURNED_ON",
    data: number,
  },
  time: aicoreTimeRangeTwilight,
}

// TYPE: EVENT
// events can trigger a switch event. The handleSwitch rule will determine how the aicore responds to this. The PULSE event type will not influence this.
type aicoreEvent = {
  type:       "TIME",
  action:     eventAction,
  effect:     effectData,
  conditions: eventCondition[],
  time:       aicoreTimeData,
} | {
  type:       "PRESENCE_ENTER" | "PRESENCE_EXIT",
  action:     eventAction,
  effect:     effectData,
  conditions: eventCondition[],
  presence:   aicorePresenceData,
} | {
  type:       "OTHER_CROWNSTONE_STATE_CHANGE" | "OTHER_CROWNSTONE_SWITCHCRAFT",
  action:     eventAction,
  effect:     effectData,
  conditions: eventCondition[],
  crownstoneId: number[],
} | {
  type:       "POWER_THRESHOLD_LOWER" | "POWER_THRESHOLD_HIGHER",
  action:     eventAction,
  effect:     effectData,
  conditions: eventCondition[],
  threshold:  number,
} | {
  type:       "SWITCHCRAFT" | "MANUAL_BLE_SWITCH",
  action:     eventAction,
  effect:     effectData,
  conditions: eventCondition[],
}


// RULE: How to respond to a switch or event
interface effectData {
  type: aicoreEffectTypes,
  delayBeforeEffect: number // override in minutes after which the type of the effect will commence
}

// This described how the aicore rules will react to a user evented switch command (App or Switchcraft)
type aicoreEffectTypes = "DISABLE_ALL_RULES"           |  // stop the rules until turned back on
                         "ENABLE_ALL_RULES"            |  // reable previously stopped rules.
                         "VALID_UNTIL_NEXT_RULE_START" |  // if the rule is from 8:00 to 21:00 and we change the state, the crownstone rules will continue after 21:00 (TOON method)
                         "VALID_UNTIL_STATE_MATCH"     |  // if the rule is from 8:00 to 21:00 and we change the state from ON to OFF, once the active rule thinks "my state should be OFF now", the rule is unpaused.
                         "NO_EFFECT"                      // do NOT respond to interaction from a user.
                                                              // Together with delayBeforeEffect 0, this would lead to a locked crownstone that ignores manual switch events.
                                                              // With a delayBeforeEffect > 0, this gives a temporary manual override.

// SwitchCraft
/*
let switchcraftEvent = {
  type: "SWITCHCRAFT",
  action: {
    type: "TOGGLE"
  },
  effect: {
    type: "RESUME_ON_STATE_MATCH",
    delayBeforeEffect: 10 // it will remain in the toggled state for 10 minutes, after which the pause action goes into effect.
  }
  conditions: []
}
*/


// Wake up light
/*
let wakeupLightEvent = {
  type:"TIME",
  action: {
    type:"TURN_ON",
    fadeDuration: 900,
    data: 1
  },
  effect: {
    type: "NO_EFFECT" // 60 minutes after the light is 100% on, we resume the behaviour.
    delayBeforeEffect: 60,
  },
  conditions: [{
    type: "PRESENCE", data: {
      type: "SOMEBODY", data: { type: "SPHERE", delay: null }
    }
  }],
  time: {
    type: "CLOCK",
    data: {
      minutes: 0,
      hours:   7,
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: {
        Mon: true,
        Tue: true,
        Wed: true,
        Thu: true,
        Fri: true,
        Sat: false,
        Sun: false
      }
    }
  }
}
*/


// Soft fuse @ 100 W
/*
let softFuseEvent = {
  type: "POWER_THRESHOLD_HIGHER",
  action: {
    type:"TURN_OFF",
    fadeDuration: 900
  },
  effect: {
    type: "DISABLE_ALL_RULES"
    delayBeforeEffect: 0,
  },
  conditions: [],
  threshold: 100,
}
 */