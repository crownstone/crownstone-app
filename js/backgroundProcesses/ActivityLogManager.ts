import {eventBus} from "../util/EventBus";
import {LOG, LOGe} from "../logging/Log";
import {Util} from "../util/Util";
import {transferActivityLogs} from "../cloud/transferData/transferActivityLogs";
import {MapProvider} from "./MapProvider";
import {transferActivityRanges} from "../cloud/transferData/transferActivityRanges";


class ActivityLogManagerClass {

  _initialized = false
  store = null

  _stagedActions = [];


  loadStore(store) {
    LOG.info('LOADED STORE ActivityLogManager', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      // reset last time fired to 0 so the time diff method will
      this.init();

    }
  }

  init() {
    if (this._initialized === false) {
      eventBus.on("NEW_ACTIVITY_LOG", (data) => { if (data.command) {this._handleActivity(data);}});
      eventBus.on("disconnect",       this._commit.bind(this));
      this._initialized = true;

    }
  }


  /**
   * {
      command:     "keepAliveState" || "keepAlive" || "multiswitch" || "tap2toggle",
      connectedTo: redux stone Id,
      target:      redux stone Id,
      timeout:     com.timeout,
      intent:      com.intent,
      changeState: com.changeState,
      state:       com.state
    }
   * @param data
   * @private
   */
  _handleActivity(data) {
    if (data.command === "keepAliveState" || data.command === "keepAlive") {
      return this._handleActivityRange(data);
    }

    let state = this.store.getState();

    let action = {
      type: "ADD_ACTIVITY_LOG",
      sphereId: data.sphereId,
      stoneId:  data.target,
      logId: Util.getUUID(),
      data: {
        commandUuid: data.commandUuid,
        viaMesh: data.connectedTo !== data.target,
        type: data.command,
        userId: state.user.userId,
        timestamp: new Date().valueOf(),
      }
    }
    let unknownAction = false;
    switch (data.command) {
      case 'keepAliveState':
        action.data["delayInCommand"]  = data.timeout;
        action.data["switchedToState"] = data.changeState ? data.state : -1;
        break;
      case 'multiswitch':
      case 'tap2toggle':
        action.data["delayInCommand"]  = data.timeout;
        action.data["switchedToState"] = data.state;
        action.data["intent"]          = data.intent;
        break;
      case 'keepAlive':
        break;
      default:
        unknownAction = true;
    }

    if (!unknownAction) {
      this._stagedActions.push(action);
    }
  }

  _handleActivityRange(data) {
    let state = this.store.getState();
    let sphere = state.spheres[data.sphereId];
    let stone = sphere.stones[data.target];

    let ranges = stone.activityRanges;
    let rangeIds = Object.keys(ranges);
    let now = new Date().valueOf();
    let activeRangeId = null;
    let activeRange = null;
    for (let i = 0; i < rangeIds.length; i++) {
      let range = ranges[rangeIds[i]];
      let delayInMs = range.delayInCommand*1000;

      if (
        (range.lastDirectTime !== null && now - range.lastDirectTime < delayInMs) ||
        (range.lastMeshTime   !== null && now - range.lastMeshTime   < delayInMs)) {
        // this is the active range!
        activeRange = range;
        activeRangeId = rangeIds[i];
        break;
      }
    }


    let viaMesh = data.connectedTo !== data.target;
    let action = {
      type: "ADD_ACTIVITY_RANGE",
      sphereId: data.sphereId,
      stoneId:  data.target,
      rangeId: null,
      data: {}
    }
    let actionData = {
      count:           1,
      delayInCommand:  data.timeout || sphere.config.exitDelay,
      switchedToState: data.changeState ? data.state : -1,
      type:            data.command,
      cloudId:         null,
      userId:          state.user.userId,
    }
    if (viaMesh) { actionData["lastMeshTime"]   = now; }
    else         { actionData["lastDirectTime"] = now; }

    if (activeRange) {
      action.type = "UPDATE_ACTIVITY_RANGE";
      action.rangeId = activeRangeId;
      actionData.count = activeRange.count + 1;
      actionData.cloudId = activeRange.cloudId;
    }
    else {
      action.rangeId = Util.getUUID();
      actionData["startTime"] = now;
    }

    action.data = actionData;

    this._stagedActions.push(action);
  }

  _commit() {
    if (this._stagedActions.length > 0) {
      this.store.batchDispatch(this._stagedActions);

      let state = this.store.getState();

      let stoneActions : ActivityContainer = {};
      for (let i = 0; i < this._stagedActions.length; i++) {
        let action = this._stagedActions[i];
        let sphere = state.spheres[action.sphereId];
        let stone = sphere.stones[action.stoneId];

        if (stoneActions[action.stoneId] === undefined) {
          stoneActions[action.stoneId] = {
            logData: [],
            newRangeData: [],
            updatedRangeData: [],
          }
        }

        if (action.type === 'ADD_ACTIVITY_LOG') {
          stoneActions[action.stoneId].logData.push({
            localId: action.logId,
            localData: stone.activityLogs[action.logId],
            localSphereId: action.sphereId,
            localStoneId: action.stoneId,
            cloudStoneId: MapProvider.local2cloudMap.stones[action.stoneId],
          })
        }
        else if (action.type === "ADD_ACTIVITY_RANGE" || (action.type === "UPDATE_ACTIVITY_RANGE" && action.data.cloudId === null)) {
          stoneActions[action.stoneId].newRangeData.push({
            localId: action.rangeId,
            localData: stone.activityRanges[action.rangeId],
            localSphereId: action.sphereId,
            localStoneId: action.stoneId,
            cloudStoneId: MapProvider.local2cloudMap.stones[action.stoneId],
          })
        }
        else if (action.type === "UPDATE_ACTIVITY_RANGE") {
          stoneActions[action.stoneId].updatedRangeData.push({
            localId: action.rangeId,
            localData: stone.activityRanges[action.rangeId],
            localSphereId: action.sphereId,
            localStoneId: action.stoneId,
            cloudStoneId: action.data.cloudId,
          })
        }
      }

      Object.keys(stoneActions).forEach((stoneId) => {
        let actions = [];
        if (state.user.uploadActivityLogs) {
          transferActivityLogs.batchCreateOnCloud(state, actions, stoneActions[stoneId].logData)
            .then(() => {
              return transferActivityRanges.batchCreateOnCloud(state, actions, stoneActions[stoneId].newRangeData);
            })
            .then(() => {
              return transferActivityRanges.batchUpdateOnCloud(state, actions, stoneActions[stoneId].updatedRangeData);
            })
            .then(() => {
              this.store.batchDispatch(actions);
            })
            .catch((err) => {
              LOGe.cloud("ActivityLogManager: Error in activity log uploading:", err);
              this.store.batchDispatch(actions);
            })
          }
        })
    }
    this._stagedActions = [];
  }

}


export const ActivityLogManager = new ActivityLogManagerClass();