import { AicoreUtil } from "./AicoreUtil";
import { xUtil } from "../../../../../util/StandAloneUtil";


export class AicoreTimeData {
  data: aicoreTimeData = null;

  constructor(timeData = null) {
    this.data = timeData;
  }

  setTime(hours: number, minutes: number) {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    this.data = { type: "CLOCK", data: {hours: hours, minutes: minutes} };
  }
  setClock() {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    this.data = { type: "CLOCK", data: {hours: 15, minutes: 0} };
  }
  setOffsetMinutes(offsetMinutes : number = 0) {
    if (this.data.type !== "CLOCK") {
      this.data = { type: this.data.type, offsetMinutes: offsetMinutes };
    }
    else {
      this.setSunset(offsetMinutes);
    }
  }
  setSunrise(offsetMinutes : number = 0) {
    this.data = { type: "SUNRISE", offsetMinutes: offsetMinutes };
  }
  setSunset(offsetMinutes : number = 0) {
    this.data = { type: "SUNSET", offsetMinutes: offsetMinutes };
  }

  insertAicoreTimeFrom(time: aicoreTime) {
    this.data = null;
    if (time && time.type === "RANGE") {
      this.data = xUtil.deepExtend({}, time.from);
      return true;
    }
    return false;
  }
  insertAicoreTimeTo(time: aicoreTime) {
    this.data = null;
    if (time && time.type === "RANGE") {
      this.data = xUtil.deepExtend({}, time.to);
      return true;
    }
    return false;
  }


  getType() {
    if (this.data) {
      return this.data.type;
    }
    return null;
  }
  getOffsetMinutes() {
    if (this.data && this.data.type !== "CLOCK") {
      return this.data.offsetMinutes;
    }
    return 0;
  }
  getTime() {
    if (this.data && this.data.type === "CLOCK") {
      return { hours: this.data.data.hours, minutes: this.data.data.minutes };
    }
    return { hours: new Date().getHours(), minutes: 0 };
  }

  getString() : string {
    if (this.data) {
      return AicoreUtil.getTimeStr(this.data);
    }
    return "";
  }
}
