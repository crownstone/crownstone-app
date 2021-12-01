import { AicoreUtil } from "./AicoreUtil";
import { AicoreTimeData } from "./AicoreTimeData";
import { xUtil } from "../../../../util/StandAloneUtil";

const DEFAULT_DELAY_SECONDS = 5*60;

export class AicoreBehaviourCore {
  originalBehaviour : behaviour | twilight;
  behaviour : behaviour | twilight;

  /**
   * This sets the action value. 100 means fully on, 0..100 is dimming.
   * Value must be higher than 0.
   * @param value
   */
  setActionState(value: number)/* : AicoreBehaviourCore*/ {
    this.behaviour.action.data = value;
    return this;
  }

  setDimPercentage(value: number)/* : AicoreBehaviourCore*/ {
    this.behaviour.action.data = value;
    return this;
  }

  setTimeAllday()/* : AicoreBehaviourCore*/ {
    this.behaviour.time = { type: "ALL_DAY" };
    return this;
  }
  setTimeWhenDark()/* : AicoreBehaviourCore*/ {
    this.behaviour.time = { type: "RANGE", from: {type:"SUNSET", offsetMinutes:0}, to: {type:"SUNRISE", offsetMinutes:0} };
    return this;
  }
  setTimeWhenSunUp()/* : AicoreBehaviourCore*/ {
    this.behaviour.time = { type: "RANGE", from: {type:"SUNRISE", offsetMinutes:0}, to: {type:"SUNSET", offsetMinutes:0} };
    return this;
  }
  setTimeFromSunrise(offsetMinutes : number = 0)/* : AicoreBehaviourCore*/ {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.behaviour.time.type !== "RANGE") { this.setTimeWhenSunUp(); }

    if (this.behaviour.time.type !== "ALL_DAY") {
      this.behaviour.time.from = { type: "SUNRISE", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeFromSunset(offsetMinutes : number = 0)/* : AicoreBehaviourCore*/ {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.behaviour.time.type !== "RANGE") { this.setTimeWhenDark(); }

    if (this.behaviour.time.type !== "ALL_DAY") {
      this.behaviour.time.from = { type: "SUNSET", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeToSunrise(offsetMinutes : number = 0)/* : AicoreBehaviourCore*/ {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.behaviour.time.type !== "RANGE") { this.setTimeWhenDark(); }

    if (this.behaviour.time.type !== "ALL_DAY") {
      this.behaviour.time.to = { type: "SUNRISE", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeToSunset(offsetMinutes : number = 0)/* : AicoreBehaviourCore*/ {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.behaviour.time.type !== "RANGE") { this.setTimeWhenSunUp(); }

    if (this.behaviour.time.type !== "ALL_DAY") {
      this.behaviour.time.to = { type: "SUNSET", offsetMinutes: offsetMinutes };
    }
    return this;
  }
  setTimeFrom(hours: number, minutes: number)/* : AicoreBehaviourCore*/ {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.behaviour.time.type !== "RANGE") {
      if (hours < 14) {
        this.setTimeWhenSunUp();
      }
      else {
        this.setTimeWhenDark();
      }
    }

    if (this.behaviour.time.type !== "ALL_DAY") {
      this.behaviour.time.from = { type: "CLOCK", data: {hours: hours, minutes: minutes} };
    }
    return this;
  }


  setTimeTo(hours: number, minutes: number)/* : AicoreBehaviourCore*/ {
    // if the time was ALL_DAY, set it to an acceptable range, given the name of this method.
    if (this.behaviour.time.type !== "RANGE") {
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

    if (this.behaviour.time.type !== "ALL_DAY") {
      this.behaviour.time.to = { type: "CLOCK", data: {hours: hours, minutes: minutes} };
    }
    return this;
  }

  setTime(time: aicoreTime)/* : AicoreBehaviourCore*/ {
    this.behaviour.time = time;
    return this;
  }

  insertTimeDataFrom(timeData: AicoreTimeData) {
    if (this.behaviour.time.type !== "RANGE") {
      this.setTimeWhenDark();
    }

    if (this.behaviour.time.type !== "ALL_DAY") {
      this.behaviour.time.from = timeData.data;
    }
  }

  insertTimeDataTo(timeData: AicoreTimeData) {
    if (this.behaviour.time.type !== "RANGE") {
      this.setTimeWhenDark();
    }

    if (this.behaviour.time.type !== "ALL_DAY") {
      this.behaviour.time.to = timeData.data;
    }
  }



  _getSphereDelay() : number {
    return DEFAULT_DELAY_SECONDS;
  }
  _getLocationDelay() : number {
    return this._getSphereDelay();
  }

  willDim() : boolean {
    return this.behaviour.action.data < 100;
  }
  getDimPercentage() : number {
    return this.behaviour.action.data;
  }

  getTime() : aicoreTime {
    return this.behaviour.time;
  }
  getHour() : number {
    if (this.behaviour.time.type === "RANGE" && this.behaviour.time.to.type === "CLOCK") {
      return this.behaviour.time.to.data.hours;
    }
    return null;
  }
  getMinutes() : number {
    if (this.behaviour.time.type === "RANGE" && this.behaviour.time.to.type === "CLOCK") {
      return this.behaviour.time.to.data.minutes;
    }
    return null;
  }

  getTimeString() {
    if (this.behaviour.time.type !== "ALL_DAY") {
      return AicoreUtil.extractTimeString(this.behaviour);
    }
    return null;
  }

  isOverlappingWith(otherBehaviour : behaviour | twilight, sphereId) : boolean {
    let otherTime = otherBehaviour.time;
    let myTime = this.behaviour.time;


    /** All day is from 4:00 - 3:59 to cover most of the waking day for people. This will be configurable eventually **/
    if (otherTime.type === "ALL_DAY") { return true; }
    if (myTime.type    === "ALL_DAY") { return true; }

    let otherStartBeforeMyEnd = AicoreUtil.isTimeBeforeOtherTime(myTime.from, otherTime.to  , sphereId);
    let otherEndBeforeMyStart = AicoreUtil.isTimeBeforeOtherTime(myTime.to,   otherTime.from, sphereId);

    if (otherEndBeforeMyStart)  { return false; }
    if (!otherStartBeforeMyEnd) { return false; }

    // if the other end before my start is false, check if the end is a sunrise, and allow 2 hours leniance.
    if (!otherEndBeforeMyStart) {
      if (otherTime.to.type === "SUNRISE") {
        return AicoreUtil.getMinuteDifference(myTime, otherTime, sphereId) > -120;
      }
    }

    // if the other end before my start is false, check if the end is a sunrise, and allow 2 hours leniance.
    if (otherStartBeforeMyEnd) {
      if (otherTime.to.type === "SUNSET") {
        return AicoreUtil.getMinuteDifference(myTime, otherTime, sphereId) < 120;
      }
    }

    return true;
  }

  /**
   * SphereId is used to get the lat lon of the sphere for the time of day times
   * @param sphereId
   */
  getFromTimeString(sphereId) {
    if (this.behaviour.time.type !== "ALL_DAY") {
      return AicoreUtil.getTimeStrInTimeFormat(this.behaviour.time.from, sphereId);
    }
    return null;
  }
  /**
   * SphereId is used to get the lat lon of the sphere for the time of day times
   * @param sphereId
   */
  getToTimeString(sphereId) {
    if (this.behaviour.time.type !== "ALL_DAY") {
      return AicoreUtil.getTimeStrInTimeFormat(this.behaviour.time.to, sphereId);
    }
    return null;
  }

  isActiveAllDay() : boolean {
    return this.behaviour.time.type === "ALL_DAY";
  }

  isUsingClockTime(): boolean {
    return this.isUsingClockStartTime() || this.isUsingClockEndTime();
  }

  isUsingClockStartTime(): boolean {
    return this.behaviour.time.type === "RANGE" && this.behaviour.time.from.type === "CLOCK";
  }
  isUsingClockEndTime(): boolean {
    return this.behaviour.time.type === "RANGE" && this.behaviour.time.to.type === "CLOCK";
  }

  isUsingSunsetAsEndTime(): boolean {
    return this.behaviour.time.type === "RANGE" && this.behaviour.time.to.type === "SUNSET";
  }

  fromString(dataString) {
    this.behaviour = JSON.parse(dataString);
  }

  stringify() : string {
    return JSON.stringify(this.behaviour);
  }


  isTheSameAs(otherBehaviour: AicoreBehaviourCore | string) : boolean {
    if (typeof otherBehaviour === 'string') {
      return xUtil.deepCompare(this.behaviour, JSON.parse(otherBehaviour));
    }
    return xUtil.deepCompare(this.behaviour, otherBehaviour.behaviour);
  }

  isCurrentlyActive(sphereId:string) : boolean {
    let now = new Date();
    let nowMinutes = now.getHours() * 60 + now.getMinutes();
    let myTime = this.behaviour.time;

    if (myTime.type === "ALL_DAY") { return true; }

    let myTimeStart = AicoreUtil.getMinuteValue(myTime.from, sphereId);
    let myTimeEnd   = AicoreUtil.getMinuteValue(myTime.to, sphereId);

    if (myTimeStart > myTimeEnd) {
      // we overlap with midnight
      if (myTimeStart < nowMinutes) {
        return true;
      }
      else if (myTimeEnd > nowMinutes) {
        return true;
      }
      return false;
    }
    else {
      // this is a direct range
      if (myTimeStart <= nowMinutes && myTimeEnd > nowMinutes) {
        return true;
      }
      return false;
    }
  }
}
