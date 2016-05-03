'use strict'
import { Alert } from 'react-native';
import { CLOUD_ADDRESS } from '../externalConfig'

let defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
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
    request(options, 'POST', defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  get:      function(options, successCallback, errorHandleCallback, closePopupCallback) {
    request(options, 'GET',  defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  delete:   function(options, successCallback, errorHandleCallback, closePopupCallback) {
    request(options, 'DELETE', defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  put:      function(options, successCallback, errorHandleCallback, closePopupCallback) {
    request(options, 'PUT',  defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  head:     function(options, successCallback, errorHandleCallback, closePopupCallback) {
    request(options, 'HEAD', defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  upload:   function(options, successCallback, errorHandleCallback, closePopupCallback) {
    request(options, 'POST', defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
  },
  download: function(options, successCallback, errorHandleCallback, closePopupCallback) {
    request(options, 'POST', defaultHeaders, getId(options.endPoint, this), successCallback, errorHandleCallback, closePopupCallback, this.accessToken)
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
let request = function(options, method, headers = defaultHeaders, id, successCallback, errorHandleCallback, closePopupCallback, accessToken) {
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
  if (options.type === 'body' || options.type === undefined)
    body = JSON.stringify(options.data);
  else
    endPoint = appendToURL(endPoint, options.data);

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
    if (status === 200 || status === 204) {
      successCallback(parsedResponse);
    }
    else {
      if (typeof parsedResponse === 'object') {
        if (parsedResponse && parsedResponse.error) {
          errorHandleCallback(parsedResponse)
        }
        else {
          Alert.alert("Unknown Reply", JSON.stringify(parsedResponse),getOKButton(closePopupCallback, parsedResponse))
        }
      }
      else {
        Alert.alert("Unknown Reply", parsedResponse, getOKButton(closePopupCallback, parsedResponse))
      }
    }
  };

  // if anything crashes:
  let handleErrors = (err) => {
    Alert.alert("App Error", err.message, getOKButton(closePopupCallback, err));
  };

  console.log("requesting from URL:", CLOUD_ADDRESS + endPoint, body);
  // the actual request
  fetch(CLOUD_ADDRESS + endPoint, requestConfig)
    .then(handleInitialReply.bind(this))
    .then(handleParsedResponse.bind(this))
    .catch(handleErrors.bind(this))
};

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

function getOKButton(callback, arg) {
  return [{text:'OK', onPress: () => {
    if (callback) {
      callback(arg);
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