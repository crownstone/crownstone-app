import { CLOUD }        from "../cloudAPI";
import { transferUtil } from "./shared/transferUtil";

let fieldMap : fieldMap = [
  {local: 'switchedToState', cloud: 'switchedToState' },
  {local: 'type',            cloud: 'type'            },
  {local: 'startTime',       cloud: 'startTime'       },
  {local: 'lastDirectTime',  cloud: 'lastDirectTime'  },
  {local: 'lastMeshTime',    cloud: 'lastMeshTime'    },
  {local: 'delayInCommand',  cloud: 'delayInCommand'  },
  {local: 'count',           cloud: 'count'           },
  {local: 'userId',          cloud: 'userId'          },
  {local: 'cloudId',         cloud: 'id' ,  cloudToLocalOnly: true },
];


export const transferActivityRanges = {
  fieldMap: fieldMap,

  batchCreateOnCloud: function( state, actions, dataArray: transferNewToCloudStoneData[]) {
    let batch = [];

    let localSphereId = null;
    let localStoneId  = null;
    let localRangeIds = [];

    if (dataArray.length > 0) {
      localStoneId  = dataArray[0].localStoneId;
      localSphereId = dataArray[0].localSphereId;
    }
    else {
      return new Promise((resolve, reject) => { resolve() })
    }

    for (let i = 0; i < dataArray.length; i++) {
      let data = dataArray[i];
      let payload = {};
      transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);
      localRangeIds.push(data.localId);
      batch.push(payload);
    }

    return CLOUD.forStone(localStoneId).batchCreateActivityRanges(batch, new Date().valueOf())
      .then((data) => {
        if (data.length > 0) {
          let sphere = state.spheres[localSphereId];
          let stone = sphere.stones[localStoneId];

          // here we do something that's a little ugly... We disrespect the redux format in order to save performance.
          // we directly edit the state instead of going through action dispatching. Since activity logs add quickly,
          // this can lead up to 10.000 actions. This would slow down the UI thread for too long.
          for (let i = 0; i < data.length; i++) {
            stone.activityRanges[localRangeIds[i]].cloudId = data[i].id;
          }

          // We fire one action. This action will at least trigger a persist call which will persist all changes in our
          // state.
          actions.push({
            type: 'UPDATE_ACTIVITY_RANGE_CLOUD_ID',
            sphereId: localSphereId,
            stoneId: localStoneId,
            rangeId: localRangeIds[0],
            data: {cloudId: data[0].id}
          });
        }
      })
  },

  batchUpdateOnCloud: function( state, actions, dataArray: transferNewToCloudStoneData[]) {
    let batch = [];

    let localStoneId = null;

    if (dataArray.length > 0) {
      localStoneId = dataArray[0].localStoneId;
    }
    else {
      return new Promise((resolve, reject) => { resolve() })
    }

    for (let i = 0; i < dataArray.length; i++) {
      let data = dataArray[i];
      let payload = {};
      transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);
      payload['id'] = data.localData.cloudId;
      batch.push(payload);
    }

    return CLOUD.forStone(localStoneId).batchUpdateActivityRanges(batch, new Date().valueOf())
  },


  createLocal: function( actions, data: transferToLocalStoneData) {
    transferUtil._handleLocal(
      actions,
      'ADD_ACTIVITY_RANGE',
      { sphereId: data.localSphereId, stoneId: data.localStoneId, rangeId: data.localId },
      data,
      fieldMap
    );
  },

  updateLocal: function( actions, data: transferToLocalStoneData) {
    transferUtil._handleLocal(
      actions,
      'UPDATE_ACTIVITY_RANGE',
      { sphereId: data.localSphereId, stoneId: data.localStoneId, rangeId: data.localId },
      data,
      fieldMap
    );
  },

};