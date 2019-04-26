import {
  SELECTABLE_TYPE
} from "../../../../../Enums";
import { AicoreUtil } from "./AicoreUtil";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { AicoreTimeData } from "./AicoreTimeData";

const DEFAULT_DELAY_MINUTES = 5
const EMPTY_RULE : twilight = {
  action:   { type: "DIM_WHEN_TURNED_ON", data: 0.6 },
  time:     { from: { type: "SUNSET", offsetMinutes:0}, to:{ type: "SUNRISE", offsetMinutes:0} },
}

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
    let intentionStr = "If I'm turned on, I'll";
    let actionStr = AicoreUtil.extractActionString(this.rule);
    let timeStr   = AicoreUtil.extractTimeString(this.rule);


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
    sentence += chunks.action.label ? " " + chunks.action.label : "";
    sentence += chunks.time.label   ? " " + chunks.time.label   : "";
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
    }

    addToResult(chunks.intention)
    if (chunks.action.label)          { addToResult(" "); addToResult(chunks.action,        SELECTABLE_TYPE.ACTION);   } else {  addToResult(chunks.action, SELECTABLE_TYPE.ACTION, true);    }
    if (chunks.time.label)            { addToResult(" "); addToResult(chunks.time,          SELECTABLE_TYPE.TIME);     } else {  addToResult(chunks.time, SELECTABLE_TYPE.TIME, true);      }
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

  setTimeWhenDark() : AicoreTwilight {
    this.rule.time = { from: {type:"SUNSET", offsetMinutes:0}, to: {type:"SUNRISE", offsetMinutes:0} };
    return this;
  }
  setTimeWhenSunUp() : AicoreTwilight {
    this.rule.time = { from: {type:"SUNRISE", offsetMinutes:0}, to: {type:"SUNSET", offsetMinutes:0} };
    return this;
  }
  setTimeFromSunrise(offsetMinutes : number = 0) : AicoreTwilight {
    this.rule.time.from = { type: "SUNRISE", offsetMinutes: offsetMinutes };
    return this;
  }
  setTimeFromSunset(offsetMinutes : number = 0) : AicoreTwilight {
    this.rule.time.from = { type: "SUNSET", offsetMinutes: offsetMinutes };
    return this;
  }
  setTimeToSunrise(offsetMinutes : number = 0) : AicoreTwilight {
    this.rule.time.to = { type: "SUNRISE", offsetMinutes: offsetMinutes };
    return this;
  }
  setTimeToSunset(offsetMinutes : number = 0) : AicoreTwilight {
    this.rule.time.to = { type: "SUNSET", offsetMinutes: offsetMinutes };
    return this;
  }
  setTimeFrom(hours: number, minutes: number) : AicoreTwilight {
    if (hours < 14) {
      this.setTimeWhenSunUp();
    }
    else {
      this.setTimeWhenDark();
    }

    this.rule.time.from = { type: "CLOCK", data: {hours: hours, minutes: minutes} };
    return this;
  }


  setTimeTo(hours: number, minutes: number) : AicoreTwilight {
    if (hours > 20) {
      this.setTimeFrom(18,0);
    }
    else if (hours > 8) {
      this.setTimeFrom(8,0);
    }
    else {
      this.setTimeFrom(0,0);
    }

    this.rule.time.to = { type: "CLOCK", data: {hours: hours, minutes: minutes} };
    return this;
  }

  setTime(time: aicoreTimeRangeTwilight) : AicoreTwilight {
    this.rule.time = time;
    return this;
  }

  insertTimeDataFrom(timeData: AicoreTimeData) {
    this.rule.time.from = timeData.data;
  }

  insertTimeDataTo(timeData: AicoreTimeData) {
    this.rule.time.to = timeData.data;
  }


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
  doesTimeMatch(otherAicoreTwilight: AicoreTwilight) : boolean {
    let match = xUtil.deepCompare(this.rule.time, otherAicoreTwilight.rule.time);
    return match;
  }

  getDimAmount() : number {
    return this.rule.action.data;
  }
  getTime() : aicoreTimeRangeTwilight {
    return this.rule.time;
  }
  getHour() : number {
    if (this.rule.time.to.type === "CLOCK") {
      return this.rule.time.to.data.hours;
    }
    return null;
  }
  getMinutes() : number {
    if (this.rule.time.to.type === "CLOCK") {
      return this.rule.time.to.data.minutes;
    }
    return null;
  }

  /**
   * SphereId is used to get the lat lon of the sphere for the time of day times
   * @param sphereId
   */
  getFromTimeString(sphereId) {
    return AicoreUtil.getTimeStrInTimeFormat(this.rule.time.from, sphereId);
  }
  /**
   * SphereId is used to get the lat lon of the sphere for the time of day times
   * @param sphereId
   */
  getToTimeString(sphereId) {
    return AicoreUtil.getTimeStrInTimeFormat(this.rule.time.to, sphereId);
  }

  isUsingClockEndTime(): boolean {
    return this.rule.time.to.type === "CLOCK";
  }


  fromString(dataString) {
    this.rule = JSON.parse(dataString);
  }

  stringify() : string {
    return JSON.stringify(this.rule);
  }
}