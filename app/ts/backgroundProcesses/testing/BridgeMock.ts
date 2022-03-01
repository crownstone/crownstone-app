import {NativeBus} from "../../native/libInterface/NativeBus";
import {xUtil} from "../../util/StandAloneUtil";
import {defaultHeaders} from "../../cloud/sections/cloudApiBase";
import {BridgeConfig} from "../../native/libInterface/BridgeConfig";
import {Bluenet_direct} from "../../native/libInterface/Bluenet";


class BridgeMockClass {

  promiseCalls : Record<string, {functionName: string, args: any[], promiseResolver: (result : any) => void}> = {};

  constructor() {}

  callPromise(functionName: string, args: any[], promiseResolver: (result: {error: boolean, data:any}) => void) {
    let id = xUtil.getUUID();
    this.promiseCalls[id] = {functionName, args, promiseResolver};
    let data = {id, function: functionName, args}
    fetch(`${BridgeConfig.mockBridgeUrl}callPromise`, {method:"POST", headers: defaultHeaders as any, body: JSON.stringify(data)})
      .then(()     => { console.log("BridgeMock: Success performing mock callPromise."); })
      .catch((err) => { console.log("BridgeMock: Error while performing mock callPromise.", err?.message); })
  }

  callBluenet(functionName: string, args: any[]) {
    let data = { function: functionName, args, tStart: Date.now() };
    fetch(`${BridgeConfig.mockBridgeUrl}callBluenet`, {method:"POST", headers: defaultHeaders as any, body: JSON.stringify(data)})
      .then(()     => { console.log("BridgeMock: Success performing mock callBluenet."); })
      .catch((err) => { console.log("BridgeMock: Error while performing mock callBluenet.", err?.message); })
  }

  handleSSE(event: any) {
    switch (event.type) {
      case "failCall":
        this.promiseCalls[event.callId]?.promiseResolver({error:true, data: event.error })
        delete this.promiseCalls[event.callId];
        break;
      case "succeedCall":
        this.promiseCalls[event.callId]?.promiseResolver({error:false, data: event.data })
        delete this.promiseCalls[event.callId];
        break;
      case "event":
        NativeBus.emit(event.topic, event.data);
        break;
      case "callBluenet":
        Bluenet_direct[event.functionName].apply(this, event.arguments);
        break;
      case "nativeResolve":
        let promise = this.promiseCalls[event.callId];
        if (promise) {
          let args = promise.args;
          args.push(promise.promiseResolver);
          Bluenet_direct[promise.functionName].apply(this, args);
          delete this.promiseCalls[event.callId];
        }
        break;
    }
  }


}

export const BridgeMock = new BridgeMockClass();