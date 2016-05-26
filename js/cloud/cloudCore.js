import { Alert } from 'react-native'
import { CLOUD_ADDRESS, DEBUG, SILENCE_CLOUD } from '../ExternalConfig'
import RNFS from 'react-native-fs'
let emptyFunction = function() {};

import { prepareEndpointAndBody } from './cloudUtil'

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
export function request(
  options,
  method,
  headers = defaultHeaders,
  id,
  accessToken,
  doNotStringify) {
  // append _accessToken, data that goes into the query and insert ids
  let { endPoint, body } = prepareEndpointAndBody(options, id, accessToken, doNotStringify);

  // setup the request configuration
  let requestConfig = { method, headers, body };

  // two semi-global variables in this promise:
  let STATUS = 0;

  // parse the reply
  let handleInitialReply = (response) => {
    // this will eliminate all cloud requests.
    if (SILENCE_CLOUD === true) 
      throw new Error("CLOUD NOT AVAILABLE");
    
    STATUS = response.status;
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
        return response.json(); // this is a promise
      }
    }
    return response.text(); // this is a promise
  };

  if (DEBUG)
    console.log(method,"requesting from URL:", CLOUD_ADDRESS + endPoint, body);

  // the actual request
  return new Promise((resolve, reject) => {
    fetch(CLOUD_ADDRESS + endPoint, requestConfig)
      .then(handleInitialReply)
      .then((parsedResponse) => {resolve({status:STATUS, data: parsedResponse});})
      .catch((err) => {
        reject(err);
      })
  });
};


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
  return new Promise((resolve, reject) => {
    // get a temp path
    let tempPath = RNFS.DocumentDirectoryPath + '/' + (10000 + Math.random() * 1e6).toString(36);

    if (DEBUG)
      console.log('download',"requesting from URL:", CLOUD_ADDRESS + endPoint, tempPath);

    // download the file.
    RNFS.downloadFile(CLOUD_ADDRESS + endPoint, tempPath, beginCallback, progressCallback)
      .then((status) => {
        if (status.statusCode !== 200) {
          // remove the temp file if the download failed
          RNFS.unlink(tempPath);
          successCallback();
          resolve(null);
        }
        else {
          RNFS.moveFile(tempPath, toPath)
            .then(() => {
              // if we have renamed the file, we resolve the promise so we can store the changed filename.
              successCallback();
              resolve(toPath);
            });
        }
      }).catch(reject)
  });
}
