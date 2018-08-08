import {toonConfig} from "../../../sensitiveData/toonConfig";
import {request} from "../../cloudCore";
import {refreshDefaults} from "../../../router/store/reducers/reducerUtil";
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
    }

    let options = {endPoint: "https://api.toon.eu/token", data: payload, type: 'body-urlencoded', options: {}};
    let headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    return request(options, 'POST',   headers, null, null);
  },


  getToonIds: function(accessToken) {
    let options = {endPoint: "https://api.toon.eu/toon/v3/agreements", type: 'body-urlencoded', options: {}};
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + accessToken,
    };
    return request(options, 'GET',   headers, null, null);
  },


  updateToonInCrownstoneCloud: function(cloudId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Spheres/{id}/Toons/' + cloudId,
      {data: data, background: background},
      'body'
    )
  },

  createToonInCrownstoneCloud: function(data, background = true) {
    return this._setupRequest(
      'POST',
      '/Spheres/{id}/Toons',
      {data: data, background: background},
      'body'
    )
  },

  setToonToHome: function(deviceId, background = true) {
    return this._setupRequest(
      'POST',
      '/Toons/{id}/',
      { data: {program: 'home', ignoreDeviceId: deviceId }, background: background},
      'query'
    )
  },

  setToonToAway: function(deviceId, background = true) {
    return this._setupRequest(
      'POST',
      '/Toons/{id}/',
      { data: {program: 'away', ignoreDeviceId: deviceId }, background: background},
      'query'
    )
  },

  deleteToonsInCrownstoneCloud: function(background = true) {
    return this._setupRequest(
      'DELETE',
      '/Spheres/{id}/Toons',
      {background: background},
      'body'
    )
  }
};