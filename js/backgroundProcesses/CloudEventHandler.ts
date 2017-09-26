import {eventBus} from "../util/EventBus";
import {Util} from "../util/Util";
import {LOG} from "../logging/Log";

class CloudEventHandlerClass {
  _store : any;
  _initialized : boolean = false;

  _loadStore(store) {
    if (this._initialized === false) {
      this._store = store;
      this._initialized = true;

      eventBus.on("submitCloudEvent", (data) => {
        this._store.dispatch({ ...data })
      });
    }
  }
}

export const CloudEventHandler = new CloudEventHandlerClass();