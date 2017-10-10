import {StoneUtil} from "./StoneUtil";
import {LOG} from "../logging/Log";

export const ScheduleUtil = {
  getNextTime: function(time, activeDays) {
    let currentDayOfWeek = new Date().getDay(); // 0 .. 6 with sunday = 0
    let now = new Date().valueOf();

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
          return StoneUtil.timestampToCrownstoneTime(timeAtDay);
        }
      }
    }

    LOG.error("DeviceScheduleEdit: Error, could not determine next time to fire!", time, activeDays);
  },
};