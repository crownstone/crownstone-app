'use strict'
import React, { Alert } from 'react-native';
import { request, download } from './cloudCore'


let defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

let uploadHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'multipart/form-data; boundary=6ff46e0b6b5148d984f148b6542e5a5d',
};

export let CLOUD = {
  _accessToken: undefined,
  _userId: undefined,
  _deviceId: undefined,
  _eventId: undefined,
  _groupId: undefined,
  _locationId: undefined,
  _stoneId: undefined,

  _post: function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'POST', defaultHeaders, _getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this._accessToken)
  },
  _get: function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'GET',  defaultHeaders, _getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this._accessToken)
  },
  _delete: function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'DELETE', defaultHeaders, _getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this._accessToken)
  },
  _put: function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'PUT',  defaultHeaders, _getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this._accessToken)
  },
  _head: function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'HEAD', defaultHeaders, _getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this._accessToken)
  },
  _uploadImage: function(options, successCallback, errorHandleCallback, closePopupCallback) {
    var formData = new FormData();
    let path = options.path.substr(0,4) === 'file' ? options.path : 'file://' + options.path;
    formData.append('image', {type: "image/jpeg", name: options.name, uri: path });
    options.data = formData;
    return request(options, 'POST', uploadHeaders, _getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this._accessToken, true)
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

  /**
   *
   * @param email
   * @param password
   * @param successCallback
   * @param unverifiedEmailCallback
   * @param invalidLoginCallback
   * @param closePopupCallback
   */
  login: function(email, password, successCallback, unverifiedEmailCallback, invalidLoginCallback, closePopupCallback) {
    let errorHandleCallback = (response) => {
      switch (response.error.code) {
        case "LOGIN_FAILED_EMAIL_NOT_VERIFIED":
          unverifiedEmailCallback();
          break;
        case "LOGIN_FAILED":
          invalidLoginCallback();
          break;
        default:
          Alert.alert('Login Error',response.error.message,[{text: 'OK', onPress: closePopupCallback}]);
      }
    };
    return this._post({ endPoint:'users/login', data:{ email, password } , type:'body'}, successCallback, errorHandleCallback, closePopupCallback)
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
    return this._get({endPoint:'/users/me'});
  },

  /**
   *
   * @returns {*}
   */
  getGroups: function () {
    return this._get({endPoint:'/users/{id}/groups'});
  },

  /**
   *
   * @param email
   * @param successCallback
   * @param closePopupCallback
   */
  requestVerificationEmail: function(email, successCallback, closePopupCallback) {
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
