import { CLOUD }        from "../cloudAPI";
import { LOG }          from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";



type transferScheduleToLocalData = {
  localId: string,
  localSphereId: string,
  localStoneId: string,
  cloudData: any,
}


type transferScheduleToCloudData = {
  localId: string,
  localData: any,
  cloudSphereId: string,
  cloudStoneId: string,
  cloudId: string,
}

type transferNewScheduleToCloudData = {
  localId: string,
  localData: any,
  localSphereId: string,
  localStoneId: string,
  cloudStoneId: string,
}

let fieldMap : fieldMap = [
  {local:'label',                  cloud: 'label'},
  {local:'time',                   cloud: 'triggerTimeOnCrownstone'},
  {local:'scheduleEntryIndex',     cloud: 'scheduleEntryIndex'},
  {local:'switchState',            cloud: 'switchState'},
  {local:'linkedSchedule',         cloud: 'linkedSchedule'},
  {local:'fadeDuration',           cloud: 'fadeDuration'},
  {local:'intervalInMinutes',      cloud: 'intervalInMinutes'},
  {local:'ignoreLocationTriggers', cloud: 'ignoreLocationTriggers'},
  {local:'repeatMode',             cloud: 'repeatMode'},
  {local:'active',                 cloud: 'active'},
  {
    local:'activeDays',
    localFields: ['Mon','Tue','Wed','Thu','Fri','Sat', 'Sun'],

    cloud: 'activeDays',
    cloudFields: ['Mon','Tue','Wed','Thu','Fri','Sat', 'Sun'],
  },
  {local:'updatedAt',              cloud: 'updatedAt'},
  {local:'cloudId',                cloud: 'id',  cloudToLocalOnly: true },
];


export const transferSchedules = {
  fieldMap: fieldMap,

  createOnCloud: function( actions, data : transferNewScheduleToCloudData ) {
    let payload = {};
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);

    return CLOUD.forStone(data.cloudStoneId).createSchedule(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({
          type: 'UPDATE_SCHEDULE_CLOUD_ID',
          sphereId: data.localSphereId,
          stoneId: data.localStoneId,
          scheduleId: data.localId,
          data: { cloudId: result.id }
        });
      })
      .catch((err) => {
        LOG.error("Transfer-Schedule: Could not create schedule in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( data : transferScheduleToCloudData ) {
    if (data.cloudId === undefined) {
      return new Promise((resolve,reject) => { reject({status: 404, message:"Can not update in cloud, no cloudId available"}); });
    }

    let payload = {};
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);

    return CLOUD.forStone(data.cloudStoneId).updateSchedule(data.cloudId, payload)
      .then(() => {})
      .catch((err) => {
        LOG.error("Transfer-Schedule: Could not update schedule in cloud", err);
        throw err;
      });
  },


  createLocal: function( actions, data: transferScheduleToLocalData) {
    return transferUtil._handleLocal(
      actions,
      'ADD_STONE_SCHEDULE',
      { sphereId: data.localSphereId, stoneId: data.localStoneId, scheduleId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferScheduleToLocalData) {
    return transferUtil._handleLocal(
      actions,
      'UPDATE_STONE_SCHEDULE',
      { sphereId: data.localSphereId, stoneId: data.localStoneId, scheduleId: data.localId },
      data,
      fieldMap
    );
  },

};