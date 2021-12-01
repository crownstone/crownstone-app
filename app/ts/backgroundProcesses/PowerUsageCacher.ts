import { core } from "../Core";
import { NativeBus } from "../native/libInterface/NativeBus";


export const CACHE_TIME = 80*1000 // 80 seconds

class PowerUsageCacherClass {

  initialized = false;

  data = {};
  uniqueElements = {};
  unsubscribeNativeBusEvent = () => {}

  started = false

  constructor() {}

  init() {
    if (this.initialized === false) {
      this.initialized = true;
    }
  }

  start() {
    if (this.started === false) {
      this.started = true;
      this.unsubscribeNativeBusEvent = core.nativeBus.on(NativeBus.topics.advertisement, (data: crownstoneAdvertisement) => {
        if (data.serviceData.stateOfExternalCrownstone === false && data.serviceData.errorMode === false && data.serviceData.alternativeState === false) {
          this.processData(data);
        }
      });
    }
  }

  stop() {
    this.started = false;
    this.unsubscribeNativeBusEvent();
    this.unsubscribeNativeBusEvent = () => {};
  }

  processData(adv : crownstoneAdvertisement) {
    if (!adv.referenceId) { return }

    let now = Date.now();

    if (this.data[adv.referenceId]           === undefined) { this.data[adv.referenceId] = {};               }
    if (this.uniqueElements[adv.referenceId] === undefined) { this.uniqueElements[adv.referenceId] = {};     }

    // throttling
    if (adv.serviceData.uniqueElement === this.uniqueElements[adv.referenceId][adv.handle]) {
      return;
    }

    // data alloc
    if (this.data[adv.referenceId][adv.handle] === undefined) { this.data[adv.referenceId][adv.handle] = []; }

    this.uniqueElements[adv.referenceId][adv.handle] = adv.serviceData.uniqueElement;

    this.data[adv.referenceId][adv.handle].push({x: now, y: Math.max(0,adv.serviceData.powerUsageReal)})

    this.clean(adv);
  }


  // remove old data so we only keep a cache of CACHE_TIME length.
  clean(adv) {
    let now = Date.now();
    if (now - this.data[adv.referenceId][adv.handle][0].x > CACHE_TIME) {
      this.data[adv.referenceId][adv.handle].shift();
      this.clean(adv);
    }
  }


  getData(sphereId, handle) : GraphData[] {
    if (this.data[sphereId] === undefined) {
      this.data[sphereId] = {};
    }
    if (this.data[sphereId][handle] === undefined) {
      this.data[sphereId][handle] = [];
    }

    return this.data[sphereId][handle];
  }


  getUniqueElement(sphereId, handle) {
    if (this.uniqueElements[sphereId] && this.uniqueElements[sphereId][handle]) {
      return this.uniqueElements[sphereId][handle];
    }
    return null;
  }


}


export const PowerUsageCacher = new PowerUsageCacherClass();