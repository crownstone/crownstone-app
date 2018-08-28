import {LOG, LOGe} from "../../logging/Log";
import { eventBus }  from "../../util/EventBus";
import { Scheduler } from "../../logic/Scheduler";
import {Util} from "../../util/Util";
import {CLOUD} from "../../cloud/cloudAPI";

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
      }, true);


    }
  }

  _evaluateSchedule() {
    // find in which Sphere we are present
    let state = this.store.getState();
    let presentSphereId = Util.data.getPresentSphereId(state);

    if (presentSphereId === null) { return; }

    let sphere = state.spheres[presentSphereId];
    let toons  = sphere.thirdParty.toons;

    let currentDeviceSpecs = Util.data.getDeviceSpecs(state);
    let deviceId = Util.data.getDeviceIdFromState(state, currentDeviceSpecs.address);

    Object.keys(toons).forEach((toonId) => {
      let toon = toons[toonId];
      // only use the ENABLED Toons in this sphere
      if (toon.enabled) {
        // evaluate if the schedule is currently set to "AWAY"
        let activeProgram = this._getActiveProgram(toon.schedule)
        if (activeProgram.program === 'away') {
          // if the schedule is away BUT I am home, the toon should be on too!
          let timestampOfStartProgram = new Date(new Date().setHours(activeProgram.start.hour)).setMinutes(activeProgram.start.minute);
          if (timestampOfStartProgram < toon.cloudChangedProgramTime && toon.cloudChangedProgram === 'home') {
            // cloud has already changed the program
          }
          else {
            CLOUD.forToon(toonId).thirdParty.toon.setToonToHome(deviceId)
              .catch((err) => {
                if (err && err.statusCode == 405 && err.model) {
                  return err.model;
                }
                else {
                  LOGe.cloud("ToonIntegration: Unexpected error in cloud request:", err);
                  throw err;
                }
              })
              .then((toon) => {
                let action = {
                  type:    'UPDATE_TOON',
                  sphereId: presentSphereId,
                  toonId:   toonId,
                  data: {
                   schedule:           toon.schedule,
                   changedToProgram:   toon.changedToProgram,
                   changedProgramTime: toon.changedProgramTime,
                  }
                };
                this.store.dispatch(action);
              })
          }
        }
        else {
          // We do not do anything if the schedule is not set to AWAY
        }
      }
    })
  }

  _getActiveProgram(scheduleString : string) {
    let currentDate = new Date();
    let scheduleObj = null;
    try {
      scheduleObj = JSON.parse(scheduleString);
    }
    catch (err) {
      LOGe.info("ToonIntegration: Schedule is not a valid json object.", scheduleString)
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
        minutesSinceMidnight >= (timeslot.start.hour * 60 + timeslot.start.minute ) &&
        minutesSinceMidnight <  (timeslot.end.hour   * 60 + timeslot.end.minute   )
      ) {
        return timeslot;
      }
    }
    return null;
  }


  _handleExitSphere(sphereId) {
    // find in which Sphere we are present
    let state = this.store.getState();
    let sphere = state.spheres[sphereId];
    let toons  = sphere.thirdParty.toons;

    let currentDeviceSpecs = Util.data.getDeviceSpecs(state);
    let deviceId = Util.data.getDeviceIdFromState(state, currentDeviceSpecs.address);

    Object.keys(toons).forEach((toonId) => {
      let toon = toons[toonId];
      // only use the ENABLED Toons in this sphere
      if (toon.enabled) {
        // evaluate if the schedule is currently set to "AWAY"
        let activeProgram = this._getActiveProgram(toon.schedule)
        if (activeProgram.program === 'away') {
          CLOUD.forToon(toonId).thirdParty.toon.setToonToAway(deviceId)
            .catch((err) => {
              if (err && err.statusCode == 405 && err.model) {
                return err.model;
              }
              else {
                LOGe.cloud("ToonIntegration: Unexpected error in cloud request:", err);
                throw err;
              }
            })
            .then((toon) => {
              let action = {
                type:    'UPDATE_TOON',
                sphereId: sphereId,
                toonId:   toonId,
                data: {
                  schedule:           toon.schedule,
                  changedToProgram:   toon.changedToProgram,
                  changedProgramTime: toon.changedProgramTime,
                }
              };
              this.store.dispatch(action);
            })
        }
        else {
          // We do not do anything if the schedule is not set to AWAY
        }
      }
    })
  }
}

export const ToonIntegration = new ToonIntegrationClass();