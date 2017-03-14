import { BluenetPromiseWrapper } from '../native/Proxy';
import { LOG } from '../logging/Log'


export class MeshHelper {
  store : any;
  sphereId : any;
  meshNetworkId : any;
  meshInstruction : meshTodo;
  targets : any;
  _containedInstructions : any[] = [];

  constructor(store, sphereId, meshNetworkId, meshInstruction : meshTodo) {
    this.store = store;
    this.sphereId = sphereId;
    this.meshNetworkId = meshNetworkId;
    this.meshInstruction = meshInstruction;
  }

  performAction() {
    let actionPromise = null;

    if (actionPromise === null) { actionPromise = this._handleMultiSwitchCommands(); }
    if (actionPromise === null) { actionPromise = this._handleSetSwitchStateCommands(); }
    if (actionPromise === null) { actionPromise = this._handleKeepAliveCommands(); }
    if (actionPromise === null) { actionPromise = this._handleOtherCommands(); }

    // This will return a BluenetPromiseWrapper promise
    return actionPromise
      .then(() => {
        this._containedInstructions.forEach((instruction) => {
          instruction.promise.resolve();
          instruction.cleanup();
        })
      })
      .catch((err) => {
        this._containedInstructions.forEach((instruction) => {
          instruction.attempts -= 1;
          if (instruction.attemps <= 0) {
            instruction.promise.reject();
            instruction.cleanup();
          }
        });
        throw err;
      });
  }


  _handleMultiSwitchCommands() {
    if (this.meshInstruction.multiSwitch.length > 0) {
      let multiSwitchInstructions = this.meshInstruction.multiSwitch;
        // get data from set
        let multiSwitchPackets = [];
        multiSwitchInstructions.forEach((instruction) => {
          if (instruction.crownstoneId !== undefined && instruction.timeout !== undefined && instruction.state !== undefined && instruction.intent !== undefined) {
            // get the longest timeout and use that
            multiSwitchPackets.push({crownstoneId: instruction.crownstoneId, timeout: instruction.timeout, intent: instruction.intent, state: instruction.state});
            this._containedInstructions.push(instruction);
          }
          else {
            LOG.error("MeshHelper: Invalid keepAlive instruction, required crownstoneId, timeout, state, intent. Got:", instruction);
          }
        });

        // update the used channels.
        LOG.mesh('MeshHelper: Dispatching ', 'multiSwitchPackets ', multiSwitchPackets);
        return BluenetPromiseWrapper.multiSwitch(multiSwitchPackets);
      }
    return null;
  }

  _handleSetSwitchStateCommands() {
      if (this.meshInstruction.setSwitchState.length > 0) {
        let switchStateInstructions = this.meshInstruction.setSwitchState;
        // get data from set
        let setSwitchPackets = [];
        switchStateInstructions.forEach((instruction) => {
          if (instruction.crownstoneId !== undefined && instruction.state !== undefined) {
            // get the longest timeout and use that
            setSwitchPackets.push({crownstoneId: instruction.crownstoneId, state: instruction.state});
            this._containedInstructions.push(instruction);
          }
          else {
            LOG.error("MeshHelper: Invalid meshCommandSetSwitchState instruction, required crownstoneId, state. Got:", instruction);
          }
        });

        // update the used channels.
        LOG.mesh('MeshHelper: Dispatching ', 'meshCommandSetSwitchState', setSwitchPackets);
        return BluenetPromiseWrapper.multiSwitch(setSwitchPackets);
      }
      return null;
  }

  _handleKeepAliveCommands() {
    if (this.meshInstruction.keepAliveState.length > 0) {
      let keepAliveInstructions = this.meshInstruction.keepAliveState;
      // get data from set
      let stoneKeepAlivePackets = [];
      let maxTimeout = 0;
      keepAliveInstructions.forEach((instruction) => {
        if (instruction.crownstoneId !== undefined && instruction.timeout !== undefined && instruction.state !== undefined && instruction.changeState !== undefined) {
          // get the longest timeout and use that
          maxTimeout = Math.max(maxTimeout, instruction.timeout);
          stoneKeepAlivePackets.push({crownstoneId: instruction.crownstoneId, action: instruction.changeState, state: instruction.state});
          this._containedInstructions.push(instruction);
        }
        else {
          LOG.error("MeshHelper: Invalid keepAlive instruction, required crownstoneId, timeout, state, changeState. Got:", instruction);
        }
      });

      // update the used channels.
      LOG.mesh('MeshHelper: Dispatching ', 'keepAliveState w timeout:',maxTimeout, 'packs:', stoneKeepAlivePackets);
      return BluenetPromiseWrapper.meshKeepAliveState(maxTimeout, stoneKeepAlivePackets);
    }

    if (this.meshInstruction.keepAlive.length > 0) {
      LOG.mesh('MeshHelper: Dispatching meshKeepAlive');

      // add the promise of this part of the payload to the list that we will need to resolve or reject when the mesh message is delivered.
      // these promises are loaded into the handler when load called.
      this.meshInstruction.keepAlive.forEach((instruction) => {
        this._containedInstructions.push( instruction.promise );
      });

      return BluenetPromiseWrapper.meshKeepAlive();
    }
    return null
  }


  _handleOtherCommands() {
    LOG.warn("Other commands are not implemented in the mesh yet.");
    return null
  }
}