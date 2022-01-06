import {LOG, LOGe} from "../logging/Log";
import {syncEvents} from "../cloud/sections/sync/syncEvents";
import {core} from "../Core";

class CloudEventHandlerClass {
  _initialized : boolean = false;
  _eventSyncInProgress : boolean = false;

  init() {
    if (this._initialized === false) {
      this._initialized = true;
      this._eventSyncInProgress = false;

      let pendingActions = [];
      core.eventBus.on("submitCloudEvent", (data) => {
        if (!data) { return; }

        if (Array.isArray(data) && data.length > 0) {
          data.forEach((action) => {
            pendingActions.push(action);
          });
        }
        else {
           pendingActions.push(data);
        }

        // perform the update on the next tick.
        setTimeout(() => {
          if (pendingActions.length > 0) {
            let dispatchingActions = pendingActions;
            pendingActions = [];
            LOG.info("CloudEventHandler: dispatching to store:", dispatchingActions);
            core.store.batchDispatch(dispatchingActions);
            // next tick we execute eventSync.
            setTimeout(() => { this._executeEventSync(); },0);
          }},0);
      });
    }
  }

  _executeEventSync() {
    if (this._eventSyncInProgress === false) {
      this._eventSyncInProgress = true;
      syncEvents(core.store)
        .then(() => {
          this._eventSyncInProgress = false;
        })
        .catch((err) => {
          LOGe.cloud("Failed Event Sync: ", err?.message);
          this._eventSyncInProgress = false;
        });
    }
  }
}

export const CloudEventHandler = new CloudEventHandlerClass();