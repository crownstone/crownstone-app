import {INTENTS} from "../../../../native/libInterface/Constants";
import {StoneUtil} from "../../../../util/StoneUtil";
import {DAYS} from "../../DeviceScheduleEdit";


export class ActivityLogProcessor {

  _collectKeepAlives(filteredLogs, logs, index) {
    let iValue = index;
    let sequentialAmount = 0;
    let dtSum = 0;
    let timeSum = 0;
    let lastTime = null;
    let lastLog = null;

    let uniqueLogs = [];
    for (let i = index; i < logs.length; i++) {
      let log = logs[i];
      if (log.type === 'keepAliveState') {
        // compare with the previous keepalive.
        if (lastTime !== null) {
          dtSum += log.timestamp - lastTime;
        }
        sequentialAmount++;
        timeSum += log.timestamp;
        lastTime = log.timestamp;
        lastLog = log;
        uniqueLogs.push(log);
        iValue = i;
      }
      else {
        break;
      }
    }

    if (sequentialAmount > 3) {
      // add a collecting ... in the middle
      filteredLogs.push(uniqueLogs[0]);
      filteredLogs.push({timestamp: timeSum / sequentialAmount, type:'skippedHeartbeat', count: (sequentialAmount - 2), averageTime: Math.round(0.001*(dtSum/(sequentialAmount-1)))});
      filteredLogs.push(uniqueLogs[uniqueLogs.length - 1]);
    }
    else {
      // add seperate keepalives
      for (let i = 0; i < uniqueLogs.length; i++) {
        filteredLogs.push(uniqueLogs[i]);
      }
    }

    return iValue;
  }

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
      if (log.type !== 'schedule')
      this._checkMeshDuplicates(log, logs, i);
      if (log.duplicate !== true) {
        result.push(log);
      }
    }
    return result
  }

  _addDateIndicators(logs) {
    let hasDayBreak = false;

    if (logs.length > 2) {
      if (new Date(logs[0].timestamp).getDay() !== new Date(logs[logs.length - 1].timestamp).getDay()) {
        hasDayBreak = true;
      }
    }

    if (hasDayBreak) {
      logs.push({
        timestamp: new Date(new Date(new Date(logs[logs.length - 1].timestamp).setHours(0)).setMinutes(0)).setSeconds(0),
        type: 'dayIndicator',
      })
    }

    return logs;
  }

  _addEventsForExpiredKeepAlives(logs, keepAliveType) {
    let sequentialAmount = 0;

    let result = [];
    let lastLog = null;
    let lastKeepalive = null;
    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      if (log.type === 'keepAliveState') {
        // compare with the previous keepalive.
        if (lastLog !== null) {
          let dt = log.timestamp - lastLog.timestamp;
          if (dt > 1000 * lastLog.delayInCommand) {
            result.push(this._generateExpiredTimeoutEvent(lastLog.timestamp + 1000 * lastLog.delayInCommand, lastLog.switchedToState, keepAliveType));
          }
        }
        sequentialAmount++;
        lastLog = log;
        result.push(log);
        lastKeepalive = log;
      }
      else {
        result.push(log);
      }
    }

    // evaluate if the last keepalive has expired
    if (lastKeepalive !== null) {
      let dt = new Date().valueOf() - lastKeepalive.timestamp;
      if (dt > 1000*lastKeepalive.delayInCommand) {
        result.push(this._generateExpiredTimeoutEvent(lastKeepalive.timestamp + 1000*lastKeepalive.delayInCommand, lastKeepalive.switchedToState, keepAliveType));
      }
    }

    return result;
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

  _removePresumedDuplicates(logs) {
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
          if (log.intent !== INTENTS.manual && log.intent !== INTENTS.remotely) {
            checkForDuplicate(log);
          }
          else {
            presumedState = log.switchedToState;
          }
        }


        if (log.presumedDuplicate !== true) {
          result.push(log)
        }
      }
      else if (log.type === 'generatedResponse') {
        checkForDuplicate(log);
        if (log.presumedDuplicate !== true) {
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


  _collapseKeepAliveLists(logs) {
    let result = [];
    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      if (log.type === 'keepAliveState') {
        i = this._collectKeepAlives(result, logs, i);
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

    let rawLogs = stone.activityLogs;
    let schedules = stone.schedules;

    let logIds = Object.keys(rawLogs);
    let scheduleId = Object.keys(stone.schedules);

    // convert object to array.
    let logs = [];
    // dont show times older than 1.5 day
    let earliestDateAllowed = new Date().valueOf() - 1.5*24*36000000;
    let minAvailable = new Date().valueOf();
    let deleteActions = [];
    for ( let i = 0; i < logIds.length; i++ ) {
      let log = rawLogs[logIds[i]]
      if (log.timestamp > earliestDateAllowed) {
        minAvailable = Math.min(log.timestamp, minAvailable);
        logs.push({...log});
      }
      else {
        deleteActions.push({type:"REMOVE_ACTIVITY_LOG", sphereId: sphereId, stoneId: stoneId, logId: logIds[i]})
      }
    }

    if (deleteActions.length > 0) {
      store.batchDispatch(deleteActions);
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

    // sort the array by time.
    logs.sort((a,b) => { return a.timestamp - b.timestamp} );

    // first remove all the mesh duplicates
    logs = this._removeMeshDuplicates(logs);

    // add day markers
    logs = this._addDateIndicators(logs)

    // generate log entries for expired keepAlives
    logs = this._addEventsForExpiredKeepAlives(logs, keepAliveType);

    // generate log entries for expired multiSwitches, this will also sort.
    logs = this._addEventsForExpiredMultiswitches(logs, keepAliveType);

    // hide the presumed duplicate actions.
    logs = this._removePresumedDuplicates(logs);

    // collapse keepalive lists
    logs = this._collapseKeepAliveLists(logs);

    // collapse keepalive lists
    if (!showFullLogs) {
      logs = this._filterForUser(logs);
    }

    // we want to show the newest first.
    logs.reverse();

    return logs;
  }
}
