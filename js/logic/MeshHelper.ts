import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise';
import { LOG }                   from '../logging/Log'


export class MeshHelper {
  sphereId : any;
  meshNetworkId : any;
  meshInstruction : meshTodo;
  targets : any;
  _containedInstructions : any[] = [];
  activeOptions : batchCommandEntryOptions = {};

  constructor(sphereId, meshNetworkId, meshInstruction : meshTodo) {
    this.sphereId = sphereId;
    this.meshNetworkId = meshNetworkId;
    this.meshInstruction = meshInstruction;
  }

  performAction() {
    let actionPromise = null;

    if (actionPromise === null) { actionPromise = this._handleMultiSwitchCommands(); }
    if (actionPromise === null) { actionPromise = this._handleKeepAliveStateCommands(); }
    if (actionPromise === null) { actionPromise = this._handleKeepAliveCommands(); }
    if (actionPromise === null) { actionPromise = this._handleOtherCommands(); }

    if (actionPromise === null) {
      return actionPromise;
    }

    // This will return a BluenetPromiseWrapper promise
    return actionPromise
      .then((result) => {
        this._containedInstructions.forEach((instruction) => {
          instruction.promise.resolve(result);
          instruction.cleanup();
        })
      })
  }


  _handleMultiSwitchCommands() {
    if (this.meshInstruction.multiSwitch.length > 0) {
      let multiSwitchInstructions : multiSwitchPayload[] = this.meshInstruction.multiSwitch;
        // get data from set
        let multiSwitchPackets = [];
        multiSwitchInstructions.forEach((instruction : multiSwitchPayload) => {
          if (instruction.crownstoneId !== undefined && instruction.timeout !== undefined && instruction.state !== undefined && instruction.intent !== undefined) {
            // get the longest timeout and use that
            multiSwitchPackets.push({crownstoneId: instruction.crownstoneId, timeout: instruction.timeout, intent: instruction.intent, state: instruction.state});
            instruction.promise.pending = true;
            MeshHelper._mergeOptions(instruction.options, this.activeOptions);
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

  _handleKeepAliveStateCommands() {
    if (this.meshInstruction.keepAliveState.length > 0) {
      let keepAliveInstructions : keepAliveStatePayload[] = this.meshInstruction.keepAliveState;
      // get data from set
      let stoneKeepAlivePackets = [];
      let maxTimeout = 0;
      keepAliveInstructions.forEach((instruction : keepAliveStatePayload) => {
        if (instruction.crownstoneId !== undefined && instruction.timeout !== undefined && instruction.state !== undefined && instruction.changeState !== undefined) {
          // get the longest timeout and use that
          maxTimeout = Math.max(maxTimeout, instruction.timeout);
          stoneKeepAlivePackets.push({crownstoneId: instruction.crownstoneId, action: instruction.changeState, state: instruction.state});
          instruction.promise.pending = true;
          MeshHelper._mergeOptions(instruction.options, this.activeOptions);
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
      this.meshInstruction.keepAlive.forEach((instruction : keepAlivePayload) => {
        instruction.promise.pending = true;
        MeshHelper._mergeOptions(instruction.options, this.activeOptions);
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

  static _mergeOptions(newOptions, existingOptions) {
    existingOptions.keepConnectionOpen = newOptions.keepConnectionOpen || existingOptions.keepConnectionOpen;
    if (existingOptions.keepConnectionOpenTimeout === undefined) {
      existingOptions.keepConnectionOpenTimeout = newOptions.keepConnectionOpenTimeout
    }
    else if (newOptions.keepConnectionOpenTimeout !== undefined && existingOptions.keepConnectionOpenTimeout !== undefined) {
      existingOptions.keepConnectionOpenTimeout = Math.max(newOptions.keepConnectionOpenTimeout, existingOptions.keepConnectionOpenTimeout);
    }
  }
}
