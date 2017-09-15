import { BatchCommandHandler } from '../logic/BatchCommandHandler'
import { LOG }                 from "../logging/Log";
import { eventBus }            from "../util/EventBus";
import {NativeBus} from "../native/libInterface/NativeBus";

class MessageSearcherClass {
  _initialized: boolean = false;
  pendingErrorObtaining: any = {};
  store: any;

  constructor() { }

  _loadStore(store: any) {
    LOG.info('LOADED STORE MessageSearcher', this._initialized);
    if (this._initialized === false) {
      this.store = store;

      NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => { this._enterSphere(sphereId); });
      NativeBus.on(NativeBus.topics.exitSphere,  (sphereId) => { this._exitSphere(sphereId); });
      NativeBus.on(NativeBus.topics.enterRoom,   (data)     => { this._enterRoom(data); }); // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.exitRoom,    (data)     => { this._exitRoom(data); });  // data = {region: sphereId, location: locationId}

    }
    this._initialized = true;
  }

  _enterSphere(sphereId) {

  }

  _exitSphere(sphereId) {

  }

  _enterRoom(data) {

  }

  _exitRoom(data) {

  }

  _deliverMessage() {

  }


}

export const MessageSearcher = new MessageSearcherClass();