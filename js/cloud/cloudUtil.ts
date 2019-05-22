import { xUtil } from "../util/StandAloneUtil";

export function prepareEndpointAndBody(options : any, id : any, accessToken : any, doNotStringify? : boolean) {
  let endPoint = options.endPoint;

  // inject the ID into the url if required.
  endPoint = endPoint.replace('{id}', id);
  if (endPoint.substr(0,1) === '/') {
    endPoint = endPoint.substr(1,endPoint.length)
  }

  let skipAccessToken = options && options.options && options.options.noAccessToken || false;
  // append the access token to the url if we have it.
  if (accessToken && !skipAccessToken) {
    endPoint = _appendToURL(endPoint, {access_token: accessToken});
  }

  // check if we have to define the body content or add it to the url
  let body = undefined;
  if (options.type === 'body' || options.type === undefined) {
    if (typeof options.data === 'object' && doNotStringify !== true) {
      body = xUtil.stringify(options.data);
    }
    else {
      body = options.data;
    }
  }
  else if (options.type === 'body-urlencoded') {
    body = '';
    if (typeof options.data === 'object') {
      let keys = Object.keys(options.data);
      for (let i = 0; i < keys.length; i++) {
        body += keys[i] + '=' + options.data[keys[i]] + '&'
      }
      // strip last &
      body = body.substr(0, body.length-1);
    }
  }
  else
    endPoint = _appendToURL(endPoint, options.data);

  return { endPoint, body };
}

function _appendToURL(url, toAppend) {
  if (toAppend) {
    let appendString = '';
    if (typeof toAppend === 'object') {
      let keyArray = Object.keys(toAppend);
      for (let i = 0; i < keyArray.length; i++) {
        appendString += keyArray[i] + '=' + _htmlEncode(toAppend[keyArray[i]]);
        if (i != keyArray.length - 1) {
          appendString += '&';
        }
      }
    }
    else
      throw new Error('ERROR: cannot append anything except an object to an URL. Received: ' + toAppend);

    if (url.indexOf('?') === -1)
      url += '?';
    else if (url.substr(url.length - 1) !== '&')
      url += '&';

    url += appendString;
  }
  return url;
}
function _htmlEncode(str) {
  if (Array.isArray(str) || typeof str === 'object') {
    return encodeURIComponent(JSON.stringify(str));
  }
  else {
    return encodeURIComponent(str + '');
  }
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