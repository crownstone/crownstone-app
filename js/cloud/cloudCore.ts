import { Alert, Platform } from 'react-native'
import { CLOUD_ADDRESS, SILENCE_CLOUD, NETWORK_REQUEST_TIMEOUT } from '../ExternalConfig'
const RNFS = require('react-native-fs');
let emptyFunction = function() {};
import {LOG, LOGe, LOGi} from '../logging/Log'
import { prepareEndpointAndBody } from './cloudUtil'
import { defaultHeaders } from './sections/cloudApiBase'
import {safeMoveFile, safeDeleteFile, Util} from '../util/Util'
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
          // LOGd.info("Error: JSON-CONTENT IS EMPTY", response);
          return response.json(); // this is a promise
        }
        // LOGd.info("JSON CONTENT", response);
        return response.json(); // this is a promise
      }
    }
    return response.text(); // this is a promise
  };

  let logToken = Util.getToken();

  LOG.cloud(method,"requesting from URL:", CLOUD_ADDRESS + endPoint, "config:", requestConfig, logToken);

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
      let cancelFallbackCallback = Scheduler.scheduleCallback(() => {
          stopRequest = true;
          if (finishedRequest !== true)
            reject('Network request to ' + CLOUD_ADDRESS + endPoint + ' failed')
        },
      NETWORK_REQUEST_TIMEOUT,'NETWORK_REQUEST_TIMEOUT');

      fetch(CLOUD_ADDRESS + endPoint, requestConfig as any)
        .catch((connectionError) => {
          if (stopRequest === false) {
            reject('Network request to ' + CLOUD_ADDRESS + endPoint + ' failed');
          }
        })
        .then((response) => {
          if (stopRequest === false) {
            cancelFallbackCallback();
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
            LOG.cloud("REPLY from", endPoint, " with options: ", requestConfig, " is: ", {status: STATUS, data: parsedResponse}, logToken);
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
    // get a temp path
    let downloadSessionId = Math.round(10000 + Math.random() * 1e5).toString(36);
    let tempFilename = downloadSessionId + '.tmp';
    let tempPath = Util.getPath(tempFilename);
    tempPath = 'file://' + tempPath.replace("file://","");
    targetPath = 'file://' + targetPath.replace("file://","");

    LOGi.cloud('CloudCore:DownloadFile: ',downloadSessionId,'download requesting from URL:', url, 'temp:', tempPath, 'target:', targetPath);


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
              LOGi.cloud('CloudCore:DownloadFile:',downloadSessionId,' Download was not status 200:', status);
              callbacks.success();
              resolve(null);
            })
            .catch((err) => { LOGe.cloud("CloudCore:DownloadFile:",downloadSessionId," Could not delete file", tempPath, ' err:', err); });
        }
        else {
          safeMoveFile(tempPath, targetPath)
            .then((toPath) => {
              // if we have renamed the file, we resolve the promise so we can store the changed filename.
              LOGi.cloud('CloudCore:DownloadFile:',downloadSessionId,' Downloaded file successfully:', targetPath);
              callbacks.success();
              resolve(toPath);
            })
            .catch((err) => {  LOGe.cloud("CloudCore:DownloadFile:",downloadSessionId," Could not move file", tempPath, ' to ', targetPath, 'err:', err); });
        }
      })
      .catch((err) => {
        LOGe.cloud("CloudCore:DownloadFile: ",downloadSessionId,"Could not download file err:", err);
        safeDeleteFile(tempPath).catch((err) => { LOGe.cloud("CloudCore:DownloadFile: ",downloadSessionId," Could not delete file", tempPath, 'err:', err); });
        reject(err);
      })
  });
}

