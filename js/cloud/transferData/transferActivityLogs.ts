import { CLOUD }        from "../cloudAPI";
import {LOGe} from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";

let fieldMap : fieldMap = [
  {local: 'switchedToState', cloud: 'switchedToState' },
  {local: 'timestamp',       cloud: 'timestamp'       },
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

  batchCreateOnCloud: function( state, actions, dataArray: transferNewToCloudStoneData[]) {
    let batch = [];

    let localSphereId = null;
    let localStoneId  = null;
    let localLogId    = [];

    if (dataArray.length > 0) {
      localStoneId = dataArray[0].localStoneId;
      localSphereId = dataArray[0].localSphereId;
    }
    else {
      return new Promise((resolve, reject) => { resolve() })
    }

    for (let i = 0; i < dataArray.length; i++) {
      let data = dataArray[i];
      let payload = {};
      transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);
      localLogId.push(data.localId);
      batch.push(payload);
    }

    return CLOUD.forStone(localStoneId).batchCreateActivityLogs(batch, new Date().valueOf())
      .then((data) => {
        if (data.length > 0) {
          let sphere = state.spheres[localSphereId];
          let stone = sphere.stones[localStoneId];

          // here we do something that's a little ugly... We disrespect the redux format in order to save performance.
          // we directly edit the state instead of going through action dispatching. Since activity logs add quickly,
          // this can lead up to 10.000 actions. This would slow down the UI thread for too long.
          for (let i = 0; i < data.length; i++) {
            stone.activityLogs[localLogId[i]].cloudId = data[i].id;
          }

          // We fire one action. This action will at least trigger a persist call which will persist all changes in our
          // state.
          actions.push({
            type: 'UPDATE_ACTIVITY_LOG_CLOUD_ID',
            sphereId: localSphereId,
            stoneId: localStoneId,
            logId: localLogId[0],
            data: {cloudId: data[0].id}
          });
        }
      })
  },


  createLocal: function( actions, data: transferToLocalStoneData) {
    transferUtil._handleLocal(
      actions,
      'ADD_ACTIVITY_LOG',
      { sphereId: data.localSphereId, stoneId: data.localStoneId, logId: data.localId },
      data,
      fieldMap
    );
  },

};