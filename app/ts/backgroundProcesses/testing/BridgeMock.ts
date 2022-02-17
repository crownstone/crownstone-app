import {NativeBus} from "../../native/libInterface/NativeBus";
import {xUtil} from "../../util/StandAloneUtil";
import {defaultHeaders} from "../../cloud/sections/cloudApiBase";
import {BluenetConfig} from "../../native/libInterface/BluenetConfig";


class BridgeMockClass {

  calls = {};

  constructor() {}

  call(functionName: string, args: any[], promiseResolver: (result: {error: boolean, data:any}) => void) {
    let id = xUtil.getUUID();
    this.calls[id] = {functionName, args, promiseResolver};
    let data = {id, function: functionName, args}
    fetch(`${BluenetConfig.mockBridgeUrl}call`, {method:"POST", headers: defaultHeaders as any, body: JSON.stringify(data)})
      .then((result) => { console.log("Success performing mock call.")})
      .catch((err) => { console.log("Error while performing mock call.", err?.message); })
  }

  handleSSE(event: any) {
    switch (event.type) {
      case "failCall":
        this.calls[event.callId]?.promiseResolver({error:true, data: event.error })
        delete this.calls[event.callId];
        break;
      case "succeedCall":
        this.calls[event.callId]?.promiseResolver({error:false, data: event.data })
        delete this.calls[event.callId];
        break;
      case "event":
        NativeBus.emit(event.topic, event.data);
        break;
    }
  }


}

export const BridgeMock = new BridgeMockClass();