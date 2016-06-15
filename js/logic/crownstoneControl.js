import { getRoomContentFromState } from '../util/dataUtil'
import { NativeBridge } from '../native/NativeBridge'

class BlePromiseManagerClass {
  constructor() {
    this.pendingPromises = [];
    this.promiseInProgress = undefined;
  }

  register(promise) {
    console.log("registered")
    if (this.promiseInProgress === undefined) {
      this.executePromise(promise);
    }
    else {
      console.log('adding to stack')
      this.pendingPromises.push((promise));
    }
  }

  executePromise(promise) {
    console.log('executed')
    this.promiseInProgress = true;
    promise()
      .then(() => {
          this.promiseInProgress = undefined;
          this.getNextPromise()
        }
      )
      .catch((err) => {
        console.log("ERROR in promise:",err);
      })
  }

  getNextPromise() {
    console.log('get next')
    if (this.pendingPromises.length > 0) {
      let nextPromise = this.pendingPromises[0];
      this.executePromise(nextPromise);
      this.pendingPromises.shift();
    }
  }
}

export const BlePromiseManager = new BlePromiseManagerClass();

export const reactToEnterRoom = function(store, locationId) {
  checkBehaviour(store, locationId, 'onRoomEnter');
};
export const reactToExitRoom = function(store, locationId) {
  checkBehaviour(store, locationId, 'onRoomExit');
};


function checkBehaviour(store, locationId, type) {
  const state = store.getState();
  const activeGroup = state.app.activeGroup;

  const devices = getRoomContentFromState(state, activeGroup, locationId);

  let stoneIds = Object.keys(devices);

  stoneIds.forEach((stoneId) => {
    let device = devices[stoneId].device;
    let stone = devices[stoneId].stone;
    let behaviour = device.behaviour[type];
    if (behaviour.active === true && behaviour.state !== stone.state.state) {
      setTimeout(() => {setBehaviour(stone.config.uuid, behaviour.state, type);}, behaviour.delay*1000);
    }
  });
}

function setBehaviour(uuid, state, type) {
  console.log("Setting behaviour for ",uuid, 'to', state,' on event', type);
  NativeBridge.connectAndSetSwitchState(uuid, state);
}

export const processScanResponse = function(store, packet) {
  if (packet) {
    packet = JSON.parse(packet);
  }
  if (packet.serviceData && packet.serviceData["C001"] && packet.serviceData["C001"].crownstoneId) {
    const state = store.getState();
    const activeGroup = state.app.activeGroup;
    let serviceData = packet.serviceData["C001"];
    let stoneId = serviceData.crownstoneId;
    let stone = state.groups[activeGroup].stones[stoneId]


    if (Math.round(stone.state.state*255) !== serviceData.switchState) {
      // store.dispatch({type:"UPDATE_STONE_STATE", groupId: activeGroup, stoneId: stoneId, data:{state: serviceData.switchState/255, currentUsage:Math.max(0,serviceData.powerUsage)}})
    }
    else if (Math.abs(stone.state.currentUsage - serviceData.powerUsage) > 2) {
      // store.dispatch({type:"UPDATE_STONE_STATE", groupId: activeGroup, stoneId: stoneId, data:{state: serviceData.switchState/255, currentUsage:Math.max(0,serviceData.powerUsage)}})
    }
    // m.facebook.react.JavaScript] 'packet', '{"id":"2E32A7E2-91B9-ACDC-A893-F26A7D1AAEF8","serviceData":{"C001":{"reserved":0,"crownstoneStateId":0,"switchState":255,"accumulatedEnergy":0,"eventBitmask":0,"powerUsage":28,"crownstoneId":3}},"rssi":-82,"name":"dev_3_3"}'
  }
};








































