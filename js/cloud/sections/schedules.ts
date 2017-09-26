export const schedules = {

  createSchedule: function(data, background = true) {
    return this._setupRequest(
      'POST',
      '/Stones/{id}/schedules/',
      { data: data, background: background },
      'body'
    );
  },

  getSchedule: function(scheduleId, background = true) {
    return this._setupRequest(
      'GET',
      '/Stones/{id}/schedules/'+scheduleId,
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


  updateSchedule: function(scheduleId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Stones/{id}/schedules/'+scheduleId,
      { data: data, background: background },
      'body'
    );
  },

  deleteSchedule: function(scheduleId, background = true) {
    return this._setupRequest(
      'DELETE',
      '/Stones/{id}/schedules/'+scheduleId,
      { background: background }
    );
  },


};