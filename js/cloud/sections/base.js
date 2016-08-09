import { request, download } from '../cloudCore'
import { DEBUG, SILENCE_CLOUD } from '../../ExternalConfig'
import { preparePictureURI } from '../../util/util'

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
 */
export const base = {
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

    let promise = request(options, 'POST', uploadHeaders, _getId(options.endPoint, this), this._accessToken, true);
    return this._finalizeRequest(promise, options);
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

  /**
   * This method will check the return type error code for 200 or 204 and unpack the data from the response.
   * @param reqType
   * @param endpoint
   * @param options
   * @param type
   * @returns {*}
   * @private
   */
  _setupRequest: function(reqType, endpoint, options = {}, type = 'query') {
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
    return this._finalizeRequest(promise, options);
  },

  _finalizeRequest: function(promise, options) {
    return new Promise((resolve, reject) => {
      promise.then((reply) => {
        console.log("REPLY")
        if (reply.status === 200 || reply.status === 204)
          resolve(reply.data);
        else
          debugReject(reply, reject, arguments);
      })
        .catch((error) => {
          //console.trace(error, this);
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
    console.log("ERROR: UNHANDLED HTML ERROR IN API:", reply, debugOptions);
  }
  reject(reply);
}
