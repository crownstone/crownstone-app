import {eventBus} from "../util/EventBus";
import {LOG} from "../logging/Log";
import {syncEvents} from "../cloud/sections/sync/syncEvents";

class CloudEventHandlerClass {
  _store : any;
  _initialized : boolean = false;
  _eventSyncInProgress : boolean = false;

  loadStore(store) {
    if (this._initialized === false) {
      this._store = store;
      this._initialized = true;
      this._eventSyncInProgress = false;

      let pendingActions = [];
      eventBus.on("submitCloudEvent", (data) => {
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
            this._store.batchDispatch(dispatchingActions);
            // next tick we execute eventSync.
            setTimeout(() => { this._executeEventSync(); },0);
          }},0);
      });
    }
  }

  _executeEventSync() {
    if (this._eventSyncInProgress === false) {
      this._eventSyncInProgress = true;
      syncEvents(this._store)
        .then(() => {
          this._eventSyncInProgress = false;
        })
        .catch((err) => {
          LOG.error("Failed Event Sync: ", err);
          this._eventSyncInProgress = false;
        });
    }
  }
}

export const CloudEventHandler = new CloudEventHandlerClass();