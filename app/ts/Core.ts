import { eventBus } from "./util/EventBus";
import { NativeBus } from "./native/libInterface/NativeBus";


export const core : core = {
  eventBus: eventBus,
  nativeBus: NativeBus,
  permissionState: {
    location:  'unknown',
    bluetooth: 'unknown',
    bluetoothType: 'SCANNER',
  },
  bleState: {
    bleAvailable: true,
    bleBroadcastAvailable: true,
  },
  store: {
    getState: () : ReduxAppState => {

      // @ts-ignore
      return {}
    },
    dispatch: () => {

    },
    batchDispatch: () => {

    }
  },
};

