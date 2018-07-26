/**
 * Created by alex on 25/08/16.
 */

export const activityLogs = {

  createActivityLog: function (data, background = true) {
    return this._setupRequest(
      'POST',
      '/Stones/{id}/activityLog',
      {data: data, background: background},
      'body'
    );
  },

  batchCreateActivityLogs: function (data, background = true) {
    console.log("implement batchCreateActivityLogs to upload", data, "for stone", this.stoneId)
    return new Promise((resolve, reject) => { resolve()})
    // return this._setupRequest(
    //   'POST',
    //   '/Stones/{id}/activityLogBatch',
    //   {data: data, background: background},
    //   'body'
    // );
  },
};