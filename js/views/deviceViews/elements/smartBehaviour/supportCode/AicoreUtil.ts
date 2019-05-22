import {
  AICORE_LOCATIONS_TYPES,
  AICORE_PRESENCE_TYPES,
  AICORE_TIME_DETAIL_TYPES,
  AICORE_TIME_TYPES
} from "../../../../../Enums";
import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { core } from "../../../../../core";
import { AicoreTimeData } from "./AicoreTimeData";
const SunCalc = require('suncalc');

export const AicoreUtil = {

  extractActionString(rule : behaviour | twilight) {
    if (rule.action.type === "DIM_WHEN_TURNED_ON") {
      return "dim to " + Math.round(rule.action.data * 100) + "%";
    }
    if (rule.action.data < 1) {
      return "dimmed at " + Math.round(rule.action.data * 100) + "%";
    }
    else if (rule.action.data == 1) {
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

  extractLocationStrings(rule : behaviour) {
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
            locationPrefix = "is in the ";
            // we will now construct a roomA_name, roomB_name or roomC_name line.
            locationStr = AicoreUtil.getLocationName(pd.locationIds[0]).toLowerCase();
            if (pd.locationIds.length > 1) {
              for (let i = 1; i < pd.locationIds.length - 1; i++) {
                let locationCloudId = pd.locationIds[i];
                let locationName = AicoreUtil.getLocationName(locationCloudId).toLowerCase();
                locationStr += ", " + locationName;
              }

              locationStr += " or " + AicoreUtil.getLocationName(pd.locationIds[pd.locationIds.length - 1]).toLowerCase();
            }
          }
      }
    }

    return { locationPrefix, locationStr };
  },


  extractTimeString(rule : behaviour | twilight) {
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
      else if (tr.from.type === AICORE_TIME_DETAIL_TYPES.CLOCK && tr.to.type === AICORE_TIME_DETAIL_TYPES.CLOCK) {
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


  extractOptionStrings(rule : behaviour) {
    let optionPrefix = "";
    let optionStr = "";

    if (rule.options && rule.options.type) {
      switch (rule.options.type) {
        case "SPHERE_PRESENCE_AFTER":
          optionPrefix += "Afterwards, I'll";
          optionStr += "stay on if someone is still at home";
          break;
        case "LOCATION_PRESENCE_AFTER":
          optionPrefix += "Afterwards, I'll";
          optionStr += "stay on if someone is still in the room";
          break;
      }
    }
    return {optionPrefix, optionStr};
  },


  getLocationName(locationCloudId : string) {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let localId = MapProvider.cloud2localMap.locations[locationCloudId] || locationCloudId;
    for (let i = 0; i < sphereIds.length; i++) {
      if (state.spheres[sphereIds[i]].locations[localId] !== undefined) {
        return state.spheres[sphereIds[i]].locations[localId].config.name;
      }
    }

    return "(deleted location)";
  },

  getClockTimeStr(hours, minutes) {
    return hours + ":" + (minutes < 10 ? minutes + "0" : minutes);
  },

  getTimeStr(timeObj: aicoreTimeData) {
    if (timeObj.type === "CLOCK") {
      // TYPE IS CLOCK
      let obj = (timeObj as aicoreTimeDataClock).data;
      return AicoreUtil.getClockTimeStr(obj.hours, obj.minutes);
    }
    else {
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
    if (timeObj.type === "CLOCK") {
      // TYPE IS CLOCK
      let obj = (timeObj as aicoreTimeDataClock).data;
      return AicoreUtil.getClockTimeStr(obj.hours, obj.minutes);
    }
    else {
      let state = core.store.getState();
      let sphere = state.spheres[sphereId];

      // position of Crownstone HQ.
      let lat = 51.923611570463152;
      let lon = 4.4667693378575288;
      if (sphere) {
        lat = sphere.state.latitude || lat;
        lon = sphere.state.longitude || lon;
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

      return AicoreUtil.getClockTimeStr(new Date(baseTime).getHours(), new Date(baseTime).getMinutes());
    }
  }

};
