import {
  AICORE_LOCATIONS_TYPES,
  AICORE_PRESENCE_TYPES,
  AICORE_TIME_DETAIL_TYPES,
  AICORE_TIME_TYPES, SELECTABLE_TYPE
} from "../../../../Enums";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { core } from "../../../../core";
import { xUtil } from "../../../../util/StandAloneUtil";

export class BehaviourConstructor {
  originalRule : behaviour;
  ruleDescription : behaviour;
  store: any;

  constructor(behaviour: behaviour) {
    this.originalRule    = xUtil.deepExtend({}, behaviour);
    this.ruleDescription = behaviour;
  }

  _getChunks() {
    let intentionStr = "I will be";
    let actionStr = null;
    if (this.ruleDescription.action.data < 1) {
      actionStr = "dimmed at " + Math.round(this.ruleDescription.action.data * 100) + "%";
    }
    else if (this.ruleDescription.action.data == 1) {
      actionStr = "on";
    }

    let presencePrefix = null;
    let presenceStr = null;
    let presence = this.ruleDescription.presence;
    switch (presence.type) {
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

    let locationPrefix = "";
    let locationStr = "";
    if (presence.type !== AICORE_PRESENCE_TYPES.IGNORE) {
      // @ts-ignore
      let pd = presence.data as aicorePresenceData;

      switch (pd.type) {
        case AICORE_LOCATIONS_TYPES.SPHERE:
          locationPrefix = "is";
          locationStr = "home";
          break;
        case AICORE_LOCATIONS_TYPES.LOCATION:
          if (pd.locationIds.length > 0) {
            locationPrefix = "is in the ";
            // we will now construct a roomA_name, roomB_name or roomC_name line.
            locationStr = getLocationName(pd.locationIds[0]);
            if (pd.locationIds.length > 1) {
              for (let i = 1; i < pd.locationIds.length - 1; i++) {
                let locationCloudId = pd.locationIds[i];
                let locationName = getLocationName(locationCloudId);
                locationStr += ", " + locationName;
              }

              locationStr += " or " + getLocationName(pd.locationIds[pd.locationIds.length - 1]);
            }
          }
      }
    }

    let timeStr = "";

    /*
      these are the types of sentences we want to make:

      from 22:22 until sunrise                    // specific - sunrise
      from 22:22 until 60 minutes after  sunrise  // specific - sunrise + offset
      from 22:22 until 60 minutes before sunrise  // specific - sunrise - offset
      from 22:22 until sunset                     // specific - sunset
      from an hour before sunset until sunrise    // sunset   - sunrise
      from sunrise to 15:00                       // sunrise  - specific
      from sunset to 4:00                         // sunset   - specific

      between 22:22 and 11:22                     // specific - specific

      when its dark outside                       // sunset   - sunrise
      while the sun is up                         // sunrise  - sunset
     */


    let time = this.ruleDescription.time;
    if (time.type != AICORE_TIME_TYPES.ALWAYS) {
      // @ts-ignore
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
        let fromStr = getTimeStr(tr.from);
        let toStr   = getTimeStr(tr.to);
        timeStr = "between " + fromStr + " and " + toStr;
      }
      else if (tr.from.type === AICORE_TIME_DETAIL_TYPES.CLOCK && (tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.to.type === AICORE_TIME_DETAIL_TYPES.SUNSET)) {
        // this makes "from xxxxx until xxxxx"
        let fromStr = getTimeStr(tr.from);
        let toStr   = getTimeStr(tr.to);
        timeStr = "from " + fromStr + " until " + toStr;
      }
      else if (tr.to.type === AICORE_TIME_DETAIL_TYPES.CLOCK && (tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNSET)) {
        // this makes "from xxxxx until xxxxx"
        let fromStr = getTimeStr(tr.from);
        let toStr   = getTimeStr(tr.to);
        timeStr = "from " + fromStr + " until " + toStr;
      }
      else {
        // these are "from xxxxx to xxxxx"
        let fromStr = getTimeStr(tr.from);
        let toStr   = getTimeStr(tr.to);
        timeStr = "from " + fromStr + " to " + toStr;
      }
    }


    let optionStr = null;
    if (this.ruleDescription.options && this.ruleDescription.options.type) {
      switch (this.ruleDescription.options.type) {
        case "SPHERE_PRESENCE_AFTER":
          optionStr += " Afterwards, I'll stay on if someone is still at home";
          break;
        case "LOCATION_PRESENCE_AFTER":
          optionStr += " Afterwards, I'll stay on if someone is still in the room";
          break;
      }
    }

    return {
      intention: {
        label: intentionStr,
        value: null,
        changeAction: () => {
        }
      },
      action: {
        label: actionStr,
        value: this.ruleDescription.action.data,
        changeAction: (newValue: number) => {
          this.ruleDescription.action.data = newValue;
        }
      },
      presencePrefix: {
        label: presencePrefix,
        value: null,
        changeAction: () => {
        }
      },
      presence: {
        label: presenceStr,
        value: this.ruleDescription.presence.type,
        changeAction: (newValue: "SOMEBODY" | "NOBODY" | "IGNORE") => {
          this.ruleDescription.presence.type = newValue;
        }
      },
      locationPrefix: {
        label: locationPrefix, value: null, changeAction: () => {
        }
      },
      location: {
        label: locationStr,
        value: this.ruleDescription.presence["data"],
        changeAction: (newData: { type: "SPHERE" | "LOCATION", locationIds?: string[] }) => {
          if (this.ruleDescription.presence["data"] !== undefined) {
            this.ruleDescription.presence["data"].type = newData.type;
            if (newData.type === "LOCATION") {
              this.ruleDescription.presence["data"].locationIds = newData.locationIds
            }
          }
        }
      },
      time: {
        label: timeStr,
        value: this.ruleDescription.time,
        changeAction: (newData: aicoreTime) => {
          this.ruleDescription.time = newData;
        }
      },
      option: {
        label: optionStr, value: null, changeAction: (newValue) => {
          if (newValue === null) {
            delete this.ruleDescription.options;
          } else {
            this.ruleDescription.options = { type: newValue };
          }
        }
      },
    }
  }

  getSentence() {
    let chunks = this._getChunks();

    let sentence = "";
    sentence += chunks.intention.label;
    sentence += chunks.action.label         ? " " + chunks.action.label         : "";
    sentence += chunks.presencePrefix.label ? " " + chunks.presencePrefix.label : "";
    sentence += chunks.presence.label       ? " " + chunks.presence.label       : "";
    sentence += chunks.location.label       ? " " + chunks.location.label       : "";
    sentence += chunks.time.label           ? " " + chunks.time.label           : "";
    sentence += ".";
    sentence += chunks.option.label         ? " " + chunks.option.label + "."   : "";

    return sentence;
  }



  getLogicChunks() : behaviourChunk[] {
    let chunks = this._getChunks();

    let result : behaviourChunk[]= [];

    let addToResult = (chunk, type = null, hidden = false) => {
      if (typeof chunk === "string") {
        chunk = {label:chunk, changeAction: () => {}, value: null};
      }
      result.push({label: chunk.label, clickable: type !== null, type: type, value: chunk.value, changeAction: chunk.changeAction, hidden: hidden});
    }

    addToResult(chunks.intention)
    if (chunks.action.label)          { addToResult(" "); addToResult(chunks.action,        SELECTABLE_TYPE.ACTION);   } else {  addToResult(chunks.action, SELECTABLE_TYPE.ACTION, true);    }
    if (chunks.presencePrefix.label)  { addToResult(" "); addToResult(chunks.presencePrefix);                          }
    if (chunks.presence.label)        { addToResult(" "); addToResult(chunks.presence,      SELECTABLE_TYPE.PRESENCE); } else {  addToResult(chunks.presence,SELECTABLE_TYPE.PRESENCE, true);  }
    if (chunks.locationPrefix.label)  { addToResult(" "); addToResult(chunks.locationPrefix);                          }
    if (chunks.location.label)        { addToResult(" "); addToResult(chunks.location,      SELECTABLE_TYPE.LOCATION); } else {  addToResult(chunks.location,SELECTABLE_TYPE.LOCATION, true);  }
    if (chunks.time.label)            { addToResult(" "); addToResult(chunks.time,          SELECTABLE_TYPE.TIME);     } else {  addToResult(chunks.time, SELECTABLE_TYPE.TIME, true);      }
    addToResult(".");
    if (chunks.option.label)          { addToResult(" "); addToResult(chunks.option,        SELECTABLE_TYPE.OPTION); addToResult("."); }

    return result;
  }

}

function getTimeStr(timeObj) {
  if (timeObj.data !== undefined) {
    // TYPE IS CLOCK
    let obj = (timeObj as aicoreTimeDataClock).data;
    return obj.hours + ":" + (obj.minutes < 10 ? obj.minutes + "0" : obj.minutes);
  }
  else {
    // TYPE IS SUNSET/SUNRISE
    let obj = (timeObj as aicoreTimeDataSun);
    let str = "";
    if (obj.offsetMinutes !== 0) {
      if (obj.offsetMinutes < 0) {
        str += obj.offsetMinutes + " before "
      }
      else {
        str += obj.offsetMinutes + " after "
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
}

function getLocationName(locationCloudId) {
  let state = core.store.getState();
  let sphereIds = Object.keys(state.spheres);
  let activeSphere = sphereIds[0]

  let sphere = state.spheres[activeSphere];
  let localId = MapProvider.cloud2localMap.locations[locationCloudId] || locationCloudId;

  return sphere.locations[localId].config.name.toLowerCase();
}