import {INTENTS} from "../../../../native/libInterface/Constants";
import {StoneUtil} from "../../../../util/StoneUtil";
import {DAYS} from "../../DeviceScheduleEdit";


export class ActivityLogProcessor {

  _checkIfCancelled(reference, logs, index) {
    for (let i = index+1; i < logs.length; i++) {
      let log = logs[i];
      if (log.type === 'multiswitch') {
        if (log.timestamp - reference.timestamp < 1000*reference.delayInCommand) {
          log.cancelled = true;
          return true;
        }
      }
      else if (log.timestamp - reference.timestamp > 1000*reference.delayInCommand) {
        return false;
      }
    }
    return false;
  }

  _checkMeshDuplicates(reference, logs, index) {
    let amountOfMeshRelays = 0;
    // dont look too far ahead, no need for that.
    let lastDuplicate = null;
    let directFound = false;
    for (let i = index; i < logs.length && i < index + 40; i++) {
      let log = logs[i];
      if (log.duplicate !== true && log.amountOfMeshCommands === undefined) {
        if (log.commandUuid === reference.commandUuid) {
          if (log.viaMesh === false) {
            // we will only send via mesh if wel
            log.amountOfMeshCommands = amountOfMeshRelays;
            directFound = true;
            break;
          }
          else {
            log.duplicate = true
            lastDuplicate = log;
            amountOfMeshRelays++;
          }
        }
      }
    }

    // in case the mesh commands have been sent but no direct message was sent:
    if (lastDuplicate !== null && directFound === false) {
      lastDuplicate.duplicate = false;
      lastDuplicate.amountOfMeshCommands = amountOfMeshRelays;
    }
  }

  _removeMeshDuplicates(logs) {
    let result = [];
    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      if (log.type !== 'schedule' && log.isRange !== true)
      this._checkMeshDuplicates(log, logs, i);
      if (log.duplicate !== true) {
        result.push(log);
      }
    }
    return result
  }

  _addEventsForActivityRanges(logs, activityRanges, keepAliveType, userId) {
    // add an enter event on the start, and a leave event at the last time
    // do this for your used, then check if the other users did something?
    let now = new Date().valueOf();
    let activityRangeIds = Object.keys(activityRanges);
    for (let i = 0; i < activityRangeIds.length; i++) {
      let range = activityRanges[activityRangeIds[i]];
      // console.log(range.userId === userId, new Date(range.startTime), new Date(range.lastDirectTime), new Date(range.lastMeshTime), range)
      // logs.push({
      //   timestamp: range.startTime,
      //   generatedFrom: keepAliveType,
      //   type:      'startRange s:' + (range.userId === userId),
      //   startTime: range.startTime,
      //   count:     range.count,
      //   userId:    range.userId,
      //   isSelf:    range.userId === userId,
      //   switchedToState: range.switchedToState,
      //   isRange:   true,
      // });

      let endTime = 0
      if (range.lastDirectTime !== null && range.lastMeshTime !== null) {
        endTime = Math.max(range.lastDirectTime, range.lastMeshTime);
      }
      else if (range.lastDirectTime) {
        endTime = range.lastDirectTime;
      }
      else {
        endTime = range.lastMeshTime;
      }

      if (endTime + range.delayInCommand*1000 > now) {
        logs.push({
          timestamp: now,
          generatedFrom: keepAliveType,
          type:      'statusUpdate',
          startTime: range.startTime,
          count:     range.count,
          userId:    range.userId,
          isSelf:    range.userId === userId,
          switchedToState: range.switchedToState,
          isRange:   true,
        })
      }
      else {
        let expirationTime = endTime + range.delayInCommand*1000;
        // we check if there were other people in the sphere at that time
        let otherUserPresent = false;
        for (let j = 0; j < activityRangeIds.length; j++) {
          let referenceRange = activityRanges[activityRangeIds[j]];

          // only compare with other users.
          if (referenceRange.userId == userId) { continue; }

          let referenceEndTime = 0;
          if (referenceRange.lastDirectTime !== null && referenceRange.lastMeshTime !== null) {
            referenceEndTime = Math.max(referenceRange.lastDirectTime, referenceRange.lastMeshTime);
          }
          else if (referenceRange.lastDirectTime) {
            referenceEndTime = referenceRange.lastDirectTime;
          }
          else {
            referenceEndTime = referenceRange.lastMeshTime;
          }

          if (expirationTime > referenceRange.startTime && expirationTime < referenceEndTime) {
            otherUserPresent = true;
            break;
          }
        }

        logs.push({
          timestamp: expirationTime,
          generatedFrom: keepAliveType,
          type:   'generatedExit',
          userId: range.userId,
          count:  range.count,
          endTime: endTime,
          isSelf: range.userId === userId,
          switchedToState:  range.switchedToState,
          otherUserPresent: otherUserPresent,
          isRange: true,
        });
      }
    }

    return logs;
  }

  _addDateIndicators(logs) {
    let additions = []
    for (let i = 1; i < logs.length; i++) {
      if (new Date(logs[i].timestamp).getDay() !== new Date(logs[i-1].timestamp).getDay()) {
        additions.push({
          timestamp: new Date(new Date(new Date(logs[i].timestamp).setHours(0)).setMinutes(0)).setSeconds(0),
          type: 'dayIndicator',
        })
      }
    }

    logs = logs.concat(additions);
    return logs;
  }

  _addEventsForExpiredMultiswitches(logs, keepAliveType) {
    let result = [];
    let cancelledMultiswitchCommands = [];
    let now = new Date().valueOf();
    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      if (log.type === 'multiswitch') {
        if (log.delayInCommand > 0) {
          if (this._checkIfCancelled(log, logs, i)) {
            log.cancelled = true;
          }
          else {
            // not cancelled, check if expired
            if (now - log.timestamp >= 1000 * log.delayInCommand) {
              result.push(this._generateExpiredTimeoutEvent(log.timestamp + 1000*log.delayInCommand, log.switchedToState, keepAliveType,'multiswitch'));
            }
          }
        }

        if (log.cancelled !== true) {
          result.push(log);
        }
        else {
          cancelledMultiswitchCommands.push(log);
        }
      }
      else {
        result.push(log);
      }
    }


    // Add the last 2 cancelled commands to the list for user understanding.
    if (cancelledMultiswitchCommands.length >= 2) {
      if (new Date().valueOf() - cancelledMultiswitchCommands[cancelledMultiswitchCommands.length - 2].timestamp < 5*60000) {
        result.push(cancelledMultiswitchCommands[cancelledMultiswitchCommands.length - 2]);
        result.push(cancelledMultiswitchCommands[cancelledMultiswitchCommands.length - 1]);
      }
    }

    // sort the array by time.
    result.sort((a, b) => {
      return a.timestamp - b.timestamp
    });

    return result;
  }


  _generateExpiredTimeoutEvent(timestamp, switchedToState, type, extra = null) {
    return {
      timestamp: timestamp,
      type: 'generatedResponse',
      switchedToState: switchedToState,
      generatedFrom: type,
      extra: extra
    }
  }

  _markPresumedDuplicates(logs) {
    // hide the presumed duplicate actions.
    let presumedState = null;
    let result = [];

    let checkForDuplicate = (log) => {
      if (log.switchedToState === -1) {
        log.presumedDuplicate = true;
      }
      else {
        if (presumedState === log.switchedToState) {
          log.presumedDuplicate = true;
        }
        presumedState = log.switchedToState;
      }
    }

    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      if (log.type === 'multiswitch' && log.cancelled !== true) {
        if (log.delayInCommand === 0) {
          // if (log.intent !== INTENTS.manual) {
          //   checkForDuplicate(log);
          // }
          // else {
          //   presumedState = log.switchedToState;
          // }
          presumedState = log.switchedToState;
        }


        if (log.presumedDuplicate !== true) {
          result.push(log)
        }
        else {
          result.push(log)
        }
      }
      else if (log.type === 'generatedResponse') {
        checkForDuplicate(log);
        if (log.presumedDuplicate !== true) {
          result.push(log);
        }
        else {
          result.push(log);
        }
      }
      else if (log.type === 'tap2toggle') {
        presumedState = log.switchedToState;
        result.push(log);
      }
      else if (log.type === 'schedule') {
        checkForDuplicate(log);
        result.push(log);
      }
      else {
        result.push(log);
      }
    }

    return result;
  }


  _filterForUser(logs) {
    let result = [];
    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      if (log.type !== 'keepAliveState' && log.type !== 'skippedHeartbeat') {
        if (log.type === 'multiswitch' && log.delayInCommand !== 0) {
          // ignore
        }
        else {
          result.push(log);
        }
      }
    }

    return result;
  }

  process(store, sphereId, stoneId, keepAliveType, showFullLogs = false) {
    const state = store.getState();
    const sphere = state.spheres[sphereId];
    const stone = sphere.stones[stoneId];
    let userId = state.user.userId;

    let rawLogs = stone.activityLogs;
    let activityRanges = stone.activityRanges;

    let schedules = stone.schedules;

    let logIds = Object.keys(rawLogs);
    let scheduleId = Object.keys(stone.schedules);

    // convert object to array.
    let logs = [];
    // dont show times older than 1.5 day
    let minAvailable = new Date().valueOf();
    for ( let i = 0; i < logIds.length; i++ ) {
      let log = rawLogs[logIds[i]]
      if (state.development.show_only_own_activity_log) {
        if (log.userId === userId) {
          minAvailable = Math.min(log.timestamp, minAvailable);
          logs.push({...log});
        }
      }
      else {
        minAvailable = Math.min(log.timestamp, minAvailable);
        logs.push({...log});
      }
    }





    for ( let i = 0; i < scheduleId.length; i++ ) {
      let schedule = schedules[scheduleId[i]];
      let time = new Date(StoneUtil.crownstoneTimeToTimestamp(schedule.time))
      let now = new Date().valueOf()

      let timeToday = new Date(new Date(new Date(now).setHours(time.getHours())).setMinutes(time.getMinutes())).setSeconds(0);
      let timeYesterday = new Date(new Date(new Date(now - 24 * 3600000).setHours(time.getHours())).setMinutes(time.getMinutes())).setSeconds(0);

      if (timeYesterday > minAvailable) {
        if (schedule.activeDays[DAYS[new Date(timeYesterday).getDay()]] == true) {
          logs.push({
            timestamp: timeYesterday,
            switchedToState: schedule.switchState,
            type: 'schedule',
            label: schedule.label
          });
        }
      }

      if (timeToday < now) {
        if (schedule.activeDays[DAYS[new Date(timeToday).getDay()]] == true) {
          logs.push({
            timestamp: timeToday,
            switchedToState: schedule.switchState,
            type: 'schedule',
            label: schedule.label
          });
        }
      }
    }

    // insert activity ranges here
    logs = this._addEventsForActivityRanges(logs, activityRanges, keepAliveType, userId);

    // sort the array by time.
    logs.sort((a,b) => { return a.timestamp - b.timestamp} );

    // first remove all the mesh duplicates
    logs = this._removeMeshDuplicates(logs);

    // add day markers
    logs = this._addDateIndicators(logs)

    // generate log entries for expired multiSwitches, this will also sort.
    logs = this._addEventsForExpiredMultiswitches(logs, keepAliveType);

    // hide the presumed duplicate actions.
    logs = this._markPresumedDuplicates(logs);

    // collapse keepalive lists
    if (!showFullLogs) {
      logs = this._filterForUser(logs);
    }

    // we want to show the newest first.
    logs.reverse();

    return logs;
  }
}
