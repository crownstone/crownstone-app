import {
  SELECTABLE_TYPE
} from "../../../../Enums";
import { AicoreUtil } from "./AicoreUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { AicoreTimeData } from "./AicoreTimeData";

const DEFAULT_DELAY_MINUTES = 5;
const EMPTY_RULE : twilight = {
  action:   { type: "DIM_WHEN_TURNED_ON", data: 0.6 },
  time:     { type:"RANGE", from: { type: "SUNSET", offsetMinutes:0}, to:{ type: "SUNRISE", offsetMinutes:0} },
};

export class AicoreTwilight {
  originalRule : twilight;
  rule : twilight;
  store: any;

  constructor(behaviour?: twilight | AicoreTwilight | string) {
    if (!behaviour) {
      this.rule = xUtil.deepExtend({},EMPTY_RULE);
    }
    else if (typeof behaviour === 'string') {
      this.fromString(behaviour);
    }
    else {
      if (!(behaviour instanceof AicoreTwilight)) {
        this.rule = behaviour;
      }
      else {
        this.rule = xUtil.deepExtend({}, behaviour.rule);
      }
    }
  }


  _getChunks() {
    let intentionStr = "If I'm turned on";
    let timeStr   = AicoreUtil.extractTimeString(this.rule, true) + ',';
    let actionStr = AicoreUtil.extractActionString(this.rule);


    return {
      intention:      { label: intentionStr,   data: null },
      action:         { label: actionStr,      data: this.rule.action },
      time:           { label: timeStr,        data: this.rule.time },
    }
  }


  getSentence() {
    let chunks = this._getChunks();

    let sentence = "";
    sentence += chunks.intention.label;
    sentence += chunks.time.label   ? " " + chunks.time.label   : ",";
    sentence += chunks.action.label ? " " + chunks.action.label : "";
    sentence += ".";

    return sentence;
  }


  getSelectableChunkData() : selectableAicoreBehaviourChunk[] {
    let chunks = this._getChunks();

    let result : selectableAicoreBehaviourChunk[]= [];

    let addToResult = (chunk, type = null, hidden = false) => {
      if (typeof chunk === "string") {
        chunk = {label:chunk, changeAction: () => {}, data: null};
      }
      result.push({label: chunk.label, clickable: type !== null, type: type, data: chunk.data, hidden: hidden});
    };

    addToResult(chunks.intention);
    if (chunks.time.label)            { addToResult(" "); addToResult(chunks.time,          SELECTABLE_TYPE.TIME);     } else {  addToResult(chunks.time,   SELECTABLE_TYPE.TIME,   true);    }
    if (chunks.action.label)          { addToResult(" "); addToResult(chunks.action,        SELECTABLE_TYPE.ACTION);   } else {  addToResult(chunks.action, SELECTABLE_TYPE.ACTION, true);    }
    addToResult(".");
    return result;
  }


  /**
   * This sets the action value. 1 means fully on, 0..1 is dimming.
   * Value must be higher than 0.
   * @param value
   */
  setActionState(value: number) : AicoreTwilight {
    this.rule.action.data = value;
    return this;
  }
  setDimAmount(value: number) : AicoreTwilight {
    this.rule.action.data = value;
    return this;
  }

  setTimeAllday() : AicoreTwilight {
    this.rule.time = { type: "ALL_DAY" };
    return this;
  }
  setTimeWhenDark() : AicoreTwilight {
    this.rule.time = { type: "RANGE", from: {type:"SUNSET", offsetMinutes:0}, to: {type:"SUNRISE", offsetMinutes:0} };
    return this;
  }
  setTimeWhenSunUp() : AicoreTwilight {
    this.rule.time = { type: "RANGE", from: {type:"SUNRISE", offsetMinutes:0}, to: {type:"SUNSET", offsetMinutes:0} };
    return this;
  }
  setTimeFromSunrise(offsetMinutes : number = 0) : AicoreTwilight {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") { this.setTimeWhenSunUp(); }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.from = { type: "SUNRISE", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeFromSunset(offsetMinutes : number = 0) : AicoreTwilight {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") { this.setTimeWhenDark(); }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.from = { type: "SUNSET", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeToSunrise(offsetMinutes : number = 0) : AicoreTwilight {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") { this.setTimeWhenDark(); }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.to = { type: "SUNRISE", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeToSunset(offsetMinutes : number = 0) : AicoreTwilight {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") { this.setTimeWhenSunUp(); }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.to = { type: "SUNSET", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeFrom(hours: number, minutes: number) : AicoreTwilight {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") {
      if (hours < 14) {
        this.setTimeWhenSunUp();
      }
      else {
        this.setTimeWhenDark();
      }
    }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.from = { type: "CLOCK", data: {hours: hours, minutes: minutes} };
    }
    return this;
  }


  setTimeTo(hours: number, minutes: number) : AicoreTwilight {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.rule.time.type !== "RANGE") {
      if (hours > 20) {
        this.setTimeFrom(18,0);
      }
      else if (hours > 8) {
        this.setTimeFrom(8,0);
      }
      else {
        this.setTimeFrom(0,0);
      }
    }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.to = { type: "CLOCK", data: {hours: hours, minutes: minutes} };
    }
    return this;
  }

  setTime(time: aicoreTime) : AicoreTwilight {
    this.rule.time = time;
    return this;
  }

  insertTimeDataFrom(timeData: AicoreTimeData) {
    if (this.rule.time.type !== "RANGE") {
      this.setTimeWhenDark();
    }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.from = timeData.data;
    }
  }

  insertTimeDataTo(timeData: AicoreTimeData) {
    if (this.rule.time.type !== "RANGE") {
      this.setTimeWhenDark();
    }

    if (this.rule.time.type !== "ALL_DAY") {
      this.rule.time.to = timeData.data;
    }
  }


  ignorePresence() : AicoreTwilight { return this; }
  setPresenceIgnore() : AicoreTwilight { return this; }
  setPresenceSomebody() : AicoreTwilight { return this; }
  setPresenceNobody() : AicoreTwilight { return this; }
  setPresenceSomebodyInSphere() : AicoreTwilight { return this; }
  setPresenceNobodyInSphere() : AicoreTwilight { return this; }
  setPresenceSpecificUserInSphere(userProfileId: number) : AicoreTwilight { return this; }
  setPresenceInSphere() : AicoreTwilight { return this; }
  setPresenceInLocations(locationIds: string[]) { return this; }
  setPresenceSomebodyInStoneLocation(locationIds: string[]) : AicoreTwilight { return this; }
  setPresenceSomebodyInLocations(locationIds: string[]) : AicoreTwilight { return this; }
  setPresenceNobodyInLocations(locationIds: string[]) : AicoreTwilight { return this; }
  setPresenceSpecificUserInLocations(locationIds: string[], userProfileId: number) : AicoreTwilight { return this; }
  setNoOptions() : AicoreTwilight { return this; }
  setOptionStayOnWhilePeopleInSphere() : AicoreTwilight { return this; }
  setOptionStayOnWhilePeopleInLocation() : AicoreTwilight { return this; }

  _getSphereDelay() {
    // todo: implement customization.
    return DEFAULT_DELAY_MINUTES;
  }
  _getLocationDelay() {
    return this._getSphereDelay;
  }


  doesActionMatch(otherAicoreTwilight: AicoreTwilight) : boolean {
    return xUtil.deepCompare(this.rule.action, otherAicoreTwilight.rule.action);
  }
  doesPresenceTypeMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesPresenceLocationMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesPresenceMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesOptionMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesTimeMatch(otherAicoreTwilight: AicoreTwilight) : boolean {
    let match = xUtil.deepCompare(this.rule.time, otherAicoreTwilight.rule.time);
    return match;
  }



  willDim() : boolean {
    return this.rule.action.data < 1;
  }

  getDimAmount() : number {
    return this.rule.action.data;
  }
  getLocationIds() : string[] {
    return [];
  }
  getTime() : aicoreTime {
    return this.rule.time;
  }
  getHour() : number {
    if (this.rule.time.type === "RANGE" && this.rule.time.to.type === "CLOCK") {
      return this.rule.time.to.data.hours;
    }
    return null;
  }
  getMinutes() : number {
    if (this.rule.time.type === "RANGE" && this.rule.time.to.type === "CLOCK") {
      return this.rule.time.to.data.minutes;
    }
    return null;
  }

  /**
   * SphereId is used to get the lat lon of the sphere for the time of day times
   * @param sphereId
   */
  getFromTimeString(sphereId) {
    if (this.rule.time.type !== "ALL_DAY") {
      return AicoreUtil.getTimeStrInTimeFormat(this.rule.time.from, sphereId);
    }
    return null;
  }
  /**
   * SphereId is used to get the lat lon of the sphere for the time of day times
   * @param sphereId
   */
  getToTimeString(sphereId) {
    if (this.rule.time.type !== "ALL_DAY") {
      return AicoreUtil.getTimeStrInTimeFormat(this.rule.time.to, sphereId);
    }
    return null;
  }

  isUsingPresence() : boolean {
    return false;
  }
  isAlwaysActive() : boolean {
    return this.rule.time.type === "ALL_DAY";
  }
  isUsingClockEndTime(): boolean {
    return this.rule.time.type === "RANGE" && this.rule.time.to.type === "CLOCK";
  }
  isUsingSunsetAsEndTime(): boolean {
    return this.rule.time.type === "RANGE" && this.rule.time.to.type === "SUNSET";
  }
  hasNoOptions(): boolean {
    return true;
  }

  fromString(dataString) {
    this.rule = JSON.parse(dataString);
  }

  stringify() : string {
    return JSON.stringify(this.rule);
  }
}