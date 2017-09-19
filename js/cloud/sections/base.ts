import {request, download, downloadFile} from '../cloudCore'
import { DEBUG, SILENCE_CLOUD } from '../../ExternalConfig'
import { preparePictureURI } from '../../util/Util'
import { EventBusClass } from '../../util/EventBus'
import { LOG } from '../../logging/Log'

export const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

export const uploadHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'multipart/form-data',
};


/**
 * The cloud API is designed to maintain the REST endpoints and to handle responsed and errors on the network level.
 * When the reponses come back successfully, the convenience wrappers allow callbacks for relevant scenarios.
 *
 */

export const base = {
  events: new EventBusClass(),
  _accessToken: undefined,
  _userId: undefined,
  _deviceId: undefined,
  _installationId: undefined,
  _eventId: undefined,
  _sphereId: undefined,
  _locationId: undefined,
  _stoneId: undefined,
  _applianceId: undefined,
  _messageId: undefined,
  _networkErrorHandler: () => {},

  _post: function(options) {
    return request(options, 'POST',   defaultHeaders, _getId(options.endPoint, this), this._accessToken);
  },
  _get: function(options) {
    return request(options, 'GET',    defaultHeaders, _getId(options.endPoint, this), this._accessToken);
  },
  _delete: function(options) {
    return request(options, 'DELETE', defaultHeaders, _getId(options.endPoint, this), this._accessToken);
  },
  _put: function(options) {
    return request(options, 'PUT',    defaultHeaders, _getId(options.endPoint, this), this._accessToken);
  },
  _head: function(options) {
    return request(options, 'HEAD',   defaultHeaders, _getId(options.endPoint, this), this._accessToken);
  },
  _uploadImage: function(options) {
    let formData = new FormData();
    let path = preparePictureURI(options.path);
    let filename = path.split('/');
    filename = filename[filename.length-1];
    formData.append('image', {type: 'image/jpeg', name: filename, uri: path });
    options.data = formData;

    let promise = request(options, 'POST', uploadHeaders, _getId(options.endPoint, this), this._accessToken, true);
    return this._finalizeRequest(promise, options);
  },
  _download: function(options, toPath, beginCallback, progressCallback) {
    return download(options, _getId(options.endPoint, this), this._accessToken, toPath, beginCallback, progressCallback)
  },
  downloadFile: function(url, targetPath, callbacks) {
    return downloadFile(url, targetPath, callbacks);
  },
  _handleNetworkError: function (error, options, endpoint, promiseBody, reject) {
    // this will eliminate all cloud requests.
    if (SILENCE_CLOUD === true)
      return;

    if (options.background !== true) {
      this._networkErrorHandler(error);
      reject(error);
    }
    else {
      // still reject the promise even if it is a background operation.
      reject(error);
    }


    if (DEBUG === true) {
      LOG.cloud(options.background ? 'BACKGROUND REQUEST:' : '','Network Error:', error, endpoint, promiseBody);
    }
  },

  /**
   * This method will check the return type error code for 200 or 204 and unpack the data from the response.
   * @param reqType
   * @param endpoint
   * @param options
   * @param type
   * @returns {*}
   * @private
   */
  _setupRequest: function(reqType, endpoint, options : any = {}, type = 'query') {
    let promiseBody = {endPoint: endpoint, data: options.data, type:type, options: options};
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
        LOG.error("UNKNOWN TYPE:", reqType);
        return;
    }
    return this._finalizeRequest(promise, options, endpoint, promiseBody);
  },

  _finalizeRequest: function(promise, options, endpoint, promiseBody) {
    return new Promise((resolve, reject) => {
      promise
        .then((reply) => {
          if (reply.status === 200 || reply.status === 204)
            resolve(reply.data);
          else
            this.__debugReject(reply, reject, [promise, options, endpoint, promiseBody]);
        })
        .catch((error) => {
          //console.trace(error, this);
          this._handleNetworkError(error, options, endpoint, promiseBody, reject);
        })
    });
  },


  // END USER API
  // These methods have all the endpoints embedded in them.

  setNetworkErrorHandler: function(handler)         { this._networkErrorHandler = handler },
  setAccess:              function(accessToken)     { this._accessToken = accessToken;        return this; },
  setUserId:              function(userId)          { this._userId = userId;                  return this; },
  forUser:                function(userId)          { this._userId = userId;                  return this; },
  forStone:               function(stoneId)         { this._stoneId = stoneId;                return this; },
  forSphere:              function(sphereId)        { this._sphereId = sphereId;              return this; },
  forLocation:            function(locationId)      { this._locationId = locationId;          return this; },
  forEvent:               function(eventId)         { this._eventId = eventId;                return this; },
  forDevice:              function(deviceId)        { this._deviceId = deviceId;              return this; },
  forAppliance:           function(applianceId)     { this._applianceId = applianceId;        return this; },
  forInstallation:        function(installationId)  { this._installationId = installationId;  return this; },
  forMessage:             function(messageId)       { this._messageId = messageId;            return this; },

  __debugReject: function(reply, reject, debugOptions) {
    if (DEBUG) {
      LOG.error("ERROR: UNHANDLED HTML ERROR IN API:", reply, debugOptions);
    }
    reject(reply);
  }
};



function _getId(url, obj) : string {
  let usersLocation = url.indexOf('users');
  if (usersLocation !== -1 && usersLocation < 3)
    return obj._userId;

  let devicesLocation = url.indexOf('Devices');
  if (devicesLocation !== -1 && devicesLocation < 3)
    return obj._deviceId;

  let appliancesLocation = url.indexOf('Appliances');
  if (appliancesLocation !== -1 && appliancesLocation < 3)
    return obj._applianceId;

  let eventsLocation = url.indexOf('Events');
  if (eventsLocation !== -1 && eventsLocation < 3)
    return obj._eventId;

  let spheresLocation = url.indexOf('Spheres');
  if (spheresLocation !== -1 && spheresLocation < 3)
    return obj._sphereId;

  let locationsLocation = url.indexOf('Locations');
  if (locationsLocation !== -1 && locationsLocation < 3)
    return obj._locationId;

  let stoneLocation = url.indexOf('Stones');
  if (stoneLocation !== -1 && stoneLocation < 3)
    return obj._stoneId;

  let installationLocation = url.indexOf('AppInstallation');
  if (installationLocation !== -1 && installationLocation < 3)
    return obj._installationId;

  let messagesLocation = url.indexOf('Messages');
  if (messagesLocation !== -1 && messagesLocation < 3)
    return obj._messageId;
}

