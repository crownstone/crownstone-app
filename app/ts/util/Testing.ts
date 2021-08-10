import { EventBusClass } from "./EventBus";

export const __TestEventBus = new EventBusClass("TestEventBus");

export const Testing = {
  hook: function(id: string, data?: any) {
    __TestEventBus.emit("HookInvoked", {id, data})
  }
}