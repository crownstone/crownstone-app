import { NativeEventsBridge } from './NativeEventsBridge'
import { Scheduler } from '../logic/Scheduler';
import { NativeEvents } from './Proxy';
import { LOG } from '../logging/Log'


let trigger = 'CrownstoneAdvertisement';

class AdvertisementHandlerClass {
  constructor() {
    this.initialized = false;
    this.store = undefined;
    Scheduler.setRepeatingTrigger(trigger,{repeatEveryNSeconds:2})
  }

  loadStore(store) {
    LOG('LOADED STORE AdvertisementHandlerClass', this.initialized);
    if (this.initialized === false) {
      this.initialized = true;
      this.store = store;

      this.init();
    }
  }

  init() {
    NativeEventsBridge.bleEvents.on(NativeEvents.ble.verifiedAdvertisementData, this.handleEvent.bind(this));
  }

  handleEvent(advertisement) {
    // LOG(advertisement);
    //
    // TODO: efficiently map the data to the store so we don't do double work.
    // let packet = {
    //   isCrownstone: true,
    //   serviceData: {
    //     C001: {
    //       switchState: 128,
    //       accumulatedEnergy: 0,
    //       stateOfExternalCrownstone: false,
    //       eventBitmask: 0,
    //       setupMode: false,
    //       powerUsage: 402427,
    //       crownstoneId: 1,
    //       temperature: 24,
    //       newDataAvailable: false,
    //       firmwareVersion: 1
    //     }
    //   },
    //   handle: '53CCAD7C-EBA3-4E20-00E9-0D0BC41614DF',
    //   setupPackage: false,
    //   rssi: -61,
    //   name: 'alex__0'
    // };

    // Scheduler.loadAction(trigger,{})
  }
}

export const AdvertisementHandler = new AdvertisementHandlerClass();