import { Scheduler } from '../logic/Scheduler';
import { NativeBus } from './Proxy';
import { LOG, LOGDebug } from '../logging/Log'
import { getMapOfCrownstonesInAllSpheresByHandle, getMapOfCrownstonesInSphereByCID } from '../util/dataUtil'


let trigger = 'CrownstoneAdvertisement';

class AdvertisementHandlerClass {
  constructor() {
    this.initialized = false;
    this.store = undefined;
    this.referenceMap = {};
    this.referenceCIDMap = {};
    this.activeSphere = '';
  }

  loadStore(store) {
    LOG('LOADED STORE AdvertisementHandler', this.initialized);
    if (this.initialized === false) {
      this.store = store;
      this.init();
    }
  }

  init() {
    if (this.initialized === false) {
      // refresh maps when the database changes
      this.store.subscribe(() => {
        let state = this.store.getState();
        this.activeSphere = state.app.activeSphere;
        this.referenceMap = getMapOfCrownstonesInAllSpheresByHandle(state);
        this.referenceCIDMap = getMapOfCrownstonesInSphereByCID(state, this.activeSphere);
      });

      // create a trigger to throttle the updates.
      Scheduler.setRepeatingTrigger(trigger,{repeatEveryNSeconds:2});

      // listen to verified advertisements. Verified means consecutively successfully encrypted.
      NativeBus.on(NativeBus.topics.advertisement, this.handleEvent.bind(this));
      this.initialized = true;
    }
  }

  handleEvent(advertisement) {
    // LOGDebug("GOT ADV:", advertisement);
    // the service data in this advertisement;
    let serviceData = advertisement.serviceData;

    // service data not available
    if (typeof serviceData !== 'object') {
      return;
    }

    // only relevant if we are in a sphere.
    if (!(this.activeSphere)) {
      return;
    }

    // LOGDebug("USING THE ADV!");

    // look for the crownstone in this group which has the same CrownstoneId (CID)
    let refByCID = this.referenceCIDMap[serviceData.crownstoneId];

    // repair mechanism to store the handle.
    if (serviceData.stateOfExternalCrownstone === false && refByCID !== undefined) {
      if (refByCID.handle != advertisement.handle) {
        this.store.dispatch({type: "UPDATE_STONE_HANDLE", sphereId: this.activeSphere, stoneId: refByCID.id, data:{handle: advertisement.handle}});
        return;
      }
    }

    let ref = this.referenceMap[advertisement.handle];
    // unknown crownstone
    if (ref === undefined) {
      return;
    }

    let state = this.store.getState();
    let measuredUsage = Math.floor(serviceData.powerUsage * 0.001);  // usage is in milliwatts

    let currentTime = new Date().valueOf();
    let switchState = serviceData.switchState / 128;

    // small aesthetic fix: no usage if off.
    if (switchState === 0 && measuredUsage > 0) {
      measuredUsage = 0;
    }

    let update = () => {
      Scheduler.loadOverwritableAction( trigger, "updateStoneFromAdvertisement_" + advertisement.handle, {
        type: 'UPDATE_STONE_STATE',
        sphereId: this.activeSphere,
        stoneId: ref.id,
        data: { state: switchState, currentUsage: measuredUsage },
        updatedAt: currentTime
      });
    };

    let stone = state.spheres[this.activeSphere].stones[ref.id];

    if (stone.state.state != switchState) {
      update();
    }
    else if (stone.state.currentUsage != measuredUsage) {
      update();
    }
  }
}

export const AdvertisementHandler = new AdvertisementHandlerClass();




