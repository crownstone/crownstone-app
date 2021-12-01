import {LOGe} from "../logging/Log";
import { xUtil } from "./StandAloneUtil";

export const ScheduleUtil = {
  getNextTime: function(time, activeDays) {
    let currentDayOfWeek = new Date().getDay(); // 0 .. 6 with sunday = 0
    let now = Date.now();

    let hoursSet = new Date(time).getHours();
    let minutesSet = new Date(time).getMinutes();

    let timeToday = new Date(
      new Date(
        new Date().setHours(hoursSet)
      ).setMinutes(minutesSet)
    ).setSeconds(0);

    let daysSorted = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    for (let i = currentDayOfWeek; i < daysSorted.length + currentDayOfWeek + 1; i++) {
      if (activeDays[daysSorted[i%daysSorted.length]] === true) {
        let timeAtDay = timeToday + (i - currentDayOfWeek) * 24*3600*1000;
        if (timeAtDay > now) {
          return xUtil.timestampToCrownstoneTime(timeAtDay);
        }
      }
    }

    LOGe.scheduler("DeviceScheduleEdit: Error, could not determine next time to fire!", time, activeDays);
  },

  getBridgeFormat(input) {
    return {
      scheduleEntryIndex     : input.scheduleEntryIndex, // 0 .. 9
      nextTime               : ScheduleUtil.getNextTime(input.time, input.activeDays),
      switchState            : input.switchState,
      fadeDuration           : input.fadeDuration,
      intervalInMinutes      : input.intervalInMinutes,
      ignoreLocationTriggers : input.ignoreLocationTriggers,
      active                 : input.active,
      repeatMode             : input.repeatMode,
      activeMonday           : input.activeDays.Mon,
      activeTuesday          : input.activeDays.Tue,
      activeWednesday        : input.activeDays.Wed,
      activeThursday         : input.activeDays.Thu,
      activeFriday           : input.activeDays.Fri,
      activeSaturday         : input.activeDays.Sat,
      activeSunday           : input.activeDays.Sun,
    }
  },


  findMatchingScheduleId(schedule, dbSchedules) {
    let dbScheduleIds = Object.keys(dbSchedules);

    // matching will be done on days, time and state
    for (let i = 0; i < dbScheduleIds.length; i++) {
      let dbSchedule = dbSchedules[dbScheduleIds[i]];
      if (
        schedule.activeMonday    === dbSchedule.activeDays.Mon &&
        schedule.activeTuesday   === dbSchedule.activeDays.Tue &&
        schedule.activeWednesday === dbSchedule.activeDays.Wed &&
        schedule.activeThursday  === dbSchedule.activeDays.Thu &&
        schedule.activeFriday    === dbSchedule.activeDays.Fri &&
        schedule.activeSaturday  === dbSchedule.activeDays.Sat &&
        schedule.activeSunday    === dbSchedule.activeDays.Sun &&
        schedule.switchState     === dbSchedule.switchState
      ) {
        // we don't care about the time particularly, only about the hours:minutes of it. Regardless of the date.
        let dbHours = new Date(xUtil.crownstoneTimeToTimestamp(dbSchedule.time)).getHours();
        let dbMinutes = new Date(xUtil.crownstoneTimeToTimestamp(dbSchedule.time)).getMinutes();

        let hours = new Date(xUtil.crownstoneTimeToTimestamp(schedule.nextTime)).getHours();
        let minutes = new Date(xUtil.crownstoneTimeToTimestamp(schedule.nextTime)).getMinutes();

        if (dbHours === hours && dbMinutes === minutes) {
          return dbScheduleIds[i];
        }
      }
    }
    return null;
  }
};