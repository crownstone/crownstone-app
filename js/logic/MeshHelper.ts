import { BluenetPromiseWrapper } from '../native/Proxy';
import { LOG } from '../logging/Log'


export class MeshHelper {
  sphereId : any;
  meshNetworkId : any;
  meshInstruction : meshTodo;
  targets : any;
  _containedInstructions : any[] = [];

  constructor(sphereId, meshNetworkId, meshInstruction : meshTodo) {
    this.sphereId = sphereId;
    this.meshNetworkId = meshNetworkId;
    this.meshInstruction = meshInstruction;
  }

  performAction() {
    let actionPromise = null;

    if (actionPromise === null) { actionPromise = this._handleMultiSwitchCommands(); }
    if (actionPromise === null) { actionPromise = this._handleSetSwitchStateCommands(); }
    if (actionPromise === null) { actionPromise = this._handleKeepAliveStateCommands(); }
    if (actionPromise === null) { actionPromise = this._handleKeepAliveCommands(); }
    if (actionPromise === null) { actionPromise = this._handleOtherCommands(); }

    if (actionPromise === null) {
      return actionPromise;
    }

    // This will return a BluenetPromiseWrapper promise
    return actionPromise
      .then(() => {
        this._containedInstructions.forEach((instruction) => {
          instruction.promise.resolve();
          instruction.cleanup();
        })
      })
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
            instruction.promise.pending = true;
            this._containedInstructions.push(instruction);
          }
          else {
            LOG.error("MeshHelper: Invalid multiSwitchPackets instruction, required crownstoneId, timeout, state, intent. Got:", instruction);
          }
        });


        if (multiSwitchPackets.length === 0) {
          return null;
        }
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
        let crownstoneIds = [];
        let sharedState = null;
        for (let i = 0; i < switchStateInstructions.length; i++) {
          let instruction = switchStateInstructions[i];
          // if the payload has enough information to work with:
          if (instruction.crownstoneId !== undefined && instruction.state !== undefined && instruction.state !== null) {
            // we will try to collect all setSwitchStates in the same message as long as they have the same state that we need to set.
            // the sharedState is the state we will look for.
            if (sharedState === null) {
              sharedState = instruction.state;
            }

            if (sharedState === instruction.state) {
              crownstoneIds.push(instruction.crownstoneId);
              instruction.promise.pending = true;
              this._containedInstructions.push(instruction);
            }
          }
          else {
            LOG.error("MeshHelper: Invalid meshCommandSetSwitchState instruction, required crownstoneId, state. Got:", instruction);
          }
        }

        if (crownstoneIds.length === 0) {
          return null;
        }
        // update the used channels.
        LOG.mesh('MeshHelper: Dispatching meshCommandSetSwitchState to state', sharedState, crownstoneIds);
        return BluenetPromiseWrapper.meshCommandSetSwitchState(crownstoneIds, sharedState);
      }
      return null;
  }

  _handleKeepAliveStateCommands() {
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
          instruction.promise.pending = true;
          this._containedInstructions.push(instruction);
        }
        else {
          LOG.error("MeshHelper: Invalid keepAlive instruction, required crownstoneId, timeout, state, changeState. Got:", instruction);
        }
      });


      if (stoneKeepAlivePackets.length === 0) {
        return null;
      }
      // update the used channels.
      LOG.mesh('MeshHelper: Dispatching ', 'keepAliveState w timeout:',maxTimeout, 'packs:', stoneKeepAlivePackets);
      return BluenetPromiseWrapper.meshKeepAliveState(maxTimeout, stoneKeepAlivePackets);
    }

    return null;
  }

  _handleKeepAliveCommands() {
    if (this.meshInstruction.keepAlive.length > 0) {
      LOG.mesh('MeshHelper: Dispatching meshKeepAlive');

      // add the promise of this part of the payload to the list that we will need to resolve or reject when the mesh message is delivered.
      // these promises are loaded into the handler when load called.
      this.meshInstruction.keepAlive.forEach((instruction) => {
        instruction.promise.pending = true;
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