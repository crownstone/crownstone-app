import { CONDITIONS, PRESENCE_TYPES, TIME_TYPES } from "./enums";


let data = {
  time: {
    sunset: "06:30", // time of the sunset
    sunrise: "21:42", // time of the sunrise
    start: '',
    end:'',
  },
  presence: {
    roomId1: ["userId1","userId2"],
    roomId2: ["userId3","userId4"],
  }
}

// interpreter action:
function parse(rule, data) {
  // check if rule is started
  let started = null;
  let ended = null;

  let endedPrevious = null;

  let time = new Date().valueOf()

  let startedChecks = [];

  let always = false;
  rule.start.forEach((condition) => {
    let isActive = false;
    switch (condition) {
      case CONDITIONS.ALWAYS:
        always = true
        isActive = true;
        return;
      case CONDITIONS.TIME:
        isActive = parseTimeCondition(data, condition, "START", time, false ).active
        return
      case CONDITIONS.PRESENCE:
        isActive = parsePresenceCondition(data, condition)
        return
    }

    startedChecks.push(isActive);
  })

  // check if the rule has ended
  rule.end.forEach((condition) => {
    let isActive = false;
    switch (condition) {
      case CONDITIONS.ALWAYS:
        started = true;
        return;
      case CONDITIONS.TIME:
        endedPrevious = parseTimeCondition(data, condition,"END", time,false )
        ended         = parseTimeCondition(data, condition,"END", time,true  )
      case CONDITIONS.PRESENCE:
    }
  })

  // S = start
  // E = end of rule
  // ; = midnight
  // ! = user
  // ---- active time of rule
  // ____ rest of time
  if (started.active === true && endedPrevious === true && // after previous start and after previous end                     |__S---;--E__!__S---;--E__| or |__S---;--E_____S-!-;--E__|
      started.time > endedPrevious.time &&                 // previous start is later than previous end: eliminate this case: |__S---;--E__!__S---;--E__|
      !ended.active) {                                     // this one might be implied, but the end time of this rule is not past
    // rule is active!
  }


}


function parsePresenceCondition(data, condition) {
  // type is "START" or "END"
  let details = condition.data;
  let active = false

  switch (details.type) {
    case PRESENCE_TYPES.ANYBODY:
      details.locations.forEach((location) => {
        // if (hasUser) {
        //   active = true
        // }
      })
      break;
    case PRESENCE_TYPES.NOBODY:
      details.locations.forEach((location) => {
        // if (hasUser) {
        //   active = false
        // }
      })
      break;
    case PRESENCE_TYPES.SPECIFIC_USERS:
      details.locations.forEach((location) => {
        // if (hasUser) {
        //   active = true
        // }
      })
      break;
  }


  return active
}

function parseTimeCondition(data, condition, type, currentTime, upcoming) {
  // type is "START" or "END"
  let details = condition.data;
  let time = null;
  let active = false
  switch (details.type) {
    case TIME_TYPES.SUNRISE:
      time = getTimeFromMinutes(data.sunrise, upcoming)
      break;
    case TIME_TYPES.SUNSET:
      time = getTimeFromMinutes(data.sunset, upcoming)
      break;
    case TIME_TYPES.MIDNIGHT:
      time = getTimeFromMinutes("00:00", upcoming)
      break;
    case TIME_TYPES.NOON:
      time = getTimeFromMinutes("12:00", upcoming)
      break;
    case TIME_TYPES.SPECIFIC:
      time = getTimeFromMinutes(condition.value, upcoming)
  }

  // if start
  if (type === "START") {
    if (currentTime >= time) {
      active =  true;
    }
  }
  else {
    if (currentTime < time) {
      active =  true
    }
  }

  return {active: active, time: time}
}

function getTimeFromMinutes(minuteString, upcoming) {
  return 123
}