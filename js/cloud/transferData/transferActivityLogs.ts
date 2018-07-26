import { CLOUD }        from "../cloudAPI";
import {LOG, LOGe} from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";

let fieldMap : fieldMap = [
  {local: 'switchedToState', cloud: 'switchedToState' },
  {local: 'type',            cloud: 'type'            },
  {local: 'intent',          cloud: 'intent'          },
  {local: 'delayInCommand',  cloud: 'delayInCommand'  },
  {local: 'viaMesh',         cloud: 'viaMesh'         },
  {local: 'userId',          cloud: 'userId'          },
  {local: 'commandUuid',     cloud:  'commandUuid'    },
  {local: 'cloudId',         cloud:  'id' ,  cloudToLocalOnly: true },
];


export const transferActivityLogs = {
  fieldMap: fieldMap,

  createOnCloud: function( actions, data : transferNewToCloudStoneData ) {
    let payload = {};
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);

    return CLOUD.forStone(data.cloudStoneId).createActivityLog(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({
          type:     'UPDATE_ACTIVITY_LOG_CLOUD_ID',
          sphereId: data.localSphereId,
          stoneId:  data.localStoneId,
          logId:    data.localId,
          data:     { cloudId: result.id }
        });
        return result.id;
      })
      .catch((err) => {
        LOGe.cloud("Transfer-ActivityLogs: Could not create ActivityLog in cloud", err);
        throw err;
      });
  },

  batchCreateOnCloud: function( actoins, dataArray: [transferNewToCloudStoneData]) {
    let stones = {};
    dataArray.forEach((data) => {
      let payload = {};
      transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);

      if (stones[data.cloudStoneId] === undefined) {
        stones[data.cloudStoneId] = [];
      }

      stones[data.cloudStoneId].push(payload);
    });

    let stoneIds = Object.keys(stones);
    let promises = [];

    stoneIds.forEach((stoneId) => {
      promises.push(CLOUD.forStone(stoneId).batchCreateActivityLogs(stones[stoneId]));
    })

    return Promise.all(promises);
  },


  createLocal: function( actions, data: transferToLocalStoneData) {
    return transferUtil._handleLocal(
      actions,
      'ADD_ACTIVITY_LOG',
      { sphereId: data.localSphereId, stoneId: data.localStoneId, logId: data.localId },
      data,
      fieldMap
    );
  },

};