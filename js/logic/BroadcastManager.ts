import { Platform, AppState } from 'react-native'
import { BroadcastStateManager } from "./BroadcastStateManager";

export const BROADCAST_ERRORS = {
  CANNOT_BROADCAST:     { message: "CANNOT_BROADCAST",     fatal: false},
  BROADCAST_INCOMPLETE: { message: "BROADCAST_INCOMPLETE", fatal: false},
  BROADCAST_FAILED:     { message: "BROADCAST_FAILED",     fatal: false},
}



class BroadcastManagerClass {

  commandsToBroadcast = {
    multiSwitch: true
  };


  broadcast(commandData) : Promise<bchReturnType> {
    // double check here, this api should be able to be used
    if (this.canBroadcast(commandData)) {
      return BroadcastStateManager.load(commandData);
    }
    else {
      return new Promise((resolve, reject) => { reject( BROADCAST_ERRORS.CANNOT_BROADCAST ); })
    }
  }

  canBroadcast(commandData) {
    // check if this is a valid command
    if (!(commandData && commandData.command && commandData.commandName)) {
      return false;
    }

    if ((Platform.OS === 'ios' && AppState.currentState === 'active') || Platform.OS === 'android') {
      // allow broadcast attempt for whitelisted commands
      if (this.commandsToBroadcast[commandData.command.commandName] === true) {
        return true
      }
    }
    return false;
  }
}


export const BroadcastManager = new BroadcastManagerClass()