/**
 * Created by alex on 25/08/16.
 */
import { cloudApiBase } from "./cloudApiBase";

export const activityLogs = {

  getActivityLogs: function (data, background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Stones/{id}/activityLogs',
      {data: data, background: background},
      'query'
    );
  },

  batchCreateActivityLogs: function (data, timestamp, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Stones/{id}/activityLogBatch?timestamp=' + timestamp,
      {data: data, background: background},
      'body'
    );
  },
};