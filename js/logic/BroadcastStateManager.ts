import { AppState, Platform } from "react-native"
import { LOG } from "../logging/Log";




class BroadcastStateManagerClass {

  broadcastDuration = 2000; // ms

  pendingBroadcasts = {};
  broadcastingData = {};


  constructor() {}

  init() {
    AppState.addEventListener('change', (appState) => {
      if (Platform.OS === 'ios') {
        if (appState != "active") {
          // do nothing?
          this._invalidateAll();
        }
      }
    });
  }



  _invalidateAll() {

  }

  _updatePayload() {

  }

  /**
   * Command: {
   *   type: String,
   *
   * }
   * @param command
   */
  load(command) : Promise<bchReturnType> {
    return new Promise((resolve, reject) => {
      
    })
  }

  multiswitch(stoneId, switchState) {

  }


}


export const BroadcastStateManager = new BroadcastStateManagerClass()