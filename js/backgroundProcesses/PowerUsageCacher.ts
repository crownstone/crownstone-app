import { core } from "../core";
import { NativeBus } from "../native/libInterface/NativeBus";


const NUMBER_OF_DATA_ELEMENTS = 30;

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
        if (data.serviceData.stateOfExternalCrownstone === false && data.serviceData.errorMode === false) {
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
    if (!adv.referenceId) { return };

    let now = new Date().valueOf();

    if (this.data[adv.referenceId]               === undefined) { this.data[adv.referenceId] = {};               }
    if (this.uniqueElements[adv.referenceId]     === undefined) { this.uniqueElements[adv.referenceId] = {};     }

    // throttling
    if (adv.serviceData.uniqueElement === this.uniqueElements[adv.referenceId][adv.handle]) {
      return;
    }

    // data alloc
    if (this.data[adv.referenceId][adv.handle] === undefined) { this.data[adv.referenceId][adv.handle] = []; }

    this.uniqueElements[adv.referenceId][adv.handle] = adv.serviceData.uniqueElement;

    this.data[adv.referenceId][adv.handle].push({x: now, y: Math.max(0,adv.serviceData.powerUsageReal)})

    if (this.data[adv.referenceId][adv.handle].length > NUMBER_OF_DATA_ELEMENTS) {
      this.data[adv.referenceId][adv.handle].shift();
    }
  }


  getData(sphereId, handle) : GraphData[] {
    if (this.data[sphereId] && this.data[sphereId][handle]) {
      return this.data[sphereId][handle];
    }
    return [];
  }


  getUniqueElement(sphereId, handle) {
    if (this.uniqueElements[sphereId] && this.uniqueElements[sphereId][handle]) {
      return this.uniqueElements[sphereId][handle];
    }
    return null;
  }


}


export const PowerUsageCacher = new PowerUsageCacherClass();