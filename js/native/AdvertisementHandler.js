import { Scheduler } from '../logic/Scheduler';
import { NativeBus } from './Proxy';
import { StoneStateHandler } from './StoneStateHandler'
import { LOG, LOGDebug, LOGError } from '../logging/Log'
import { getMapOfCrownstonesInAllSpheresByHandle, getMapOfCrownstonesInAllSpheresByCID } from '../util/dataUtil'
import { eventBus }  from '../util/eventBus'

let TRIGGER_ID = 'CrownstoneAdvertisement';
let ADVERTISEMENT_PREFIX =  "updateStoneFromAdvertisement_";

class AdvertisementHandlerClass {
  constructor() {
    this._initialized = false;
    this.store = undefined;
    this.state = {};
    this.referenceHandleMap = {};
    this.referenceCIDMap = {};
    this.stonesInConnectionProcess = {};
    this.temporaryIgnore = false;
    this.temporaryIgnoreTimeout = undefined;
  }

  loadStore(store) {
    LOG('LOADED STORE AdvertisementHandler', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      this.init();
    }
  }

  init() {
    if (this._initialized === false) {
      // TODO: Make into map entity so this is only done once.
      // refresh maps when the database changes
      this.store.subscribe(() => {
        this.state = this.store.getState();
        this.referenceHandleMap = getMapOfCrownstonesInAllSpheresByHandle(this.state);
        this.referenceCIDMap = getMapOfCrownstonesInAllSpheresByCID(this.state);
      });

      // make sure we clear any pending advertisement package updates that are scheduled for this crownstone
      eventBus.on("connect", (handle) => {
        Scheduler.clearOverwritableTriggerAction(TRIGGER_ID, ADVERTISEMENT_PREFIX + handle);
        // this is a fallback mechanism in case no disconnect event is fired.
        this.stonesInConnectionProcess[handle] = {timeout: setTimeout(() => {
          LOGError("(Ignore if doing setup) Force restoring listening to all crownstones since no disconnect state after 5 seconds.");
          this._restoreConnectionTimeout();
        }, 5000)};
      });

      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("disconnect", () => {
        // wait before listening to the stones again.
        Scheduler.scheduleCallback(() => {this._restoreConnectionTimeout();}, 1000);
      });

      // sometimes we need to ignore any trigger for switching because we're doing something else.
      eventBus.on("ignoreTriggers", () => {
        this.temporaryIgnore = true;
        this.temporaryIgnoreTimeout = setTimeout(() => {
          if (this.temporaryIgnore === true) {
            LOGError("Temporary ignore of triggers has been on for more than 20 seconds!!");
          }
        }, 20000 );
      });
      eventBus.on("useTriggers", () => { this.temporaryIgnore = false; clearTimeout(this.temporaryIgnoreTimeout); });

      // create a trigger to throttle the updates.
      Scheduler.setRepeatingTrigger(TRIGGER_ID,{repeatEveryNSeconds:2});

      // listen to verified advertisements. Verified means consecutively successfully encrypted.
      NativeBus.on(NativeBus.topics.advertisement, this.handleEvent.bind(this));
      this._initialized = true;
    }
  }

  _restoreConnectionTimeout() {
    Object.keys(this.stonesInConnectionProcess).forEach((handle) => {
      clearTimeout(this.stonesInConnectionProcess[handle].timeout)
    });
    this.stonesInConnectionProcess = {};
  }

  handleEvent(advertisement) {
    if (this.stonesInConnectionProcess[advertisement.handle] !== undefined) {
      return;
    }

    // the service data in this advertisement;
    let serviceData = advertisement.serviceData;

    // service data not available
    if (typeof serviceData !== 'object') {
      return;
    }

    // check if we have a state
    if (this.state.spheres === undefined) {
      return;
    }

    // only relevant if we are in a sphere.
    if (this.state.spheres[advertisement.referenceId] === undefined) {
      return;
    }

    let sphereId = advertisement.referenceId;

    // look for the crownstone in this sphere which has the same CrownstoneId (CID)
    let refByCID = this.referenceCIDMap[sphereId][serviceData.crownstoneId];

    // repair mechanism to store the handle.
    if (serviceData.stateOfExternalCrownstone === false && refByCID !== undefined) {
      if (refByCID.handle != advertisement.handle) {
        this.store.dispatch({type: "UPDATE_STONE_HANDLE", sphereId: advertisement.referenceId, stoneId: refByCID.id, data:{handle: advertisement.handle}});
        return;
      }
    }

    let ref = this.referenceHandleMap[sphereId][advertisement.handle];
    // unknown crownstone
    if (ref === undefined) {
      return;
    }

    let measuredUsage = Math.floor(serviceData.powerUsage * 0.001);  // usage is in milliwatts

    let currentTime = new Date().valueOf();
    let switchState = serviceData.switchState / 128;

    // small aesthetic fix: force no usage if off.
    if (switchState === 0 && measuredUsage !== 0) {
      measuredUsage = 0;
    }

    // small aesthetic fix: force no negative values.
    if (measuredUsage < 0) {
      measuredUsage = 0;
    }

    let update = () => {
      // sometimes we need to ignore any distance based toggling.
      if (this.temporaryIgnore !== true) {
        Scheduler.loadOverwritableAction(TRIGGER_ID,  ADVERTISEMENT_PREFIX + advertisement.handle, {
          type: 'UPDATE_STONE_STATE',
          sphereId: advertisement.referenceId,
          stoneId: ref.id,
          data: { state: switchState, currentUsage: measuredUsage },
          updatedAt: currentTime
        });
      }
    };

    let stone = this.state.spheres[advertisement.referenceId].stones[ref.id];

    if (stone.state.state != switchState || stone.config.disabled === true) {
      update();
    }
    else if (stone.state.currentUsage != measuredUsage) {
      update();
    }
    else if (stone.state.disabled === true) {
      update();
    }

    StoneStateHandler.receivedUpdate(advertisement.referenceId, ref.id, advertisement.rssi);
  }
}

export const AdvertisementHandler = new AdvertisementHandlerClass();




