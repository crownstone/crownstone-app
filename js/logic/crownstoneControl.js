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
      console.log("dispatching user enter event in", activeGroup, locationId, userId);
      store.dispatch({type:"USER_ENTER", groupId: activeGroup, locationId: locationId, data:{userId: userId}})
    }
  }

  let stoneIds = Object.keys(devices);

  stoneIds.forEach((stoneId) => {
    let device = devices[stoneId].device;
    let stone = devices[stoneId].stone;
    let behaviour = device.behaviour[type];
    //console.log("switching to ",behaviour, devices, stoneId)
    if (behaviour.active === true) {
    //if (behaviour.active === true && behaviour.state !== stone.state.state) {
      let bleState = behaviour.state;
      if (bleState === 0) {
        bleState = 2;
      }
      else {
        bleState = 3;
      }
      setTimeout(() => {setBehaviour(stone.config.uuid, bleState, type, stoneId);}, behaviour.delay*1000);
    }
  });
}

function setBehaviour(uuid, state, type, stoneId) {
  console.log("Setting behaviour for ",uuid,'to', state,' on event',type, ' @ time:', new Date().valueOf());
  NativeBridge.connectAndSetSwitchState(uuid, state)
    .then(()=>{
      AdvertisementManager.resetData({crownstoneId: stoneId});
    })
    .catch(()=>{});
}

class AdvertisementManagerClass {
  constructor() {
    this.stones = {};
    this.windowSize = 40;
    this.storeReference = undefined;
  }

  loadStore(store) {
    this.storeReference = store;
  }

  resetData(serviceData) {
    if (serviceData.crownstoneId) {
      let id = serviceData.crownstoneId;

      let state = this.storeReference.getState();
      let groupId = state.app.activeGroup;
      this.storeReference.dispatch({
        type: 'UPDATE_STONE_STATE',
        groupId: groupId,
        stoneId: id,
        data: {currentUsage:0}
      });


      let newData = [];
      for (let i = 0; i < this.windowSize; i++) {
        newData.push(undefined);
      }
      this.stones[id] = {index: 0, data: newData, updateTime: 0};
    }
  }

  getPower(serviceData) {
    if (serviceData.crownstoneId && serviceData.powerUsage) {
      let id = serviceData.crownstoneId;
      // no negative usage
      let usage = Math.max(0,serviceData.powerUsage);
      if (usage < 10) {
        usage = 0;
      }

      if (this.stones[id] === undefined) {
        let newData = [];
        for (let i = 0; i < this.windowSize; i++) {
          newData.push(undefined);
        }
        this.stones[id] = {index: 0, data: newData, updateTime: 0};
      }
      let stone = this.stones[id];

      stone.data[stone.index] = usage;
      stone.index = (stone.index+1) % this.windowSize;
      let mean = this.getMean(stone.data);
      let meanDirty = mean;
      let std = this.getStd(stone.data, mean);

      let dataWithoutOutliers = this.filterData(stone.data, mean, std);
      let meanClean = undefined;
      if (dataWithoutOutliers.length > 0) {
        mean = this.getMean(dataWithoutOutliers);
        meanClean = mean;
      }
      else {
        // console.log("no data without outliers, not using filtered data", mean, std)
      }

      return {mean: Math.round(mean), debug: {data:JSON.stringify(stone.data), cleanData:JSON.stringify(dataWithoutOutliers), meanDirty: meanDirty, meanClean: meanClean, std: std, dirtyCount: stone.data.length, cleanCount:dataWithoutOutliers.length}};
    }
    return 0;
  }

  filterData(data, mean, std) {
    let filteredData = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== undefined) {
        if (Math.abs(data[i] - mean) < 1 * std) {
          filteredData.push(data[i])
        }
      }
    }
    return filteredData;
  }

  getMean(data) {
    let total = 0;
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== undefined) {
        total += data[i];
        count += 1;
      }
    }
    return total / count;
  }

  getStd(data, mean) {
    let total = 0;
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== undefined) {
        total += Math.pow(data[i] - mean, 2);
        count += 1;
      }
    }
    return Math.sqrt(total/count);
  }
}

export const AdvertisementManager = new AdvertisementManagerClass();


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

    // hack to handle the presence based input.
    if (serviceData.switchState == 2)
      serviceData.switchState = 0;
    if (serviceData.switchState == 3)
      serviceData.switchState = 1;

    // break if a different thing is scanned
    if (stone === undefined) {
      return;
    }

    // self repairing mechanism for crownstones with updated or lost uuid.
    if (stone.config.uuid !== packet.id) {
      console.log("RESTORING ID FOR ", stoneId , " TO ", packet.id);
      store.dispatch({
        type: "UPDATE_STONE_CONFIG",
        groupId: activeGroup,
        stoneId: stoneId,
        data: {uuid: packet.id}
      })
    }

    let locationName = state.groups[activeGroup].locations[stone.config.locationId].config.name;
    let currentUsage = stone.state.currentUsage;
    //if (serviceData.switchState == 0) {
    //  AdvertisementManager.resetData(serviceData);
    //}

    let powerUsageFull = AdvertisementManager.getPower(serviceData);
    let powerUsage = powerUsageFull.mean;
    let rawPowerUsage = serviceData.powerUsage;
    if (serviceData.switchState == 0) {
      powerUsage = 0;
    }

    // console.log("GOT FROM BLE", locationName, serviceData);

    // abide by the update time.
    // if (Math.round(stone.state.state * 255) !== serviceData.switchState) {
    //   console.log("SETTING SWITCH STATE for state", stone.state.state, serviceData, " in: ", locationName);
    //   store.dispatch({
    //     type: "UPDATE_STONE_STATE",
    //     groupId: activeGroup,
    //     stoneId: stoneId,
    //     data: {state: serviceData.switchState / 255, currentUsage: Math.max(0, serviceData.powerUsage)}
    //   })
    // }
    // else if (Math.abs(powerUsage - powerUsage) > 1) {
    //   console.log("SETTING SWITCH STATE for power", powerUsage - serviceData.powerUsage, powerUsage, " in: ", locationName);
    //   store.dispatch({
    //     type: "UPDATE_STONE_STATE",
    //     groupId: activeGroup,
    //     stoneId: stoneId,
    //     data: {state: serviceData.switchState / 255, currentUsage: powerUsage}
    //   })
    // }

    if (stone.state.state !== serviceData.switchState) {
        // console.log("SETTING SWITCH STATE due to cs:",packet.name," for state", stone.state.state, serviceData, " in: ", locationName);
        store.dispatch({
          type: "UPDATE_STONE_STATE",
          groupId: activeGroup,
          stoneId: stoneId,
          data: {state: serviceData.switchState, currentUsage: powerUsage}
        })
      }
      else if (Math.abs(powerUsage - currentUsage) > 2) {
        console.log("SETTING POWER USAGE due to cs:",packet.name ," for power diff:", powerUsage - currentUsage, " from current: ", currentUsage, "measured:",powerUsage,"raw:",rawPowerUsage,"data:",powerUsageFull, "in: ", locationName);
        store.dispatch({
          type: "UPDATE_STONE_STATE",
          groupId: activeGroup,
          stoneId: stoneId,
          data: {state: serviceData.switchState, currentUsage: powerUsage}
        })
      }
  }
};








































