import { BatchCommandHandler } from '../logic/BatchCommandHandler'
import { LOG }                 from "../logging/Log";
import { eventBus }            from "../util/EventBus";

class FirmwareWatcherClass {
  _initialized: boolean = false;
  store: any;

  constructor() { }

  loadStore(store: any) {
    LOG.info('LOADED STORE KeepAliveHandler', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      // once the user is logged in, we will check if there are crownstones that we do not know the firmware of.
      eventBus.on('userLoggedIn', () => { this._init(); });
    }
    this._initialized = true;
  }

  _init() {
    let state = this.store.getState();
  }
}

export const FirmwareWatcher = new FirmwareWatcherClass();