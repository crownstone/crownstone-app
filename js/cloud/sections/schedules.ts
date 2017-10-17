import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {cloudApiBase} from "./cloudApiBase";

export const schedules = {

  createSchedule: function(data, background = true) {
    return this._setupRequest(
      'POST',
      '/Stones/{id}/schedules/',
      { data: data, background: background },
      'body'
    );
  },

  getSchedule: function(localScheduleId, background = true) {
    let cloudScheduleId = MapProvider.local2cloudMap.schedules[localScheduleId] || localScheduleId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'GET',
      '/Stones/{id}/schedules/'+cloudScheduleId,
      {background: background}
    );
  },


  /**
   * request the data of all crownstones in this sphere
   * @returns {*}
   */
  getSchedules: function(background = true) {
    return this._setupRequest(
      'GET',
      '/Stones/{id}/schedules',
      {background: background}
    );
  },

  /**
   * request the data of all crownstones in this sphere
   * @returns {*}
   */
  getScheduleWithIndex: function(index, background = true) {
    return this._setupRequest(
      'GET',
      '/Stones/{id}/schedules',
      { background: background, data:{filter: {where:{scheduleEntryIndex:index}}}}
    )
  },


  updateSchedule: function(localScheduleId, data, background = true) {
    let cloudScheduleId = MapProvider.local2cloudMap.schedules[localScheduleId] || localScheduleId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'PUT',
      '/Stones/{id}/schedules/'+cloudScheduleId,
      { data: data, background: background },
      'body'
    );
  },

  deleteSchedule: function(localScheduleId, background = true) {
    let cloudScheduleId = MapProvider.local2cloudMap.schedules[localScheduleId] || localScheduleId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'DELETE',
      '/Stones/{id}/schedules/'+cloudScheduleId,
      { background: background }
    );
  },


};