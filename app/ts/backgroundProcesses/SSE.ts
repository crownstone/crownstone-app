import { LOGd, LOGi } from "../logging/Log";
const sha1 = require('sha-1');
import RNEventSource from 'react-native-event-source'
import { SSEGenerator } from "crownstone-sse/rn";

class Logger {
  error(...args) {}
  warn(...args) {}
  info(...args) {
    LOGi.info(...args);
    console.log(...args);
  }
  debug(...args) {
    LOGd.info(...args);
    console.log(...args);
  }
}

let options =  {
  log:         new Logger(),
  sha1:        sha1,
  fetch:       fetch,
  EventSource: RNEventSource,
};

export const CrownstoneSSE = SSEGenerator(options);

export class EventSSEConnector {

  sse
  constructor() {
    this.sse = new CrownstoneSSE({sseUrl: 'http://:3100/sse'});
    this.sse.accessToken = "DEV";
    console.log("create")
  }

  start() {
    this.sse.start((d) => {
      console.log(d)
    })
  }
}
