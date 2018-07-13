import {toonConfig} from "../../../sensitiveData/toonConfig";
import {request} from "../../cloudCore";

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
    let options = {endPoint: "https://api.toon.eu/token", data: payload, type: 'body', options: {}};
    let headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    return request(options, 'POST',   headers, null, null);
  },


  getNewAccessTokenWithRefreshToken: function(refreshToken) {
    let payload = {
      client_id: toonConfig.clientId,
      client_secret: toonConfig.clientSecret,
      refresh_token: refreshToken,
      grant_type:'refresh_token'
    }
    let options = {endPoint: "https://api.toon.eu/token", data: payload, type: 'body', options: {}};
    let headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    return request(options, 'POST',   headers, null, null);
  },


  getToonIds: function(accessToken) {
    let options = {endPoint: "https://api.toon.eu/toon/v3/agreements", type: 'body', options: {}};
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + accessToken,
    };
    return request(options, 'GET',   headers, null, null);
  },

};

/**
 "programState": 1  // following the schedule
 "programState": 2  // temporarily different program   --> activeState is the active program
 "programState": -1 // temporarily custom temperature  --> currentSetpoint is the set temperature
 "programState": 4  // holiday mode

 "state": [
 {
   "id": 0, // comfort
   "tempValue": 2000,
   "dhw": 1
 },
 {
   "id": 1, // thuis
   "tempValue": 1800,
   "dhw": 1
 },
 {
   "id": 2, // slaap
   "tempValue": 1500,
   "dhw": 1
 },
 {
   "id": 3, // weg
   "tempValue": 1200,
   "dhw": 1
 },
 {
   "id": 4, // holiday
   "tempValue": 1200,
   "dhw": 1
 },
 {
   "id": 5, // holiday default
   "tempValue": 600,
   "dhw": 1
 }

 */