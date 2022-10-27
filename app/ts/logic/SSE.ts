import {LOGd, LOGe, LOGi, LOGw} from "../logging/Log";
import { RNEventSource }        from 'rn-eventsource-reborn';
import { SseClassGenerator }    from "crownstone-sse/rn";
import { Scheduler }            from "../logic/Scheduler";

const sha1 = require('sha-1');

class Logger {
  error(...args) {
    LOGe.info('SSE:', ...args);
  }
  warn(...args) {
    LOGw.info('SSE:', ...args);
  }
  info(...args) {
    LOGi.info('SSE:', ...args);
  }
  debug(...args) {
    LOGd.info('SSE:', ...args);
  }
}

let options = {
  log:         new Logger(),
  sha1:        sha1,
  fetch:       fetch,
  EventSource: RNEventSource,

  setTimeout:   (callback, ms) => { return Scheduler.setTimeout(callback, ms); },
  clearTimeout: (id)           => { if (id) {id();} },
  setInterval:  (callback, ms) => { return Scheduler.setInterval(callback, ms); },
  clearInterval:(id)           => { if (id) {id();} },

};

export const CrownstoneSSE = SseClassGenerator(options);
