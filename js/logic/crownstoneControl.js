import { getRoomContentFromState } from '../util/dataUtil'
import { NativeBridge } from '../native/NativeBridge'

export const reactToEnterRoom = function(store, locationId) {
  checkBehaviour(store, locationId, 'onRoomEnter');
};
export const reactToExitRoom = function(store, locationId) {
  checkBehaviour(store, locationId, 'onRoomExit');
};

function checkBehaviour(store, locationId, type) {
  const state = store.getState();
  const activeGroup = state.app.activeGroup;
  const locations = state.groups[activeGroup].locations;
  const locationIds = Object.keys(locations);
  const location = locations[locationId];

  if (location === undefined) {
    console.log("COULD NOT GET LOCATION", locationId);
    return;
  }
  const userId = state.user.userId;
  const devices = getRoomContentFromState(state, activeGroup, locationId);

  if (type === "onRoomExit") {
    if (locations[locationId].presentUsers.indexOf(userId) !== -1) {
      store.dispatch({type:"USER_EXIT", groupId: activeGroup, locationId: locationId, data:{userId: userId}})
    }
  }
  else if (type === "onRoomEnter") {

    // remove user from other rooms SHOULD NOT BE NEEDED.
    // locationIds.forEach((otherLocationId) => {
    //   if (otherLocationId !== locationId) {
    //     if (locations[otherLocationId].presentUsers.indexOf(userId) !== -1) {
    //       store.dispatch({type: "USER_EXIT", groupId: activeGroup, locationId: otherLocationId, data: {userId: userId}})
    //     }
    //   }
    // });
    // add user to rooms
    if (locations[locationId].presentUsers.indexOf(userId) === -1) {
      store.dispatch({type:"USER_ENTER", groupId: activeGroup, locationId: locationId, data:{userId: userId}})
    }
  }

  let stoneIds = Object.keys(devices);

  stoneIds.forEach((stoneId) => {
    let device = devices[stoneId].device;
    let stone = devices[stoneId].stone;
    let behaviour = device.behaviour[type];
    //console.log("switching to ",behaviour, devices, stoneId)
    if (behaviour.active === true && behaviour.state !== stone.state.state) {
      setTimeout(() => {setBehaviour(stone.config.uuid, behaviour.state, type);}, behaviour.delay*1000);
    }
  });
}

function setBehaviour(uuid, state, type) {
  console.log("Setting behaviour for ",uuid, 'to', state,' on event', type, ' @ time:', new Date().valueOf());
  NativeBridge.connectAndSetSwitchState(uuid, state).then(()=>{}).catch(()=>{});
}

class AdvertisementManagerClass {
  constructor() {
    this.stones = {};
    this.windowSize = 50;
  }


  getPower(serviceData) {
    if (serviceData.crownstoneId && serviceData.powerUsage) {
      let id = serviceData.crownstoneId;
      let usage = Math.max(0,serviceData.powerUsage);

      if (this.stones[id] === undefined) {
        let newData = [];
        let newFilteredData = [];
        for (let i = 0; i < this.windowSize; i++) {
          newData.push(0);
          newFilteredData.push(0);
        }
        this.stones[id] = {index: 0, data: newData, updateTime: 0};
      }
      let stone = this.stones[id];

      stone.data[stone.index++] = usage;
      let mean = this.getMean(stone.data);
      let std = this.getStd(stone.data, mean);

      let dataWithoutOutliers = this.filterData(stone.data, mean, std);

      if (dataWithoutOutliers.length == 0) {
        mean = this.getMean(dataWithoutOutliers);
      }

      return Math.round(mean);
    }
    return 0;
  }

  filterData(data, mean, std) {
    let filteredData = [];
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i] - mean) < 1 * std) {
        filteredData.push(data[i])
      }
    }
    return filteredData;
  }

  getMean(data) {
    let total = 0;
    for (let i = 0; i < data.length; i++) {
      total += data[i]
    }
    return total / data.length
  }

  getStd(data, mean) {
    let total = 0;
    for (let i = 0; i < data.length; i++) {
      total += Math.pow(data[i] - mean, 2)
    }
    return Math.sqrt(total/data.length);
  }
}

const AdvertisementManager = new AdvertisementManagerClass();


export const processScanResponse = function(store, packet) {
  if (packet) {
    packet = JSON.parse(packet);
  }
  if (packet.serviceData && packet.serviceData["C001"] && packet.serviceData["C001"].crownstoneId) {
    const state = store.getState();
    const activeGroup = state.app.activeGroup;
    let serviceData = packet.serviceData["C001"];
    let stoneId = serviceData.crownstoneId;
    let stone = state.groups[activeGroup].stones[stoneId];

    // break if a different thing is scanned
    if (stone === undefined) {
      return;
    }

    if (stone.config.uuid !== packet.id) {
      console.log("RESTORING ID FOR ", stone.id , " TO ", packet.id);
      store.dispatch({
        type: "UPDATE_STONE_CONFIG",
        groupId: activeGroup,
        stoneId: stoneId,
        data: {uuid: packet.id}
      })
    }

    let locationName = state.groups[activeGroup].locations[stone.config.locationId].config.name;
    let powerUsage = AdvertisementManager.getPower(serviceData);

    // abide by the update time.
    if (Math.round(stone.state.state * 255) !== serviceData.switchState) {
      console.log("SETTING SWITCH STATE for state", stone.state.state, serviceData, " in: ", locationName);
      store.dispatch({
        type: "UPDATE_STONE_STATE",
        groupId: activeGroup,
        stoneId: stoneId,
        data: {state: serviceData.switchState / 255, currentUsage: Math.max(0, serviceData.powerUsage)}
      })
    }
    else if (Math.abs(powerUsage - powerUsage) > 1) {
      console.log("SETTING SWITCH STATE for power", powerUsage - serviceData.powerUsage, powerUsage, " in: ", locationName);
      store.dispatch({
        type: "UPDATE_STONE_STATE",
        groupId: activeGroup,
        stoneId: stoneId,
        data: {state: serviceData.switchState / 255, currentUsage: powerUsage}
      })
    }
  }
};








































