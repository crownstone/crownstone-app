import {
  AICORE_LOCATIONS_TYPES,
  AICORE_PRESENCE_TYPES,
  AICORE_TIME_DETAIL_TYPES,
  AICORE_TIME_TYPES
} from "../../../../Enums";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { core } from "../../../../core";
import { AicoreTimeData } from "./AicoreTimeData";
import { AicoreBehaviour } from "./AicoreBehaviour";
import { AicoreTwilight } from "./AicoreTwilight";
import { BEHAVIOUR_TYPES } from "../../../../router/store/reducers/stoneSubReducers/rules";
import { DAY_INDICES_MONDAY_START, DAY_INDICES_SUNDAY_START } from "../../../../Constants";
import { Util } from "../../../../util/Util";
import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from "../../../../ExternalConfig";
import { Alert } from "react-native";
import {
  enoughCrownstonesInLocationsForIndoorLocalization, requireMoreFingerprints
} from "../../../../util/DataUtil";
const SunCalc = require('suncalc');


export const AicoreUtil = {

  extractActionString(rule : behaviour | twilight) {
    if (rule.action.type === "DIM_WHEN_TURNED_ON") {
      return "I'll dim to " + Math.round(rule.action.data ) + "% instead";
    }
    if (rule.action.data < 100) {
      return "dimmed at " + Math.round(rule.action.data) + "%";
    }
    else if (rule.action.data == 100) {
      return "on";
    }
  },

  extractPresenceStrings(rule : behaviour) : {presencePrefix: string, presenceStr: string} {
    let presencePrefix = null;
    let presenceStr = null;
    switch (rule.presence.type) {
      case AICORE_PRESENCE_TYPES.SOMEBODY:
        presencePrefix = "if";
        presenceStr   = "somebody";
        break;
      case AICORE_PRESENCE_TYPES.NOBODY:
        presencePrefix = "if";
        presenceStr   = "nobody";
        break;
      case AICORE_PRESENCE_TYPES.SPECIFIC_USERS:
        presenceStr = null; break; // TODO: implement profiles
      case AICORE_PRESENCE_TYPES.IGNORE:
        presenceStr = null; break;
    }

    return { presencePrefix, presenceStr };
  },

  extractLocationStrings(rule : behaviour, sphereId: string) {
    let locationPrefix = "";
    let locationStr = "";
    if (rule.presence.type !== AICORE_PRESENCE_TYPES.IGNORE) {
      // @ts-ignore
      let pd = rule.presence.data as aicorePresenceData;

      switch (pd.type) {
        case AICORE_LOCATIONS_TYPES.SPHERE:
          locationPrefix = "is";
          locationStr = "home";
          break;
        case AICORE_LOCATIONS_TYPES.LOCATION:
          if (pd.locationIds.length > 0) {
            locationPrefix = "is in the";
            // we will now construct a roomA_name, roomB_name or roomC_name line.
            locationStr = AicoreUtil.getLocationNameFromUid(sphereId, pd.locationIds[0]);
            if (pd.locationIds.length > 1) {
              for (let i = 1; i < pd.locationIds.length - 1; i++) {
                let locationUid = pd.locationIds[i];
                let locationName = AicoreUtil.getLocationNameFromUid(sphereId, locationUid);
                locationStr += ", " + locationName;
              }

              locationStr += " or " + AicoreUtil.getLocationNameFromUid(sphereId, pd.locationIds[pd.locationIds.length - 1]);
            }
          }
      }
    }

    return { locationPrefix, locationStr };
  },


  extractTimeString(rule : behaviour | twilight, forceBetween = false) {
    let timeStr = "";

    let time = rule.time;
    // @ts-ignore
    if (time.type === undefined || time.type != AICORE_TIME_TYPES.ALL_DAY) {
      let tr = time as aicoreTimeRange;
      let noOffset = (tr.from as aicoreTimeDataSun).offsetMinutes === 0 && (tr.to as aicoreTimeDataSun).offsetMinutes === 0;
      if ((tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNRISE && tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNSET) && noOffset) {
        // "while the sun is up"
        timeStr = "while the sun is up";
      }
      else if ((tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNSET && tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNRISE) && noOffset) {
        // "while its dark outside"
        timeStr = "while it's dark outside";
      }
      else if (tr.from.type === AICORE_TIME_DETAIL_TYPES.CLOCK && tr.to.type === AICORE_TIME_DETAIL_TYPES.CLOCK || forceBetween) {
        // this makes "between X and Y"
        let fromStr = AicoreUtil.getTimeStr(tr.from);
        let toStr   = AicoreUtil.getTimeStr(tr.to);
        timeStr = "between " + fromStr + " and " + toStr;
      }
      else if (tr.from.type === AICORE_TIME_DETAIL_TYPES.CLOCK && (tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNSET)) {
        // this makes "from xxxxx until xxxxx"
        let fromStr = AicoreUtil.getTimeStr(tr.from);
        let toStr   = AicoreUtil.getTimeStr(tr.to);
        timeStr = "from " + fromStr + " until " + toStr;
      }
      else if (tr.to.type === AICORE_TIME_DETAIL_TYPES.CLOCK && (tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNSET)) {
        // this makes "from xxxxx until xxxxx"
        let fromStr = AicoreUtil.getTimeStr(tr.from);
        let toStr   = AicoreUtil.getTimeStr(tr.to);
        timeStr = "from " + fromStr + " until " + toStr;
      }
      else {
        // these are "from xxxxx to xxxxx"
        let fromStr = AicoreUtil.getTimeStr(tr.from);
        let toStr   = AicoreUtil.getTimeStr(tr.to);
        timeStr = "from " + fromStr + " to " + toStr;
      }
    }

    return timeStr;
  },


  extractEndConditionStrings(rule : behaviour) {
    let endConditionPrefix = "";
    let endConditionStr= "";
    if (rule.endCondition && rule.endCondition.type) {
      switch (rule.endCondition.presence.data.type) {
        case "SPHERE":
          endConditionPrefix += "Afterwards, I'll";
          endConditionStr += "stay on if someone is still at home";
          break;
        case "LOCATION":
          endConditionPrefix += "Afterwards, I'll";
          endConditionStr += "stay on if someone is still in the room";
          break;
      }
    }
    return {endConditionPrefix, endConditionStr};
  },


  getLocationNameFromUid(sphereId: string, locationUID: number) {
    let locationData = MapProvider.locationUIDMap[sphereId][locationUID]
    if (locationData) {
      return locationData.name;
    }
    return "(deleted location)";
  },


  getSunsetTimeString(sphereId: string) {
    let sunTimes = Util.getSunTimes(sphereId);
    let sunsetTime  = sunTimes.sunset;
    return AicoreUtil.getClockTimeStr(new Date(sunsetTime).getHours(), new Date(sunsetTime).getMinutes());
  },

  getClockTimeStr(hours, minutes) {
    return hours + ":" + (minutes < 10 ? "0" + minutes : minutes);
  },

  getSunTimeStr(timeObj : aicoreTimeDataSun) {
    // TYPE IS SUNSET/SUNRISE
    let obj = (timeObj as aicoreTimeDataSun);
    let str = "";
    if (obj.offsetMinutes !== 0) {
      let getTimeNotation = function(mins) {
        mins = Math.abs(mins);
        if (mins%60 === 0) {
          let hours = mins/60;
          if (hours === 1) {
            return "1 hour";
          }
          return hours + " hours"
        }
        else if (mins < 60) {
          return mins + " minutes"
        }
        else {
          return Math.floor(mins/60) + " hrs, " + mins%60 + ' mins'
        }
      };

      if (obj.offsetMinutes < 0) {
        str += getTimeNotation(obj.offsetMinutes) + " before "
      }
      else {
        str += getTimeNotation(obj.offsetMinutes) + " after "
      }
    }
    if (obj.type === "SUNSET") {
      str += "sunset"
    }
    else if (obj.type === "SUNRISE") {
      str += "sunrise"
    }
    return str;
  },

  getTimeStr(timeObj: aicoreTimeData) {
    if (timeObj.type === "CLOCK") {
      // TYPE IS CLOCK
      let obj = (timeObj as aicoreTimeDataClock).data;
      return AicoreUtil.getClockTimeStr(obj.hours, obj.minutes);
    }
    else {
      return AicoreUtil.getSunTimeStr(timeObj);
    }
  },

  isSameTime(fromTime : AicoreTimeData, toTime: AicoreTimeData) : boolean {
    return AicoreUtil.getTimeStr(fromTime.data) === AicoreUtil.getTimeStr(toTime.data);
  },


  getWordLength(word) {
    let result = 0;
    let letterWidthMap = { I: 4, " ": 5, m: 16, w: 16, rest: 11, ".": 2 };
    for (let i = 0; i < word.length; i++) {
      if (word[i]) {
        result += letterWidthMap[word[i]] || letterWidthMap.rest;
      }
    }
    return result;
  },

  getTimeStrInTimeFormat(timeObj : aicoreTimeData, sphereId) {
    let timeData = AicoreUtil.getClockTime(timeObj, sphereId);
    return AicoreUtil.getClockTimeStr(timeData.hours, timeData .minutes);
  },

  getClockTime(timeObj, sphereId){
    if (timeObj.type === "CLOCK") {
      // TYPE IS CLOCK
      let obj = (timeObj as aicoreTimeDataClock).data;
      return {hours:obj.hours, minutes: obj.minutes}
    }
    else {
      let state = core.store.getState();
      let sphere = state.spheres[sphereId];

      // position of Crownstone HQ.
      let lat = 51.923611570463152;
      let lon = 4.4667693378575288;
      if (sphere) {
        lat = sphere.config.latitude  || lat;
        lon = sphere.config.longitude || lon;
      }
      let baseTime = 0;
      var times = SunCalc.getTimes(new Date(), lat, lon);

      let obj = (timeObj as aicoreTimeDataSun);
      if (obj.type === "SUNSET") {
        baseTime = new Date(times.sunset).valueOf();
      }
      else if (obj.type === "SUNRISE") {
        baseTime = new Date(times.sunriseEnd).valueOf();
      }


      if (obj.offsetMinutes !== 0) {
        baseTime += 60*1000*obj.offsetMinutes;
      }

      return {hours: new Date(baseTime).getHours(), minutes: new Date(baseTime).getMinutes()}
    }
  },

  isTimeBeforeOtherTime(time, otherTime, sphereId) {
    return AicoreUtil.getMinuteDifference(time, otherTime, sphereId) > 0;
  },

  getMinuteDifference(time, otherTime, sphereId) {
    let timeValue  = AicoreUtil.getMinuteValue(time, sphereId);
    let otherValue  = AicoreUtil.getMinuteValue(otherTime, sphereId);
    return timeValue - otherValue;
  },

  getMinuteValue(time, sphereId) {
    let timeData = AicoreUtil.getClockTime(time, sphereId);
    return timeData.hours*60 + timeData.minutes;
  },


  /**
   * A and B are full rules from the database;
   * @param a
   * @param b
   */
  aStartsBeforeB(a, b, sphereId) : boolean {
    let aR = null;
    let bR = null;
    if (a.type === BEHAVIOUR_TYPES.twilight) {
      aR = new AicoreTwilight(a.data);
    }
    else {
      aR = new AicoreBehaviour(a.data);
    }
    if (b.type === BEHAVIOUR_TYPES.twilight) {
      bR = new AicoreTwilight(b.data);
    }
    else {
      bR = new AicoreBehaviour(b.data);
    }


    if (bR.rule.time.type === "ALL_DAY" && aR.rule.time.type === "ALL_DAY") { return false; }
    if (aR.rule.time.type === "ALL_DAY" && bR.rule.time.type !== "ALL_DAY") { return true; }
    if (aR.rule.time.type !== "ALL_DAY" && bR.rule.time.type === "ALL_DAY") { return false; }

    return AicoreUtil.isTimeBeforeOtherTime(aR.rule.time.from, bR.rule.time.from, sphereId)
  },

  //
  // /**
  //  * A and B are full rules from the database;
  //  * This will return the induced overlap if you enable A on the forDay, given that rule B already exists.
  //  * @param a
  //  * @param b
  //  * @param forDay ("Mon", "Tue" etc.
  //  */
  // getOverlapData(a, b, forDay, sphereId) {
  //   let aR = null;
  //   let bR = null;
  //
  //   let result = {
  //     overlapMins:           0,
  //     aPercentageOverlapped: 0,
  //     bPercentageOverlapped: 0,
  //     aUsesPresence:         aR.isUsingPresence(),
  //     bUsesPresence:         bR.isUsingPresence()
  //   }
  //
  //   // only comparible data types can be compared.
  //   if (a.type !== b.type) {
  //     return result;
  //   }
  //
  //   if (a.type === BEHAVIOUR_TYPES.twilight) { aR = new AicoreTwilight(a.data);  }
  //   else                                     { aR = new AicoreBehaviour(a.data); }
  //   if (b.type === BEHAVIOUR_TYPES.twilight) { bR = new AicoreTwilight(b.data);  }
  //   else                                     { bR = new AicoreBehaviour(b.data); }
  //
  //
  //
  //   let aTime = aR.rule.time;
  //   let bTime = bR.rule.time;
  //
  //   let today       = dayArray.indexOf(forDay);
  //   let previousDay = (today + 6) % 7;
  //
  //   let midNight = 24*60;
  //   let dayMinutesStart = 4*60;
  //   let dayLength = 24*60;
  //
  //   let bYesterday = b.activeDays[dayArray[previousDay]];
  //   let bToday     = b.activeDays[forDay];
  //
  //   if (aTime.type === "ALL_DAY" && bTime.type === "ALL_DAY" && bToday) {
  //     result.overlapMins = dayLength;
  //     result.aPercentageOverlapped = 1;
  //     result.bPercentageOverlapped = 1;
  //     return result;
  //   }
  //   else if (aTime.type === "ALL_DAY" && bTime.type === "ALL_DAY") { // this implies that they are not active on the same day
  //     // no overlap
  //     return result;
  //   }
  //   else if (aTime.type === "ALL_DAY" && bTime.type !== "ALL_DAY") {
  //     // the day lasts from 04:00 until 04:00 the next day.
  //
  //     // if we enable A, this means that the new timeslots are:
  //     // 04:00 - 23:59:00 today and 00:00 - 04:00 tomorrow.
  //
  //     let bMinutesStart = AicoreUtil.getMinuteValue(bTime.from, sphereId);
  //     let bMinutesEnd   = AicoreUtil.getMinuteValue(bTime.to,   sphereId);
  //     let bCrossDay     = bMinutesStart >= bMinutesEnd;
  //     let bLength = bCrossDay ? midNight - bMinutesStart + bMinutesEnd : bMinutesEnd - bMinutesStart;
  //
  //     if (bCrossDay) {
  //       if (bYesterday) {
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([dayMinutesStart, midNight], [0, bMinutesEnd]);
  //       }
  //       if (bToday) {
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([dayMinutesStart, midNight], [bMinutesStart, midNight]);
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0,       dayMinutesStart],  [0,          bMinutesEnd]);
  //       }
  //     }
  //     else if (bToday) {
  //       result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([dayMinutesStart, midNight], [bMinutesStart, bMinutesEnd]);
  //     }
  //
  //     result.aPercentageOverlapped = result.overlapMins / dayLength;
  //     result.bPercentageOverlapped = result.overlapMins / bLength;
  //     return result;
  //   }
  //   else if (aTime.type !== "ALL_DAY" && bTime.type === "ALL_DAY") {
  //     // if we enable A, this means that the new timeslots are:
  //     // IF we are crossDay:
  //     // aMinutesStart - 23:59:59 today and 00:00 - aMinutesEnd tomorrow.
  //     // IF not:
  //     // aMinutesStart - aMinutesEnd
  //
  //     let aMinutesStart = AicoreUtil.getMinuteValue(aTime.from, sphereId);
  //     let aMinutesEnd   = AicoreUtil.getMinuteValue(aTime.to,   sphereId);
  //     let aCrossDay = aMinutesStart >= aMinutesEnd;
  //     let aLength = aCrossDay ? midNight - aMinutesStart + aMinutesEnd : aMinutesEnd - aMinutesStart;
  //
  //     if (aCrossDay) {
  //       if (bYesterday) {
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0, dayMinutesStart], [aMinutesStart, midNight]);
  //       }
  //       if (bToday) {
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([dayMinutesStart, midNight], [aMinutesStart, midNight]);
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0, dayMinutesStart], [0, aMinutesEnd]);
  //       }
  //     }
  //     else if (bToday) {
  //       result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([dayMinutesStart, midNight], [aMinutesStart, aMinutesEnd]);
  //     }
  //
  //     result.aPercentageOverlapped = result.overlapMins / aLength;
  //     result.bPercentageOverlapped = result.overlapMins / dayLength;
  //     return result;
  //   }
  //
  //   // handle individual clock times.
  //   // if we enable A, this means that the new timeslots are:
  //   // IF we are crossDay:
  //   // aMinutesStart - 23:59:00 today and 00:00 - aMinutesEnd tomorrow.
  //   // IF not:
  //   // aMinutesStart - aMinutesEnd
  //
  //   let aMinutesStart = AicoreUtil.getMinuteValue(aTime.from, sphereId);
  //   let aMinutesEnd   = AicoreUtil.getMinuteValue(aTime.to,   sphereId);
  //   let aCrossDay = aMinutesStart > aMinutesEnd;
  //   let aLength = aCrossDay ? midNight - aMinutesStart + aMinutesEnd : aMinutesEnd - aMinutesStart;
  //
  //   let bMinutesStart = AicoreUtil.getMinuteValue(bTime.from, sphereId);
  //   let bMinutesEnd   = AicoreUtil.getMinuteValue(bTime.to,   sphereId);
  //   let bCrossDay     = bMinutesStart > bMinutesEnd;
  //   let bLength = bCrossDay ? midNight - bMinutesStart + bMinutesEnd : bMinutesEnd - bMinutesStart;
  //
  //   if (aCrossDay) {
  //     if (bCrossDay) {
  //       if (bYesterday) {
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0, bMinutesEnd], [aMinutesStart, midNight]);
  //       }
  //       if (bToday) {
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([bMinutesStart, midNight], [aMinutesStart,midNight]);
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0, bMinutesEnd],          [0, aMinutesEnd]);
  //       }
  //     }
  //     else if (bToday) {
  //       result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([bMinutesStart, bMinutesEnd], [aMinutesStart, midNight]);
  //     }
  //   }
  //   else {
  //     if (bCrossDay) {
  //       if (bYesterday) {
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0, bMinutesEnd], [aMinutesStart, aMinutesEnd]);
  //       }
  //       if (bToday) {
  //         result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([bMinutesStart, midNight], [aMinutesStart,aMinutesEnd]);
  //       }
  //     }
  //     else if (bToday) {
  //       result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([bMinutesStart, bMinutesEnd], [aMinutesStart, aMinutesEnd]);
  //     }
  //   }
  //
  //   result.aPercentageOverlapped = result.overlapMins / aLength;
  //   result.bPercentageOverlapped = result.overlapMins / bLength;
  //   return result;
  // },

  canBehaviourUseIndoorLocalization(sphereId, endLine: string, rule=null) {
    if (!rule || rule.isUsingSingleRoomPresence() || rule.isUsingMultiRoomPresence() || rule.hasLocationEndCondition()) {
      let state = core.store.getState();

      // are there enough?
      let enoughForLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, sphereId);

      // do we need more fingerprints?
      let requiresFingerprints = requireMoreFingerprints(state, sphereId);

      if (enoughForLocalization === false) {
        Alert.alert(
          "Indoor localization not available...",
          "We need at least " + AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION + " Crownstones to be able to determine which room you're in.\n\n" +
          endLine, [{text:"OK"}]
        );
        return false;
      }
      else if (enoughForLocalization && requiresFingerprints) {
        Alert.alert(
          "Not all rooms are trained yet!",
          "Make sure you train all the rooms in your Sphere in order to enable indoor localization.", [{text:"OK"}]
        );
        return true;
      }

      return true;
    }

  },

  /**
   * A and B are full rules from the database;
   * This will return the induced overlap if you enable A on the forDay, given that rule B already exists.
   * @param a
   * @param b
   * @param forDay ("Mon", "Tue" etc.
   */
  getOverlapData(a, b, forDay, sphereId) {
    let aR = null;
    let bR = null;

    let result = {
      overlapMins:           0,
      aPercentageOverlapped: 0,
      bPercentageOverlapped: 0,
    }

    // only comparible data types can be compared.
    if (a.type !== b.type) {
      return result;
    }

    if (a.type === BEHAVIOUR_TYPES.twilight) { aR = new AicoreTwilight(a.data);  }
    else                                     { aR = new AicoreBehaviour(a.data); }
    if (b.type === BEHAVIOUR_TYPES.twilight) { bR = new AicoreTwilight(b.data);  }
    else                                     { bR = new AicoreBehaviour(b.data); }

    let aTime = aR.rule.time;
    let bTime = bR.rule.time;

    let today       = DAY_INDICES_MONDAY_START.indexOf(forDay);
    let previousDay = (today + 6) % 7;

    let midNight = 24*60;
    let dayMinutesStart = 4*60;
    let dayLength = 24*60;

    let bYesterday = b.activeDays[DAY_INDICES_MONDAY_START[previousDay]];
    let bToday     = b.activeDays[forDay];

    let aMinutesStart = 0;
    let aMinutesEnd   = 0;
    let aCrossDay     = false;
    let aLength       = 0;

    let bMinutesStart = 0;
    let bMinutesEnd   = 0;
    let bCrossDay     = false;
    let bLength       = 0;


    if (aTime.type === "ALL_DAY" && bTime.type === "ALL_DAY" && bToday) {
      result.overlapMins = dayLength;
      result.aPercentageOverlapped = 1;
      result.bPercentageOverlapped = 1;
      return result;
    }
    else if (aTime.type === "ALL_DAY" && bTime.type === "ALL_DAY") { // this implies that they are not active on the same day
      // no overlap
      return result;
    }
    if (aTime.type === "ALL_DAY") {
      aMinutesStart = dayMinutesStart;
      aMinutesEnd   = dayMinutesStart;
      aCrossDay = aMinutesStart >= aMinutesEnd;
      aLength = aCrossDay ? midNight - aMinutesStart + aMinutesEnd : aMinutesEnd - aMinutesStart;
    }
    else {
      aMinutesStart = AicoreUtil.getMinuteValue(aTime.from, sphereId);
      aMinutesEnd   = AicoreUtil.getMinuteValue(aTime.to,   sphereId);
      aCrossDay = aMinutesStart > aMinutesEnd;
      aLength = aCrossDay ? midNight - aMinutesStart + aMinutesEnd : aMinutesEnd - aMinutesStart;
    }

    if (bTime.type === "ALL_DAY") {
      bMinutesStart = dayMinutesStart;
      bMinutesEnd   = dayMinutesStart;
      bCrossDay = bMinutesStart >= bMinutesEnd;
      bLength = bCrossDay ? midNight - bMinutesStart + bMinutesEnd : bMinutesEnd - bMinutesStart;
    }
    else {
      bMinutesStart = AicoreUtil.getMinuteValue(bTime.from, sphereId);
      bMinutesEnd   = AicoreUtil.getMinuteValue(bTime.to,   sphereId);
      bCrossDay = bMinutesStart > bMinutesEnd;
      bLength = bCrossDay ? midNight - bMinutesStart + bMinutesEnd : bMinutesEnd - bMinutesStart;
    }

    if (aCrossDay) {
      if (bCrossDay) {
        if (bYesterday) {
          result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0, bMinutesEnd], [aMinutesStart, midNight]);
        }
        if (bToday) {
          result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([bMinutesStart, midNight], [aMinutesStart,midNight]);
          result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0, bMinutesEnd],          [0, aMinutesEnd]);
        }
      }
      else if (bToday) {
        result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([bMinutesStart, bMinutesEnd], [aMinutesStart, midNight]);
      }
    }
    else {
      if (bCrossDay) {
        if (bYesterday) {
          result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([0, bMinutesEnd], [aMinutesStart, aMinutesEnd]);
        }
        if (bToday) {
          result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([bMinutesStart, midNight], [aMinutesStart,aMinutesEnd]);
        }
      }
      else if (bToday) {
        result.overlapMins += AicoreUtil._getOverlapBetweenTimeSlots([bMinutesStart, bMinutesEnd], [aMinutesStart, aMinutesEnd]);
      }
    }

    result.aPercentageOverlapped = result.overlapMins / aLength;
    result.bPercentageOverlapped = result.overlapMins / bLength;
    return result;
  },

  _getOverlapBetweenTimeSlots(firstTimeSlot : number[], secondTimeSlot: number[]) : number {
    let minutesOverlap = 0;

    let slotStart = firstTimeSlot[0] < firstTimeSlot[1] ? firstTimeSlot[0] : firstTimeSlot[1];
    let slotEnd =   firstTimeSlot[0] < firstTimeSlot[1] ? firstTimeSlot[1] : firstTimeSlot[0];

    let secondSlotStart = secondTimeSlot[0] < secondTimeSlot[1] ? secondTimeSlot[0] : secondTimeSlot[1];
    let secondSlotEnd   = secondTimeSlot[0] < secondTimeSlot[1] ? secondTimeSlot[1] : secondTimeSlot[0];

    if (secondSlotStart < slotStart && secondSlotEnd > slotStart) { // we start outside of slot en the slot is overlapping with the target
      if (secondSlotEnd <= slotEnd) {
        minutesOverlap += secondSlotEnd - slotStart;
      }
      else {
        // larger than timeslot, the slot is fully engulfed
        minutesOverlap += slotEnd - slotStart;
      }
    }
    else if (secondSlotStart >= slotStart && secondSlotStart < slotEnd) { // we start inside slot
      if (secondSlotEnd <= slotEnd) {
        minutesOverlap += secondSlotEnd - secondSlotStart;
      }
      else {
        // larger than timeslot
        minutesOverlap += slotEnd - secondSlotStart;
      }
    }

    return minutesOverlap;
  },


  getBehaviourSummary(sphereId: string, ruleData) {
    let rule : AicoreTwilight | AicoreBehaviour = null;
    if (ruleData.type === BEHAVIOUR_TYPES.twilight) { rule = new AicoreTwilight(ruleData.data);  }
    else                                            { rule = new AicoreBehaviour(ruleData.data); }

    return {
      usingSingleRoomPresence: rule.isUsingSingleRoomPresence(),
      usingMultiRoomPresence:  rule.isUsingMultiRoomPresence(),
      usingSpherePresence:     rule.isUsingSpherePresence(),
      type:                    ruleData.type,
      label:                   rule.getSentence(sphereId),
    }
  },


  getActiveTurnOnPercentage(sphereId:string, stone) {
    let rules = stone.rules;
    let ruleIds = Object.keys(rules);

    let dimAmount = 100;

    for (let i = 0; i < ruleIds.length; i++) {
      let ruleData = rules[ruleIds[i]];
      let rule : AicoreTwilight | AicoreBehaviour = null;
      if (ruleData.type === BEHAVIOUR_TYPES.twilight) { rule = new AicoreTwilight(ruleData.data);  }
      else                                            { rule = new AicoreBehaviour(ruleData.data); }

      let currentDay = DAY_INDICES_SUNDAY_START[new Date().getDay()];
      if (ruleData.activeDays[currentDay]) {
        if (rule.isCurrentlyActive(sphereId)) {
          dimAmount = Math.min(dimAmount, rule.getDimAmount());
        }
      }
    }

    return dimAmount;
  }
};
