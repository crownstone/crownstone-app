import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise';
import {LOG, LOGe, LOGi, LOGw} from '../logging/Log'
import { eventBus }              from "../util/EventBus";
import { conditionMap }          from "../native/advertisements/StoneEntity";
import {Util} from "../util/Util";


const MESH_PROPAGATION_TIMEOUT_MS = 8000;


export class MeshHelper {
  sphereId : any;
  meshNetworkId : any;
  meshInstruction : meshTodo;
  connectedStoneId : string;
  targets : any;
  _containedInstructions : any[] = [];
  activeOptions : batchCommandEntryOptions = {};

  constructor(sphereId, meshNetworkId, meshInstruction : meshTodo, connectedStoneId: string) {
    this.sphereId = sphereId;
    this.meshNetworkId = meshNetworkId;
    this.meshInstruction = meshInstruction;
    this.connectedStoneId = connectedStoneId;
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
          if (instruction.stoneId === this.connectedStoneId) {
            instruction.promise.resolve(result);
            instruction.cleanup();
          }
        })
      })
  }

  _verifyDirectTarget(commandArray) {
    for (let i = 0; i < commandArray.length; i++) {
      let command = commandArray[i];
      if (command.stoneId === this.connectedStoneId) {
        return true;
      }
    }
    LOGi.info("MeshHelper: No direct target in set, moving on.")
    return false;
  }


  _handleMultiSwitchCommands() {
    if (this.meshInstruction.multiSwitch.length > 0) {
      let multiSwitchInstructions : multiSwitchPayload[] = this.meshInstruction.multiSwitch;
      // get data from set
      let multiSwitchPackets = [];

      if (this._verifyDirectTarget(multiSwitchInstructions) === false) {
        return null;
      }

      for (let i = 0; i < multiSwitchInstructions.length; i++) {
        let instruction = multiSwitchInstructions[i]
        if (instruction.crownstoneId !== undefined && instruction.timeout !== undefined && instruction.state !== undefined && instruction.intent !== undefined) {
          multiSwitchPackets.push({crownstoneId: instruction.crownstoneId, timeout: instruction.timeout, intent: instruction.intent, state: instruction.state});
          instruction.promise.pending = true;
          MeshHelper._mergeOptions(instruction.options, this.activeOptions);
          this._containedInstructions.push(instruction);
        }
        else {
          LOGe.mesh("MeshHelper: Invalid multiSwitchPackets instruction, required crownstoneId, timeout, state, intent. Got:", instruction);
        }
      };

      if (multiSwitchPackets.length === 0) {
        return null;
      }

      // update the used channels.
      LOG.mesh('MeshHelper: Dispatching ', 'multiSwitchPackets ', multiSwitchPackets);
      return BluenetPromiseWrapper.multiSwitch(multiSwitchPackets)
        .then(() => {
          // log all the multiswitches
          for (let i = 0; i < multiSwitchInstructions.length; i++) {
            let command = multiSwitchInstructions[i];
            eventBus.emit("NEW_ACTIVITY_LOG", {
              command:     "multiswitch",
              commandUuid: command.commandUuid,
              connectedTo: this.connectedStoneId,
              target:      command.stoneId,
              timeout:     command.timeout,
              intent:      command.intent,
              state:       command.state,
              sphereId:    this.sphereId
            });
          }
        })
    }
    return null;
  }

  _handleKeepAliveStateCommands() {
    if (this.meshInstruction.keepAliveState.length > 0) {
      let keepAliveInstructions : keepAliveStatePayload[] = this.meshInstruction.keepAliveState;
      // get data from set
      let stoneKeepAlivePackets = [];
      let maxTimeout = 0;

      if (this._verifyDirectTarget(keepAliveInstructions) === false) {
        return null;
      }

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
          LOGe.mesh("MeshHelper: Invalid keepAlive instruction, required crownstoneId, timeout, state, changeState. Got:", instruction);
        }
      });


      if (stoneKeepAlivePackets.length === 0) {
        return null;
      }
      // update the used channels.
      LOG.mesh('MeshHelper: Dispatching ', 'keepAliveState w timeout:',maxTimeout, 'packs:', stoneKeepAlivePackets);
      return BluenetPromiseWrapper.meshKeepAliveState(maxTimeout, stoneKeepAlivePackets)
        .then(() => {
          keepAliveInstructions.forEach((command) => {
            eventBus.emit("NEW_ACTIVITY_LOG", {
              command:     "keepAliveState",
              commandUuid: command.commandUuid,
              connectedTo: this.connectedStoneId,
              target:      command.stoneId,
              timeout:     command.timeout,
              changeState: command.changeState,
              state:       command.state,
              sphereId:    this.sphereId
            });
          })
        })
    }

    return null;
  }

  _handleKeepAliveCommands() {
    if (this.meshInstruction.keepAlive.length > 0) {
      LOG.mesh('MeshHelper: Dispatching meshKeepAlive');

      if (this._verifyDirectTarget(this.meshInstruction.keepAlive) === false) {
        return null;
      }

      // add the promise of this part of the payload to the list that we will need to resolve or reject when the mesh message is delivered.
      // these promises are loaded into the handler when load called.
      this.meshInstruction.keepAlive.forEach((instruction : keepAlivePayload) => {
        instruction.promise.pending = true;
        MeshHelper._mergeOptions(instruction.options, this.activeOptions);
        this._containedInstructions.push( instruction );
      });

      return BluenetPromiseWrapper.meshKeepAlive()
        .then(() => {
          this.meshInstruction.keepAlive.forEach((command) => {
            eventBus.emit("NEW_ACTIVITY_LOG", {
              command:     "keepAlive",
              commandUuid: command.commandUuid,
              connectedTo: this.connectedStoneId,
              target:      command.stoneId,
              sphereId:    this.sphereId
            });
          })
        })
    }
    return null
  }


  _handleOtherCommands() {
    LOGw.mesh("Other commands are not implemented in the mesh yet.");
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
