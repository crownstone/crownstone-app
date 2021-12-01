import { DataUtil } from "../../util/DataUtil";
import { NETWORK_REQUEST_TIMEOUT, SILENCE_CLOUD } from "../../ExternalConfig";
import { Scheduler } from "../../logic/Scheduler";
import { LOG, LOGe, LOGi } from "../../logging/Log";
import { ResponseHandler } from "../cloudCore";
import { defaultHeaders } from "../sections/cloudApiBase";
import { xUtil } from "../../util/StandAloneUtil";


export class HubRequestHandler {

  prefix:   string;
  sphereId: string;
  hub:      HubData;
  authorizationToken : string;

  constructor(hub: HubData, sphere?: SphereData) {
    this.hub = hub;
    sphere = sphere ?? DataUtil.getSphereFromHub(hub);
    if (!sphere) { throw "NO_SPHERE_FOR_HUB"; }

    this.sphereId = sphere.id;
    this.authorizationToken = DataUtil.getAuthorizationTokenFromSphere(sphere);
  }

  async post<T>(endpoint: string, options?: RequestOptions) : Promise<T> {
    return this.request("POST", endpoint, options);
  }

  async get<T>(endpoint: string, options?: RequestOptions) : Promise<T> {
    return this.request("GET", endpoint, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions) : Promise<T> {
    return this.request("DELETE", endpoint, options);
  }

  async put<T>(endpoint: string, options?: RequestOptions) : Promise<T> {
    return this.request("PUT", endpoint, options);
  }

  async request<T>(method : HTTPmethod, endpoint : string, options: RequestOptions = {}) : Promise<T> {
    let result = await this._request<T>(method, endpoint, options);
    if (result.status === 200 || result.status === 204) {
      return result.data;
    }

    // this result failed.
    throw result;
  }

  async _request<T>(method : HTTPmethod, endpoint : string, options: RequestOptions = {}) : Promise<CloudResponse<T>> {
    // this will eliminate all cloud requests.
    if (SILENCE_CLOUD === true) {
      throw new Error("Cloud Disabled due to SILENCE_CLOUD == true. Set this to false in ExternalConfig.js to turn the cloud back on.");
    }

    let requestDidTimeout = false;
    let finishedRequest = false;
    let url = this._getUrl(endpoint, options);
    let logToken = xUtil.getToken();

    return new Promise(async (resolve, reject) => {

      let timeoutCallback = () => {
        requestDidTimeout = true;
        reject(new Error('REQUEST_TIMEOUT'))
      };

      // add a timeout for the fetching of data.
      let cancelRequestTimeout = Scheduler.scheduleCallback(timeoutCallback, NETWORK_REQUEST_TIMEOUT);

      let requestInit : RequestInit = { method: method, headers: {...defaultHeaders, Authorization: this.authorizationToken}};
      if (options.body) {
        requestInit.body = JSON.stringify(options.body);
      }

      // attempt to fetch the url
      let response = null;
      try {
        LOGi.info("HubRequest: Attempting to ",method, url, requestInit)
        response = await fetch(url, requestInit)
      }
      catch (connectionError) {
        LOGe.info("HubRequest: ConnectionError", connectionError)
        // this failure could have taken very long and the request might have timeouted in the mean time.
        if (requestDidTimeout === false) {
          return reject(new Error("HUB_UNREACHABLE"))
        }
      }
      finally {
        cancelRequestTimeout();
      }

      if (requestDidTimeout) { return; }

      let responseHandler = new ResponseHandler()
      let result = null;
      try {
        result = await responseHandler.handle(response);
      }
      catch (parseError) {
        LOGe.cloud("HubRequest: ERROR DURING PARSING:", parseError, "from request to:", url, logToken);
        result = '';
      }

      if (requestDidTimeout === false) {
        LOG.cloud("HubRequest: REPLY from", endpoint,'is:', {status: responseHandler.status, data: result}, logToken);
        resolve({status: responseHandler.status, data: result});
      }
    })
  }

  _getUrl(endpoint: string, options: RequestOptions) : string {
    let url = 'http://' + this.hub.config.ipAddress ?? '0.0.0.0'
    if (this.hub.config.httpsPort !== 443) {
      url += `:${this.hub.config.httpsPort}`;
    }
    url = join(url, this.prefix, endpoint);

    // optional id
    if (options.id) { url = join(url, options.id); }

    // add query parameters
    if (options.query) {
      url += "?";
      let paramNames = Object.keys(options.query);
      for (let i = 0; i < paramNames.length; i++) {
        if (i > 0) { url += "&" }
        url += `${encodeURIComponent(paramNames[i])}=${encodeURIComponent(options.query[paramNames[i]])}`;
      }
    }

    return url;
  }
}

export class HubApi extends HubRequestHandler {
  prefix = '/api';
}

function join(...items: string[]) : string {
  let result = ''
  for (let item of items) {
    if (!item) { continue; }

    if (result && !hasTrailingSlash(result) && !hasLeadingSlash(item)) {
      result += '/' + item;
    }
    else if (hasTrailingSlash(result) && hasLeadingSlash(item)) {
      result += item.substr(1);
    }
    else {
      result += item;
    }
  }

  return result;
}

function hasTrailingSlash(str : string) : boolean {
  if (str.length === 0) { return false; }
  return str[str.length - 1] === '/';
}
function hasTrailingAmpersand(str : string) : boolean {
  if (str.length === 0) { return false; }
  return str[str.length - 1] === '&';
}

function hasLeadingSlash(str : string) : boolean {
  if (str.length === 0) { return false; }
  return str[0] === '/'
}
