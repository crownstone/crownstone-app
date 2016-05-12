'use strict'
import React, { Alert } from 'react-native';
import { request, download } from './cloudCore'
import { closeLoading } from './cloudUtil'



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
    let path = options.path.substr(0,4) === 'file' ? options.path : 'file://' + options.path;
    formData.append('image', {type: "image/jpeg", name: options.name, uri: path });
    options.data = formData;
    return request(options, 'POST', uploadHeaders, _getId(options.endPoint, this), this._accessToken, true)
  },
  _download: function(options, toPath, beginCallback, progressCallback) {
    return download(options, _getId(options.endPoint, this), this._accessToken, toPath, beginCallback, progressCallback)
  },
  

  // END USER API
  // These methods have all the endpoints embedded in them.

  setAccess:   function(accessToken) { this._accessToken = accessToken; return this; },
  setUserId:   function(userId)      { this._userId = userId;           return this; },
  forUser:     function(userId)      { this._userId = userId;           return this; },
  forStone:    function(stoneId)     { this._stoneId = stoneId;         return this; },
  forGroup:    function(groupId)     { this._groupId = groupId;         return this; },
  forLocation: function(locationId)  { this._locationId = locationId;   return this; },
  forEvent:    function(eventId)     { this._eventId = eventId;         return this; },
  forDevice:   function(deviceId)    { this._deviceId = deviceId;       return this; },
  
  
  registerUser: function(options) {
    return new Promise((resolve, reject) => {
      CLOUD._post({
        endPoint: 'users',
        data: {
          email: options.email,
          password: options.password,
          firstName: options.firstName,
          lastName: options.lastName
        }, type: 'body'
      }).then((reply) => {
        // POST SUCCESS
        if (reply.status === 200 || reply.status === 204) {
          resolve(reply.data)
        }
        else {
          if (replay.data && reply.data.error && reply.data.error.message) {
            let message = replay.data.error.message.split("` ");
            message = message[message.length - 1];
            Alert.alert("Registration Error", message, [{text: 'OK', onPress: closeLoading}]);
          }
        }
      });
    });
  },
  
  /**
   *
   * @param options     
   *        {email: string, password: string, onUnverified: callback, onInvalidCredentials: callback, stealth: boolean}
   */
  login: function(options) {
    return new Promise((resolve, reject) => {
      this._post({ endPoint:'users/login', data:{ email: options.email, password: options.password } , type:'body'})
        .then((reply) => {
          // POST SUCCESS
          if (reply.status === 200) {
            resolve(reply.data)
          }
          else {
            if (replay.data && reply.data.error && reply.data.error.code) {
              switch (reply.data.error.code) {
                case "LOGIN_FAILED_EMAIL_NOT_VERIFIED":
                  if (options.onUnverified)
                    options.onUnverified();
                  break;
                case "LOGIN_FAILED":
                  if (options.onInvalidCredentials)
                    options.onInvalidCredentials()
                  break;
                default:
                  Alert.alert('Login Error', reply.data.error.message, [{text: 'OK', onPress: closeLoading}]);
              }
            }
          }
        })
        .catch((error) => {
          // ERRORS IN THE REQUEST
          console.log("ERROR IN LOGIN REQUEST", error);
          reject(error);
      })
    })
  },

  /**
   *
   * @param file
   */
  uploadProfileImage: function(file) {
    return this._uploadImage({endPoint:'/users/{id}/profilePic', ...file, type:'body'})
  },

  /**
   *
   * @param toPath
   */
  downloadProfileImage: function (toPath) {
    return this._download({endPoint:'/users/{id}/profilePic'}, toPath);
  },

  /**
   *
   * @returns {*}
   */
  getUserData: function () {
    return new Promise((resolve, reject) => {
      this._get({endPoint:'/users/me'})
        .then((reply) => {resolve(reply)})
        .catch((error) => {
          reject(error);
        });
    });
  },

  /**
   *
   * @returns {*}
   */
  getGroups: function () {
    return new Promise((resolve, reject) => {
      this._get({endPoint:'/users/{id}/groups'})
        .then((reply) => {resolve(reply)})
        .catch((error) => {
          reject(error);
        });
    });
  },

  /**
   *
   * @param email
   * @param successCallback
   * @param closePopupCallback
   */
  requestVerificationEmail: function(email, successCallback) {
    let errorHandleCallback = (response) => {Alert.alert('Cannot Resend Confirmation.',response.error.message,[{text: 'OK', onPress: closePopupCallback}]);};
    return this._post({ endPoint:'users/resendVerification', data, type:'query'}, successCallback, errorHandleCallback, closePopupCallback);
  },

  /**
   *
   * @param email
   * @param successCallback
   * @param closePopupCallback
   */
  requestPasswordResetEmail: function(email, successCallback, closePopupCallback) {
    let errorHandleCallback = (response) => {Alert.alert('Cannot Send Reset Email.',response.error.message,[{text: 'OK', onPress: closePopupCallback}]);};
    return this._post({endPoint:'users/reset', data:{email:email}, type:'body'}, successCallback, errorHandleCallback, closePopupCallback);
  },


  /**
   *
   * @param groupName
   */
  createGroup: function(groupName, successCallback, closePopupCallback) {
    let errorHandleCallback = (response) => {Alert.alert('Cannot Create Group.',response.error.message,[{text: 'OK', onPress: closePopupCallback}]);};
    return this._post({endPoint:'users/{id}/groups', data:{name:groupName}, type:'body'}, successCallback, errorHandleCallback, closePopupCallback);
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
