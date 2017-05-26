import { Alert, Platform } from 'react-native'
import { CLOUD_ADDRESS, DEBUG, SILENCE_CLOUD, NETWORK_REQUEST_TIMEOUT } from '../ExternalConfig'
const RNFS = require('react-native-fs');
let emptyFunction = function() {};
import { LOG } from '../logging/Log'
import { prepareEndpointAndBody } from './cloudUtil'
import { defaultHeaders } from './sections/base'
import { safeMoveFile, safeDeleteFile } from '../util/Util'
import {Scheduler} from "../logic/Scheduler";

/**
 *
 * This method communicates with the cloud services.
 *
 * @param options        // { endPoint: '/users/', data: JSON, type:'body'/'query' }
 * @param method
 * @param headers
 * @param id
 * @param accessToken
 * @param doNotStringify
 */
export function request(
  options : object,
  method : string,
  headers : object = defaultHeaders,
  id : string,
  accessToken : string,
  doNotStringify? : boolean) {
  // append _accessToken, data that goes into the query and insert ids
  let { endPoint, body } = prepareEndpointAndBody(options, id, accessToken, doNotStringify);

  // setup the request configuration
  let requestConfig = { method, headers, body };

  // two semi-global variables in this promise:
  let STATUS = 0;

  // parse the reply
  let handleInitialReply = (response) => {
    STATUS = response.status;
    if (response &&
      response.headers &&
      response.headers.map &&
      response.headers.map['content-type'] &&
      response.headers.map['content-type'].length > 0) {
      if (response && response._bodyBlob && response._bodyBlob.size === 0) {
        return '';
      }
      else if (response.headers.map['content-type'][0].substr(0,16) === 'application/json') {
        if (response.headers.map['content-length'] &&
          response.headers.map['content-length'].length > 0 &&
          response.headers.map['content-length'][0] == 0) {
          // LOG.debug("Error: JSON-CONTENT IS EMPTY", response);
          return response.json(); // this is a promise
        }
        // LOG.debug("JSON CONTENT", response);
        return response.json(); // this is a promise
      }
    }
    return response.text(); // this is a promise
  };

  if (DEBUG)
    LOG.cloud(method,"requesting from URL:", CLOUD_ADDRESS + endPoint, " body:", body, "config:",requestConfig);

  // the actual request
  return new Promise((resolve, reject) => {
    // this will eliminate all cloud requests.
    if (SILENCE_CLOUD === true) {
      reject("Cloud Disabled due to SILENCE_CLOUD == true. Set this to false in ExternalConfig.js to turn the cloud back on.");
    }
    else {
      let stopRequest = false;
      let finishedRequest = false;
      // add a timeout for the fetching of data.
      Scheduler.scheduleCallback(() => {
          stopRequest = true;
          if (finishedRequest !== true)
            reject(new Error('Network request failed'))
        },
      NETWORK_REQUEST_TIMEOUT);

      fetch(CLOUD_ADDRESS + endPoint, requestConfig)
        .catch((connectionError) => {
          if (stopRequest === false) {
            reject(new Error('Network request failed'));
          }
        })
        .then((response) => {
          if (stopRequest === false) {
            return handleInitialReply(response);
          }
        })
        .catch((parseError) => {
          // TODO: cleanly fix this
          // LOG.error("ERROR DURING PARSING:", parseError, "from request to:", CLOUD_ADDRESS + endPoint, "using config:", requestConfig);
          return '';
        })
        .then((parsedResponse) => {
          if (stopRequest === false) {
            LOG.cloud("REPLY from", endPoint, " with options: ", requestConfig, " is: ", {status: STATUS, data: parsedResponse});
            finishedRequest = true;
            resolve({status: STATUS, data: parsedResponse});
          }
        })
        .catch((err) => {
          if (stopRequest === false) {
            finishedRequest = true;
            reject(err);
          }
        })
    }
  });
}
/**
 * 
 * @param options
 * @param id
 * @param accessToken
 * @param toPath
 * @param beginCallback
 * @param progressCallback
 * @param successCallback
 * @returns {Promise}
 */
export function download(options, id, accessToken, toPath, beginCallback = emptyFunction, progressCallback = emptyFunction, successCallback = emptyFunction) {
  // append _accessToken, data that goes into the query and insert ids
  let {endPoint} = prepareEndpointAndBody(options, id, accessToken);

  // this will automatically try to download to a temp file. When not possible it will remove the temp file and resolve with null
  return downloadFile(CLOUD_ADDRESS + endPoint, toPath, {begin: beginCallback, progress: progressCallback, success: successCallback});
}

export function downloadFile(url, targetPath, callbacks) {
  return new Promise((resolve, reject) => {
    // TODO: move to util
    let path = RNFS.DocumentDirectoryPath;
    if (Platform.OS === 'android') {
      path = RNFS.ExternalDirectoryPath;
    }

    // get a temp path
    let tempPath = path + '/' + (10000 + Math.random() * 1e5).toString(36).replace(".", "") + '.tmp';

    if (DEBUG)
      LOG.cloud('download requesting from URL:', url, 'temp:', tempPath, 'target:', targetPath);

    // download the file.
    RNFS.downloadFile({
      fromUrl: url,
      toFile: tempPath,
      begin: callbacks.begin,
      progress: callbacks.progress
    }).promise
      .then((status) => {
        if (status.statusCode !== 200) {
          // remove the temp file if the download failed
          safeDeleteFile(tempPath)
            .then(() => {
              callbacks.success();
              resolve(null);
            })
            .catch((err) => { });
        }
        else {
          safeMoveFile(tempPath, targetPath)
            .then((toPath) => {
              // if we have renamed the file, we resolve the promise so we can store the changed filename.
              callbacks.success();
              resolve(toPath);
            })
            .catch((err) => { });
        }
      })
      .catch((err) => {
        safeDeleteFile(tempPath).catch((err) => { });
        reject(err);
      })
  });
}

