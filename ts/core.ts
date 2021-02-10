import { eventBus } from "./util/EventBus";
import { NativeBus } from "./native/libInterface/NativeBus";


export const core : core = {
  eventBus: eventBus,
  nativeBus: NativeBus,
  bleState: {
    bleAvailable: true,
    bleBroadcastAvailable: true,
  },
  store: { getState: () => { return {}; } },
};

