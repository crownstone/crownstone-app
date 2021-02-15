import { EventBusClass } from "../../../app/ts/util/EventBus";
import { AppState } from "react-native";
import { xUtil } from "../../../app/ts/util/StandAloneUtil";

export function mockScheduler() {
  let scheduler = new MockSchedulerClass();
  jest.mock("../../../app/ts/logic/Scheduler", () => {
    return { Scheduler: scheduler }
  })
  return scheduler;
}

class MockSchedulerClass {
  _callbacks = [];


  trigger() {
    if (this._callbacks.length === 0) {
      throw "NOTHING_TO_TRIGGER";
    }

    this._callbacks[0].callback();
    this._callbacks.shift()
  }

  reset() {
    this._callbacks = []
  }

  scheduleCallback(callback, afterMilliseconds, label = "unlabeled") : () => void {
    let id = xUtil.getUUID();
    this._callbacks.push({id, callback});
    return () => {
      for (let i = 0; i < this._callbacks.length; i++) {
        if (this._callbacks[i].id === id) {
          this._callbacks.splice(i,1);
          break;
        }
      }
    }
  }
}