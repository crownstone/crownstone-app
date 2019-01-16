import { Platform, AppState } from 'react-native'
import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";

export const BROADCAST_ERRORS = {
  CANNOT_BROADCAST:     { message: "CANNOT_BROADCAST",     fatal: false},
  BROADCAST_INCOMPLETE: { message: "BROADCAST_INCOMPLETE", fatal: false},
  BROADCAST_FAILED:     { message: "BROADCAST_FAILED",     fatal: false},
}



class BroadcastCommandManagerClass {

  commandsToBroadcast = {
    multiSwitch: true
  };


  broadcast(commandData) : Promise<bchReturnType> {
    // double check here, this api should be able to be used
    if (this.canBroadcast(commandData)) {
      // TODO: make generic
      console.log("Switching via broadcast")
      return BluenetPromiseWrapper.broadcastSwitch(commandData.sphereId, commandData.stone.config.crownstoneId, commandData.command.state)
        .then(() => {
          console.log("Success broadcast", commandData.command.state)
          return { data: null }
        })
        .catch((err) => {
          console.log("ERROR broadcast", commandData.command.state)
          throw err
        })
    }
    else {
      return new Promise((resolve, reject) => { reject( BROADCAST_ERRORS.CANNOT_BROADCAST ); })
    }
  }

  canBroadcast(commandData) {


    // check if this is a valid command
    if (!(commandData && commandData.command && commandData.command.commandName)) {
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


export const BroadcastCommandManager = new BroadcastCommandManagerClass()