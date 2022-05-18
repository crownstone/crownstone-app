import { core } from "../Core";
import { DfuStateHandler } from "../native/firmware/DfuStateHandler";
import { Permissions } from "../backgroundProcesses/PermissionManager";
import { SetupStateHandler } from "../native/setup/SetupStateHandler";
import { DataUtil } from "./DataUtil";


export const RoomUtil = {
  getItemsInLocation: function(sphereId: string, locationId: string) : {itemArray:any[], ids: string[]} {
    let state = core.store.getState();
    let stones = DataUtil.getStonesInLocation(sphereId, locationId);
    let hubs   = DataUtil.getHubsInLocation(  sphereId, locationId);

    let stoneArray = [];
    let ids = [];
    let stoneIds = Object.keys(stones);
    let shownHandles = {};
    let tempStoneDataArray = [];

    if (DfuStateHandler.areDfuStonesAvailable() === true && Permissions.inSphere(sphereId).canUpdateCrownstone) {
      let dfuStones = DfuStateHandler.getDfuStones();

      let dfuIds = Object.keys(dfuStones);
      dfuIds.forEach((dfuId) => {
        if (dfuStones[dfuId].data && dfuStones[dfuId].data.locationId === locationId) {
          shownHandles[dfuStones[dfuId].advertisement.handle] = true;
          ids.push(dfuId);
          dfuStones[dfuId].type = 'dfuStone';
          stoneArray.push(dfuStones[dfuId]);
        }
      });
    }
    else if (SetupStateHandler.areSetupStonesAvailable() && Permissions.inSphere(sphereId).canSetupCrownstone) {
      let setupStones = SetupStateHandler.getSetupStones();
      let setupIds = Object.keys(setupStones);
      // check if there are any setup stones that match the stones already in the database.
      stoneIds.forEach((stoneId) => {
        let stoneObj = stones[stoneId];
        let handle = stoneObj.config.handle;
        // only try showing the setup stone if it is not already a DFU stone
        if (shownHandles[handle] === undefined) {
          setupIds.forEach((setupId) => {
            if (setupStones[setupId].handle === handle) {
              shownHandles[handle] = true;
              ids.push(stoneId);
              // we do not want to overwrite the type, but the type we're using in this view is also required. We rename the incoming type to deviceType.
              let setupData = {...setupStones[setupId]};
              setupData.deviceType = setupData.type;
              stoneArray.push({
                ...setupData,
                type:'setupStone',
                name: stoneObj.config.name,
                icon: stoneObj.config.icon
              });
            }
          });
        }
      })
    }

    let shownStones = {};
    for (let [stoneId, stone] of Object.entries<StoneData>(stones)) {
      // do not show the same device twice
      let handle = stone.config.handle;
      if (shownHandles[handle] === undefined) {
        shownStones[stoneId] = true;
        tempStoneDataArray.push({type:'stone', data: stone, id: stoneId});
      }
      else {
        shownStones[stoneId] = true;
      }
    }

    // sort the order of things by crownstone Id
    tempStoneDataArray.sort((a,b) => { return a.data.config.uid - b.data.config.uid });


    for (let [hubId, hub] of Object.entries<HubData>(hubs)) {
      if (shownStones[hub.config.linkedStoneId] === undefined) {
        // do not show the same device twice
        tempStoneDataArray.push({ type: 'hub', data: hub, id: hubId });
      }
    }

    tempStoneDataArray.forEach((tmpStoneData) => {
      ids.push(tmpStoneData.id);
      stoneArray.push(tmpStoneData);
    });


    return { itemArray: stoneArray, ids };
  },
}