/**
 * Created by alex on 25/08/16.
 */

export const activityRanges = {

  getActivityRanges: function (data, background = true) {
    return this._setupRequest(
      'GET',
      '/Stones/{id}/activityRanges',
      {data: data, background: background},
      'query'
    );
  },

  batchCreateActivityRanges: function (data, timestamp, background = true) {
    return this._setupRequest(
      'POST',
      '/Stones/{id}/activityRangeBatch?timestamp=' + timestamp,
      {data: data, background: background},
      'body'
    );
  },

  batchUpdateActivityRanges: function (data, timestamp, background = true) {
    return this._setupRequest(
      'PUT',
      '/Stones/{id}/activityRangeBatch?timestamp=' + timestamp,
      {data: data, background: background},
      'body'
    );
  },
};