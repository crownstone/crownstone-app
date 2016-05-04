'use strict'
import React, { Alert } from 'react-native';
import { CLOUD_ADDRESS, DEBUG } from '../externalConfig'
import RNFS from 'react-native-fs'

let emptyFunction = function() {};

let defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

let uploadHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'multipart/form-data; boundary=6ff46e0b6b5148d984f148b6542e5a5d',
};

export let CLOUD = {
  accessToken: undefined,
  userId: undefined,
  deviceId: undefined,
  eventId: undefined,
  groupId: undefined,
  locationId: undefined,
  stoneId: undefined,

  post:     function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'POST', defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  get:      function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'GET',  defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  delete:   function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'DELETE', defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  put:      function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'PUT',  defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  head:     function(options, successCallback, errorHandleCallback, closePopupCallback) {
    return request(options, 'HEAD', defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },

  uploadImage: function(options, successCallback, errorHandleCallback, closePopupCallback) {
    var formData = new FormData();
    let path = options.path.substr(0,4) === 'file' ? options.path : 'file://' + options.path;
    formData.append('image', {type: "image/jpeg", name: options.name, uri: path });
    options.data = formData;
    return request(options, 'POST', uploadHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken, true)
  },

  download: function(options, toPath, beginCallback = emptyFunction, progressCallback = emptyFunction) {
    return download(options, getId(options.endPoint, this), this.accessToken, toPath, beginCallback, progressCallback)
  },

  setAccess:   function(accessToken) { this.accessToken = accessToken; return this; },
  forUser:     function(userId)      { this.userId = userId;           return this; },
  forStone:    function(stoneId)     { this.stoneId = stoneId;         return this; },
  forGroup:    function(groupId)     { this.groupId = groupId;         return this; },
  forLocation: function(locationId)  { this.locationId = locationId;   return this; },
  forEvent:    function(eventId)     { this.eventId = eventId;         return this; },
  forDevice:   function(deviceId)    { this.deviceId = deviceId;       return this; },
};


/**
 *
 * This method communicates with the cloud services.
 *
 * @param options         { endPoint: '/users/', data: JSON, type:'body'/'query' }
 * @param method
 * @param headers
 * @param id
 * @param successCallback
 * @param errorHandleCallback
 * @param closePopupCallback
 * @param accessToken
 */
let request = function(options, method, headers = defaultHeaders, id, successCallback, errorHandleCallback, closePopupCallback, accessToken, doNotStringify) {
  // append accessToken, data that goes into the query and insert ids
  let { endPoint, body } = prepareEndpointAndBody(options, id, accessToken, doNotStringify);

  // setup the request configuration
  let requestConfig = { method, headers, body };

  // parse the reply
  let status = 0;
  let handleInitialReply = (response) => {
    status = response.status;
    if (response &&
      response.headers &&
      response.headers.map &&
      response.headers.map['content-type'] &&
      response.headers.map['content-type'].length > 0) {
      if (response.headers.map['content-type'][0].substr(0,16) === 'application/json') {
        if (response.headers.map['content-length'] &&
          response.headers.map['content-length'].length > 0 &&
          response.headers.map['content-length'][0] == 0) {
          return '';
        }
        return response.json();
      }
    }
    return response.text();
  };

  // handle the parsed reply
  let handleParsedResponse = (parsedResponse) => {
    return new Promise((resolve, reject) => {
      if (status === 200 || status === 204) {
        if (successCallback)
          successCallback(parsedResponse);
        else if (DEBUG === true)
          console.log("SUCCESS STATE: ", status, parsedResponse);
        resolve(parsedResponse);
      }
      else {
        if (typeof parsedResponse === 'object') {
          if (parsedResponse && parsedResponse.error) {
            if (errorHandleCallback)
              errorHandleCallback(parsedResponse);
            else if (DEBUG === true)
              console.log("errorHandleCallback STATE: ", status, parsedResponse);
            reject(parsedResponse);
          }
          else {
            Alert.alert("Unknown Reply", JSON.stringify(parsedResponse),getOKButton(closePopupCallback, parsedResponse, resolve))
          }
        }
        else {
          Alert.alert("Unknown Reply", parsedResponse, getOKButton(closePopupCallback, parsedResponse, resolve))
        }
      }
    })
  };

  // if anything crashes:
  let handleErrors = (err) => {
    Alert.alert("App Error", err.message, getOKButton(closePopupCallback, err));
  };

  console.log(method,"requesting from URL:", CLOUD_ADDRESS + endPoint, body);
  // the actual request

  return new Promise((resolve, reject) => {
    fetch(CLOUD_ADDRESS + endPoint, requestConfig)
      .then(handleInitialReply.bind(this))
      .then(handleParsedResponse.bind(this))
      .then(() => {resolve()})
      .catch(handleErrors.bind(this))
    });
};

function download(options, id, accessToken, toPath, beginCallback, progressCallback) {
  // append accessToken, data that goes into the query and insert ids
  let {endPoint} = prepareEndpointAndBody(options, id, accessToken);

  // this will automatically try to download to a temp file. When not possible it will remove the temp file and resolve with null
  return new Promise((resolve, reject) => {
    // get a temp path
    let tempPath = RNFS.DocumentDirectoryPath + '/' + (10000 + Math.random() * 1e6).toString(36);

    // download the file.
    RNFS.downloadFile(CLOUD_ADDRESS + endPoint, tempPath, beginCallback, progressCallback)
      .then((status) => {
        if (status.statusCode !== 200) {
          // remove the temp file if the download failed
          RNFS.unlink(tempPath);
          resolve(null);
        }
        else {
          RNFS.moveFile(tempPath, toPath)
            .then(() => {
              // if we have renamed the file, we resolve the promise so we can store the changed filename.
              resolve(toPath);
            });
        }
      }).catch(reject)
  });
}

function prepareEndpointAndBody(options, id, accessToken, doNotStringify) {
  let endPoint = options.endPoint;

  // inject the ID into the url if required.
  endPoint = endPoint.replace('{id}', id);
  if (endPoint.substr(0,1) === "/") {
    endPoint = endPoint.substr(1,endPoint.length)
  }

  // append the access token to the url if we have it.
  if (accessToken !== undefined) {
    endPoint = appendToURL(endPoint, {access_token: accessToken});
  }

  // check if we have to define the body content or add it to the url
  let body = undefined;
  if (options.type === 'body' || options.type === undefined) {
    if (typeof options.data === 'object' && doNotStringify !== true) {
      body = JSON.stringify(options.data);
    }
    else {
      body = options.data;
    }
  }
  else
    endPoint = appendToURL(endPoint, options.data);

  return { endPoint, body };
}

function appendToURL(url, toAppend) {
  if (toAppend) {
    let appendString = '';
    if (typeof toAppend === 'object') {
      let keyArray = Object.keys(toAppend);
      for (let i = 0; i < keyArray.length; i++) {
        appendString += keyArray[i] + '=' + htmlEncode(toAppend[keyArray[i]]);
        if (i != keyArray.length - 1) {
          appendString += '&';
        }
      }
    }
    else
      throw new Error("ERROR: cannot append anything except an object to an URL. Received: " + toAppend);

    if (url.indexOf('?') === -1)
      url += '?';
    else if (url.substr(url.length - 1) !== '&')
      url += '&';

    url += appendString;
  }
  return url;
};

function htmlEncode(str) {
  if (Array.isArray(str) || typeof str === 'object') {
    return JSON.stringify(str);
  }
  else {
    return str + '';
  }
}

function getOKButton(callback, arg, resolve) {
  return [{text:'OK', onPress: () => {
    if (callback) {
      callback(arg);
      if (resolve)
        resolve()
    }
  }}];
}

function getId(url, obj) {
  let usersLocation = url.indexOf('users');
  if (usersLocation !== -1 && usersLocation < 3)
    return obj.userId;

  let devicesLocation = url.indexOf('Devices');
  if (devicesLocation !== -1 && devicesLocation < 3)
    return obj.deviceId;

  let eventsLocation = url.indexOf('Events');
  if (eventsLocation !== -1 && eventsLocation < 3)
    return obj.eventId;

  let groupsLocation = url.indexOf('Groups');
  if (groupsLocation !== -1 && groupsLocation < 3)
    return obj.groupId;

  let locationsLocation = url.indexOf('Locations');
  if (locationsLocation !== -1 && locationsLocation < 3)
    return obj.locationId;

  let stoneLocation = url.indexOf('Stones');
  if (stoneLocation !== -1 && stoneLocation < 3)
    return obj.stoneId;
}

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// I needed the opposite function today, so adding here too:
function htmlUnescape(value){
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}