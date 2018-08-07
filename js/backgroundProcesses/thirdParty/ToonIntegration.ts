import {LOG, LOGe} from "../../logging/Log";
import { eventBus }  from "../../util/EventBus";
import { Scheduler } from "../../logic/Scheduler";
import {Util} from "../../util/Util";

const CHECK_TOON_SCHEDULE_TRIGGER = "CHECK_TOON_SCHEDULE_TRIGGER";

class ToonIntegrationClass {

  _initialized = false
  store = null

  loadStore(store) {
    LOG.info('LOADED STORE ToonIntegration', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      // reset last time fired to 0 so the time diff method will
      this.init();

    }
  }

  init() {
    if (this._initialized === false) {
      this._initialized = true;
      eventBus.on('exitSphere', (sphereId) => { this._handleExitSphere(sphereId) });
      Scheduler.setRepeatingTrigger(CHECK_TOON_SCHEDULE_TRIGGER, {repeatEveryNSeconds: 120}); // check every 2 minutes

      // if the app is open, update the user locations every 10 seconds
      Scheduler.loadCallback(CHECK_TOON_SCHEDULE_TRIGGER, () => {
        this._evaluateSchedule();
      });
    }
  }

  _evaluateSchedule() {
    // find in which Sphere we are present
    let state = this.store.getState();
    let presentSphereId = Util.data.getPresentSphereId(state);

    if (presentSphereId === null) { return; }

    let sphere = state.spheres[presentSphereId];
    let toons = sphere.thirdParty.toons;
    Object.keys(toons).forEach((toonId) => {
      if (toons[toonId].enabled) {
        if (this._checkIfScheduleIsAway(toons[toonId].schedule)) {

        }
      }
    })

    // get the ENABLED Toons in this sphere

    // JSON.stringify the schedule (with try catch)

    // evaluate if the schedule is currently set to "AWAY"

    // check if the cloud already interfered with the Toon

    // if not (or if you dont know), notify the CLOUD to set it to "HOME"

    // Store the time the cloud interfered with the Toon

  }

  _checkIfScheduleIsAway(scheduleString : string) {
    let currentDate = new Date();
    let scheduleObj = null;
    try {
      scheduleObj = JSON.parse(scheduleString);
    }
    catch (err) {
      LOGe.info("ToonIntegration: Schedule is not a valid json object.")
      return false;
    }

    let day    = currentDate.getDay(); // 0 for Sunday, ... 6 Saturday
    let dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    let hours   = currentDate.getHours();
    let minutes = currentDate.getMinutes();

    let minutesSinceMidnight = hours*60 + minutes;

    let scheduleToday = scheduleObj[dayMap[day]];
    for ( let i = 0; i < scheduleToday.length; i++ ) {
      let timeslot = scheduleToday[i];
      if (
          minutesSinceMidnight >= (timeslot.start.hour*60 + timeslot.start.minute) &&
          minutesSinceMidnight <  (timeslot.end.hour  *60 + timeslot.end.minute  )
         ) {
        if (timeslot.program === 'away') {
          return true;
        }
      }
    }
    return false;
  }


  _handleExitSphere(sphereId) {
    // get the ENABLED Toons in this sphere

    // JSON.stringify the schedule (with try catch)

    // evaluate if the schedule is currently set to "AWAY" (assuming it was changed by the cloud to HOME, but now it should be AWAY again)

    // tell the cloud you left. There can be a race condition with the storing of the location so the cloud should ignore this device.

    // the cloud will tell you if it has restored the program to the schedule.


  }
}

export const ToonIntegration = new ToonIntegrationClass();