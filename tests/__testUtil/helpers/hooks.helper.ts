import { __TestEventBus } from "../../../app/ts/util/Testing";


export class TestHookCatcherClass {

  unsubscribe   = () => {};
  hooksReceived = {};
  constructor() {}

  init() {
    this.destroy();
    this.unsubscribe = __TestEventBus.on("HookInvoked", ({ id, data }) => {
      this.process(id, data)
    })
  }

  destroy() {
    this.unsubscribe();
    this.hooksReceived = {};
  }

  process(id, data) {
    this.hooksReceived[id] = data;
  }

  wasHookFired(id) : any {
    if (this.hooksReceived[id] !== undefined) {
      return this.hooksReceived[id];
    }
    return false;
  }
}
