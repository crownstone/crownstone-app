import {toonConfig} from "../../../sensitiveData/toonConfig";
import {request} from "../../cloudCore";
import {cloudApiBase} from "../cloudApiBase";

/**
 * Created by alex on 25/08/16.
 */

export const toon = {

  getAccessToken: function(code) {
    let payload = {
      client_id: toonConfig.clientId,
      client_secret: toonConfig.clientSecret,
      code: code,
      grant_type:'authorization_code'
    };

    let options = {endPoint: "https://api.toon.eu/token", data: payload, type: 'body-urlencoded', options: {}};
    let headers : HeaderObject = {'Content-Type': 'application/x-www-form-urlencoded'};
    return request(options, 'POST',   headers, null, null);
  },


  getToonIds: function(accessToken) {
    let options = {endPoint: "https://api.toon.eu/toon/v3/agreements", type: 'body-urlencoded', options: {}};
    let headers : HeaderObject = {
      'Content-Type': 'application/json',
      'Cache-control': 'no-cache',
      'Authorization': 'Bearer ' + accessToken,
    };
    return request(options, 'GET',   headers, null, null);
  },


  updateToonInCrownstoneCloud: function(cloudId, data, background = true) {
    return cloudApiBase._setupRequest(
      'PUT',
      '/Spheres/{id}/Toons/' + cloudId,
      {data: data, background: background},
      'body'
    )
  },

  createToonInCrownstoneCloud: function(data, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Spheres/{id}/Toons',
      {data: data, background: background},
      'body'
    )
  },

  setToonToHome: function(deviceId, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Toons/{id}/setProgram',
      { data: {program: 'home', ignoreDeviceId: deviceId }, background: background},
      'query'
    )
  },

  setToonToAway: function(deviceId, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Toons/{id}/setProgram',
      { data: {program: 'away', ignoreDeviceId: deviceId }, background: background},
      'query'
    )
  },

  updateToonSchedule: function(background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Toons/{id}/updateSchedule',
      { background: background },
      'query'
    )
  },

  deleteToonsInCrownstoneCloud: function(background = true) {
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Spheres/{id}/Toons',
      {background: background},
      'body'
    )
  }
};