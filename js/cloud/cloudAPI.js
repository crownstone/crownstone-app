'use strict'
import React, { Component } from 'react'
import { Alert } from 'react-native';
import { request, download } from './cloudCore'
import { DEBUG, SILENCE_CLOUD } from '../ExternalConfig'
import { preparePictureURI } from '../util/util'


let defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

let uploadHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'multipart/form-data; boundary=6ff46e0b6b5148d984f148b6542e5a5d',
};

/**
 * The cloud API is designed to maintain the REST endpoints and to handle responsed and errors on the network level.
 * When the reponses come back successfully, the convenience wrappers allow callbacks for relevant scenarios.
 *
 * @type {{_accessToken: undefined, _userId: undefined, _deviceId: undefined, _eventId: undefined, _groupId: undefined, _locationId: undefined, _stoneId: undefined, _post: CLOUD._post, _get: CLOUD._get, _delete: CLOUD._delete, _put: CLOUD._put, _head: CLOUD._head, _uploadImage: CLOUD._uploadImage, _download: CLOUD._download, setAccess: CLOUD.setAccess, setUserId: CLOUD.setUserId, forUser: CLOUD.forUser, forStone: CLOUD.forStone, forGroup: CLOUD.forGroup, forLocation: CLOUD.forLocation, forEvent: CLOUD.forEvent, forDevice: CLOUD.forDevice, registerUser: CLOUD.registerUser, login: CLOUD.login, uploadProfileImage: CLOUD.uploadProfileImage, downloadProfileImage: CLOUD.downloadProfileImage, getUserData: CLOUD.getUserData, getGroups: CLOUD.getGroups, requestVerificationEmail: CLOUD.requestVerificationEmail, requestPasswordResetEmail: CLOUD.requestPasswordResetEmail, createGroup: CLOUD.createGroup}}
 */
export let CLOUD = {
  _accessToken: undefined,
  _userId: undefined,
  _deviceId: undefined,
  _eventId: undefined,
  _groupId: undefined,
  _locationId: undefined,
  _stoneId: undefined,
  _networkErrorHandler: () => {},

  _post: function(options) {
    return request(options, 'POST',   defaultHeaders, _getId(options.endPoint, this), this._accessToken)
  },
  _get: function(options) {
    return request(options, 'GET',    defaultHeaders, _getId(options.endPoint, this), this._accessToken)
  },
  _delete: function(options) {
    return request(options, 'DELETE', defaultHeaders, _getId(options.endPoint, this), this._accessToken)
  },
  _put: function(options) {
    return request(options, 'PUT',    defaultHeaders, _getId(options.endPoint, this), this._accessToken)
  },
  _head: function(options) {
    return request(options, 'HEAD',   defaultHeaders, _getId(options.endPoint, this), this._accessToken)
  },
  _uploadImage: function(options) {
    var formData = new FormData();
    let path = preparePictureURI(options.path);
    let filename = options.path.split('/');
    filename = filename[filename.length-1];
    formData.append('image', {type: 'image/jpeg', name: filename, uri: path });
    options.data = formData;
    return request(options, 'POST', uploadHeaders, _getId(options.endPoint, this), this._accessToken, true)
  },
  _download: function(options, toPath, beginCallback, progressCallback) {
    return download(options, _getId(options.endPoint, this), this._accessToken, toPath, beginCallback, progressCallback)
  },
  _handleNetworkError: function (error, options) {
    // this will eliminate all cloud requests.
    if (SILENCE_CLOUD === true)
      return;
    
    if (options.background !== true) {
      this._networkErrorHandler(error);
    }
    if (DEBUG === true) {
      console.error(options.background ? 'BACKGROUND REQUEST:' : '','Network Error:', error);
    }
  },

  _setupRequest: function(reqType, endpoint, options = {}, type = 'query') {
    return new Promise((resolve, reject) => {
      let promiseBody = {endPoint: endpoint, data: options.data, type:type};
      let promise;
      switch (reqType) {
        case 'POST':
          promise = this._post(promiseBody);
          break;
        case 'GET':
          promise = this._get(promiseBody);
          break;
        case 'PUT':
          promise = this._put(promiseBody);
          break;
        case 'DELETE':
          promise = this._delete(promiseBody);
          break;
        case 'HEAD':
          promise = this._head(promiseBody);
          break;
        default:
          console.error("UNKNOWN TYPE:", reqType);
          return;
      }
      promise.then((reply) => {
          if (reply.status === 200 || reply.status === 204)
            resolve(reply.data);
          else
            debugReject(reply, reject, arguments);
        })
        .catch((error) => {
          console.error(error, this);
          this._handleNetworkError(error, options);
        })
    });
  },


  // END USER API
  // These methods have all the endpoints embedded in them.
  
  setNetworkErrorHandler: function(handler) {this._networkErrorHandler = handler},
  setAccess:   function(accessToken) { this._accessToken = accessToken; return this; },
  setUserId:   function(userId)      { this._userId = userId;           return this; },
  forUser:     function(userId)      { this._userId = userId;           return this; },
  forStone:    function(stoneId)     { this._stoneId = stoneId;         return this; },
  forGroup:    function(groupId)     { this._groupId = groupId;         return this; },
  forLocation: function(locationId)  { this._locationId = locationId;   return this; },
  forEvent:    function(eventId)     { this._eventId = eventId;         return this; },
  forDevice:   function(deviceId)    { this._deviceId = deviceId;       return this; },

  /**
   * 
   * @param options
   * @returns {Promise}
   */
  registerUser: function(options) {
    return this._setupRequest('POST', 'users', {data:{
      email: options.email,
      password: options.password,
      firstName: options.firstName,
      lastName: options.lastName
    }}, 'body');
  },
  
  /**
   *
   * @param options
   * {
   *   email: string,
   *   password: string,
   *   onUnverified: callback,
   *   onInvalidCredentials: callback,
   *   background: boolean
   * }
   *
   * resolves with the parsed data, rejects with {status: httpStatus, data: data}
   */
  login: function(options) {
    return new Promise((resolve, reject) => {
      this._post({ endPoint:'users/login', data:{ email: options.email, password: options.password } , type:'body'})
        .then((reply) => {
          if (reply.status === 200) {
            resolve(reply.data)
          }
          else {
            if (reply.data && reply.data.error && reply.data.error.code) {
              switch (reply.data.error.code) {
                case 'LOGIN_FAILED_EMAIL_NOT_VERIFIED':
                  if (options.onUnverified)
                    options.onUnverified();
                  break;
                case 'LOGIN_FAILED':
                  if (options.onInvalidCredentials)
                    options.onInvalidCredentials();
                  break;
                default:
                  debugReject(reply, reject, options);
              }
            }
            else {
              debugReject(reply, reject, options);
            }
          }
        }).catch((error) => {this._handleNetworkError(error, options);});
    })
  },

  /**
   *
   * @param file {String} --> full path string.
   */
  uploadProfileImage: function(file) {
    return this._uploadImage({endPoint:'/users/{id}/profilePic', path:file, type:'body'})
  },

  /**
   *
   * @param toPath
   */
  downloadProfileImage: function (toPath) {
    return this._download({endPoint:'/users/{id}/profilePic'}, toPath);
  },


  removeProfileImage: function() {

  },

  /**
   *
   * @returns {*}
   */
  getUserData: function (options = {}) {
    return this._setupRequest('GET', '/users/me', options);
  },

  /**
   *
   * @param options
   * @returns {Promise}
   */
  updateUserData: function(options = {}) {
    return this._setupRequest('PUT', '/users/{id}', options, 'body');
  },

  /**
   *
   * @returns {*}
   */
  getGroups: function (options = {}) {
    return this._setupRequest('GET', '/users/{id}/groups', options);
  },

  getLocations: function(options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/ownedLocations', options);
  },

  /**
   *
   * @param options
   */
  requestVerificationEmail: function(options = {}) {
    return this._setupRequest(
      'GET',
      'users/resendVerification',
      { data: { email: options.email }, background: options.background },
      'query'
    );
  },

  /**
   *
   * @param options
   */
  requestPasswordResetEmail: function(options = {}) {
    return this._setupRequest(
      'POST',
      'users/reset',
      { data: { email: options.email }, background: options.background },
      'body'
    );
  },


  getKeys: function() {
    return this._setupRequest(
      'GET',
      'users/{id}/keys'
    );
  },

  /**
   *
   * @param groupName
   */
  createGroup: function(groupName) {
    return this._post({endPoint:'users/{id}/groups', data:{name:groupName}, type:'body'});
  },

  createLocation: function(locationName) {
    return this._post({endPoint:'Groups/{id}/ownedLocations', data:{name:locationName}, type:'body'});
  },

  createStone: function(groupId, MacAddress) {
    return this._post({endPoint:'/Stones', data:{groupId:locationName, address:MacAddress}, type:'body'});
  },

  deleteStone: function() {
    return this._delete({endPoint:'/Stones/{id}', data:{}, type:'body'});
  },

  sync: function() {

  }
};


function _getId(url, obj) {
  let usersLocation = url.indexOf('users');
  if (usersLocation !== -1 && usersLocation < 3)
    return obj._userId;

  let devicesLocation = url.indexOf('Devices');
  if (devicesLocation !== -1 && devicesLocation < 3)
    return obj._deviceId;

  let eventsLocation = url.indexOf('Events');
  if (eventsLocation !== -1 && eventsLocation < 3)
    return obj._eventId;

  let groupsLocation = url.indexOf('Groups');
  if (groupsLocation !== -1 && groupsLocation < 3)
    return obj._groupId;

  let locationsLocation = url.indexOf('Locations');
  if (locationsLocation !== -1 && locationsLocation < 3)
    return obj._locationId;

  let stoneLocation = url.indexOf('Stones');
  if (stoneLocation !== -1 && stoneLocation < 3)
    return obj._stoneId;
}

function debugReject(reply, reject, debugOptions) {
  if (DEBUG) {
    console.error("UNHANDLED HTML ERROR IN API:", reply, debugOptions);
  }
  reject(reply);
}