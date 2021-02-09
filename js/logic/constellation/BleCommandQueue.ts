import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { xUtil } from "../../util/StandAloneUtil";
import { Get } from "../../util/GetUtil";
import { BCH_ERROR_CODES } from "../../Enums";
import { BleCommandCleaner } from "./BleCommandCleaner";
import { Executor } from "./Executor";
import { SessionManager } from "./SessionManager";
import { LOG } from "../../logging/Log";
import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";


export const BleCommandLoader = {

  /**
   * This function will generate any number of required commands based on the commandOptions and the allowMeshRelays
   * boolean.
   * @param commandOptions
   * @param command
   * @param allowMeshRelays
   * @param promise
   */
  generateAndLoad(options: commandOptions, command: commandInterface, allowMeshRelays: boolean, promise : PromiseContainer) {
    let commandId = xUtil.getUUID();
    let bleCommand : BleCommand;


    // we use every field from the options excep the command targets. Each target in this list get an individual command.
    let usedOptions = {...options};
    delete usedOptions.commandTargets;

    let targets = options.commandTargets;

    for (let targetId of targets) {
      let sharedItems = {
        id: commandId,
        ...usedOptions,
        commandTarget: targetId,
        command,
        startTime: new Date().valueOf(),
        linkedId:  null,
        executedBy:   [],
        attemptingBy: []
      }
      switch (options.commandType) {
        case "MESH":
          bleCommand = { ...sharedItems, promise };
          break;
        case "MESH_RELAY":
          bleCommand = { ...sharedItems, promise };
          let handle = options.commandTargets[0];
          let meshId = MapProvider.handleMeshMap[handle];
          if (meshId) {
            let stoneData = MapProvider.stoneHandleMap[handle];
            if (stoneData) {
              let sphere = Get.sphere(stoneData.sphereId);
              if (sphere) {
                let amountOfStonesInSphere = Object.keys(sphere.stones).length - 1; // the minus 1 is because we already schedule a direct connection to the target crownstone.
                let relayBleCommand = {
                  ...sharedItems,

                  // changes for the mesh relay method.
                  id: xUtil.getUUID(),
                  linkedId: commandId,
                  minConnections: Math.min(3, amountOfStonesInSphere),
                  commandTarget: meshId,
                  endTarget: handle,
                  promise: {resolve: () => {}, reject: (err) => {}} // the promise resolves when the direct message is delivered. The success of the redundant messages is optional.
                };
                BleCommandQueue.load(relayBleCommand)
              }
            }

          }
          break;
        case "DIRECT":
          bleCommand = { ...sharedItems, promise };
          break;
      }

      BleCommandQueue.load(bleCommand);
    }
  }
}








/**
 * The command queue will keep a queue of ble commands that should be performed.
 * It will provide commands to slots when they request them. It will handle duplicates according to "Last command wins".
 * It will also have all intelligence on how to determine duplicate handling per command type.
 */
class BleCommandQueueClass {
  executePending: boolean = false;

  queue : CommandQueueMap = { direct: {}, mesh: {}};

  _removeDuplicates(command : BleCommand) {
    BleCommandCleaner.removeDuplicatesFromDirectQueue(command,this.queue);
    BleCommandCleaner.removeDuplicatesFromMeshQueue(command,this.queue);
  }

  load(command: BleCommand) {
    this._removeDuplicates(command);

    let targetId = command.commandTarget;
    switch (command.commandType) {
      case "MESH_RELAY":
        let meshId = MapProvider.handleMeshMap[targetId];
        if (meshId) {
          if (this.queue.mesh[meshId] === undefined) { this.queue.mesh[meshId] = []; }
          this.queue.mesh[targetId].push(command);
        }
        break;
      case "MESH":
        if (this.queue.mesh[targetId] === undefined) { this.queue.mesh[targetId] = []; }
        this.queue.mesh[targetId].push(command);
        break;
      case "DIRECT":
        if (this.queue.direct[targetId] === undefined) { this.queue.direct[targetId] = []; }
        this.queue.direct[targetId].push(command);
        break;
    }
  }


  /**
   * This will check all non-private commands and return if there are remaining commands for the requested handle.
   * If the private key is provided, only check commands corresponding to the private key.
   * @param handle
   */
  areThereCommandsFor(handle: string, privateKey: string | null = null) : boolean {
    let meshId   = MapProvider.handleMeshMap[handle] || null;
    let sphereId = MapProvider.stoneHandleMap[handle]?.sphereId;

    if (!sphereId) { return false; }

    if (privateKey) {
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.private && command.commanderId) {
            return true;
          }
        }
      }
    }
    else {
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.private === false) {
            return true;
          }
        }
      }
      else if (this.queue.mesh[meshId]) {
        let commands = this.queue.mesh[meshId];
        for (let command of commands) {
          if (command.executedBy.indexOf(handle) === -1 && command.attemptingBy.indexOf(handle) === -1) {
            return true;
          }
        }
      }
    }

    return false;
  }




  removeCommand(handle: string, commandId: string) {
    if (this.queue.direct[handle]) {
      for (let i = 0; i < this.queue.direct[handle].length; i++) {
        let command = this.queue.direct[handle][i];
        if (command.id === commandId) {
          this.queue.direct[handle].splice(i,1);
          if (this.queue.direct[handle].length === 0) {
            delete this.queue.direct[handle];
          }
          break;
        }
      }
    }

    let meshIds = Object.keys(this.queue.mesh);
    for (let meshId of meshIds) {
      let meshCommands = this.queue.mesh[meshId];
      // reverse iterate to be able to remove items from the array while iterating over it.
      for (let i = meshCommands.length-1; i >= 0; i--) {
        let meshCommand = meshCommands[i];
        if (meshCommand.id === commandId || meshCommand.linkedId === commandId) {
          this.queue.mesh[meshId].splice(i,1);
          if (this.queue.mesh[meshId].length === 0) {
            delete this.queue.mesh[meshId];
          }
        }
      }
    }
  }

  async _performCommand(handle: string, command: BleCommand) {
    // After running:
    //       - Move the attemptingBy for this handle to executedBy on success, clear the attemptingBy on failure.
    //       - Check all executedBy and match this against the minConnections requirement
    //       - Clean up the commands that have reached their goals.
    //       - If a command is cleaned, ask the SessionManager to re-evaluate their required sessions.
    //       - The goal is to close sessions that are still pending connections.

    let commandRemoved = false;
    try {
      let result = await Executor.runCommand(handle, command, this.queue);
      let attemptingIndex = command.attemptingBy.indexOf(handle)
      if (attemptingIndex !== -1 && command.executedBy.indexOf(handle) === -1) {
        command.executedBy.push(handle);
        command.attemptingBy.splice(attemptingIndex, 1);
      }
      if (command.commandType === 'DIRECT') {
        command.promise.resolve(result);
        this.removeCommand(handle, command.id);
        commandRemoved = true;
      }
      else if (command.executedBy.length >= command.minConnections) {
        command.promise.resolve(result);
        this.removeCommand(handle, command.id);
        commandRemoved = true;
      }

    }
    catch (err) {
      let attemptingIndex = command.attemptingBy.indexOf(handle)
      if (attemptingIndex !== -1 && command.executedBy.indexOf(handle) === -1) {
        command.attemptingBy.splice(attemptingIndex, 1);
      }

      if (command.commandType === 'DIRECT') {
        command.promise.reject(err);
        this.removeCommand(handle, command.id);
        commandRemoved = true;
      }
    }

    if (commandRemoved) {
      SessionManager.evaluateSessionNecessity()
    }

  }

  /**
   * A Session will ask for a task that it could perform on this handle. The private key is used to ensure we only get appropriate
   * private commands for a private connection. If this is not for a private connection, this is just left as null.
   *
   * This does never throw. On failure the promise will be rejected instead.
   * @param handle
   * @param privateId
   */
  async performCommand(handle: string, privateId: string | null = null) : Promise<void> {
    let meshId   = MapProvider.handleMeshMap[handle] || null;
    let sphereId = MapProvider.stoneHandleMap[handle]?.sphereId;

    if (!sphereId) { return; }

    if (privateId) {
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.private && command.commanderId === privateId) {
            this._performCommand(handle, command);
            break;
          }
        }
      }
    }
    else {
      // this is a shared connection
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.private === false) {
            this._performCommand(handle, command);
            break;
          }
        }
      }
      else if (this.queue.mesh[meshId]) {
        let commands = this.queue.mesh[meshId];
        for (let command of commands) {
          if (command.executedBy.indexOf(handle) === -1 && command.attemptingBy.indexOf(handle) === -1) {
            this._performCommand(handle, command);
            break;
          }
        }
      }
    }
  }


  async performClosingCommands(handle: string, privateId: string | null, crownstoneMode: CrownstoneMode) : Promise<void> {
    // this should determine if we need to put a set time or anything else before we close the connection.
    // the connection is closed by sending a disconnect command
    // Use the crownstone mode to determine if the disconnect command should be used.
    if (crownstoneMode === "operation") {
      if (privateId === null) {
        // TODO: check if we have to set the time.
        //  This will be done through checking with the TimeKeeper class.
        //  Work on this will be done after the TimeKeeper is using the Constellation API instead of the stoneUtil.
      }

      // tell the crownstone to disconnect from the phone.
      await BluenetPromiseWrapper.disconnectCommand(handle);
    }
  }
}

export const BleCommandQueue = new BleCommandQueueClass();
