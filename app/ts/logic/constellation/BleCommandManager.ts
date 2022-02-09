import { MapProvider }             from "../../backgroundProcesses/MapProvider";
import { xUtil }                   from "../../util/StandAloneUtil";
import { Get }                     from "../../util/GetUtil";
import { BleCommandCleaner }       from "./BleCommandCleaner";
import { Executor }                from "./Executor";
import { SessionManager }          from "./SessionManager";
import { LOGd, LOGi, LOGv, LOGw }  from "../../logging/Log";
import { BluenetPromiseWrapper }   from "../../native/libInterface/BluenetPromise";
import { BroadcastCommandManager } from "./BroadcastCommandManager";
import { ConstellationUtil }       from "./util/ConstellationUtil";
import { TimeKeeper }              from "../../backgroundProcesses/TimeKeeper";
import { Scheduler }               from "../Scheduler";


/**
 * The command queue will keep a queue of ble commands that should be performed.
 * It will provide commands to slots when they request them. It will handle duplicates according to "Last command wins".
 * It will also have all intelligence on how to determine duplicate handling per command type.
 */
export class BleCommandManagerClass {
  queue : CommandQueueMap = { direct: {}, mesh: {}};

  reset() {
    this.queue = { direct: {}, mesh: {}};
  }

  _removeDuplicates(command : BleCommand) {
    BleCommandCleaner.removeDuplicatesFromDirectQueue(command,this.queue);
    BleCommandCleaner.removeDuplicatesFromMeshQueue(command,this.queue);
  }

  /**
   * This method will load the appropriate commands into the queue.
   * @param commandOptions
   * @param command
   * @param allowMeshRelay
   * @param promise
   */
  generateAndLoad(options: commandOptions, command: CommandInterface, allowMeshRelay: boolean, promise : PromiseContainer<any>) {
    let commandId = xUtil.getUUID();

    // we use every field from the options excep the command targets. Each target in this list get an individual command.
    let usedOptions : commandOptions = {...options};
    delete usedOptions.commandTargets;

    if (options.commandType === "BROADCAST") {
      if (command.canBroadcast !== true) {
        promise.reject(new Error("TRIED_TO_BROADCAST_INVALID_COMMAND"))
        return;
      }

      let bleCommand : BleCommand = {
        id: commandId,
        minConnections: options.minConnections,
        ...usedOptions,
        commandTarget: "BROADCAST",
        command,
        startTime: new Date().valueOf(),
        linkedId:  null,
        executedBy:   [],
        attemptingBy: [],
        promise
      };
      BroadcastCommandManager.broadcast(bleCommand as BleCommand<BroadcastInterface>)

      return;
    }

    let targets = options.commandTargets;
    let commandsToLoad = [];

    for (let targetId of targets) {
      // if the handle is missing, do not create a command. If no commands are created at all, error is thrown below.
      if (!targetId) { continue; }

      let sharedItems = {
        id: commandId,
        minConnections: options.minConnections,
        ...usedOptions,
        commandTarget: targetId,
        command,
        startTime: new Date().valueOf(),
        linkedId:  null,
        executedBy:   [],
        attemptingBy: []
      }

      if (options.commandType === 'DIRECT') {
        let bleCommand : BleCommand = { ...sharedItems, promise };
        let handle = targetId;
        let stoneData = MapProvider.stoneHandleMap[handle];
        if (stoneData) {
          if (command.canBroadcast && ConstellationUtil.canBroadcast(stoneData.stone)) {
            BroadcastCommandManager.broadcast(bleCommand as BleCommand<BroadcastInterface>)
            return;
          }
        }

        // load the direct command.
        commandsToLoad.push(bleCommand);

        // possibly load extra mesh relays
        if (allowMeshRelay) {
          // The depending on the mesh id is removed. The phone does not accurately know the topology.
          // - we will generate an additional command for each mesh network in the sphere.
          if (stoneData) {
            let sphere = Get.sphere(options.sphereId);
            if (sphere) {
              let stoneIdsInSphere = Object.keys(sphere.stones);
              let amountOfStonesInMesh = 0;
              for (let stoneId of stoneIdsInSphere) {
                if (sphere.stones[stoneId].config.handle === targetId) { continue; }
                amountOfStonesInMesh++;
              }

              let relayBleCommand : BleCommand = {
                ...sharedItems,
                // changes for the mesh relay method.
                commandType: "MESH",
                id: xUtil.getUUID(),
                linkedId: commandId,
                minConnections: Math.min(options.minConnections || 3, amountOfStonesInMesh),
                commandTarget: options.sphereId,
                endTarget: handle,
                promise: xUtil.getPromiseContainer<any>()
              };
              commandsToLoad.push(relayBleCommand);
            }
          }
        }
      }
      else if (options.commandType === "MESH") {
        let sphere = Get.sphere(options.sphereId);
        if (sphere) {
          let stoneIdsInSphere = Object.keys(sphere.stones);
          let amountOfStonesInMesh = 0;
          for (let stoneId of stoneIdsInSphere) {
              amountOfStonesInMesh++;
          }

          let command : BleCommand = { ...sharedItems, promise };
          command.minConnections = Math.min(options.minConnections || 3, amountOfStonesInMesh);
          commandsToLoad.push(command);
        }
      }
    }

    for (let command of commandsToLoad) {
      this._load(command);
    }

    if (commandsToLoad.length === 0) {
      throw new Error("NO_COMMANDS_TO_LOAD_OR_INVALID_TARGETS");
    }

    return commandsToLoad;
  }

  _load(command: BleCommand) {
    this._removeDuplicates(command);

    LOGi.constellation("BleCommandManager: Loading command", JSON.stringify(command));

    let targetId = command.commandTarget;
    let index;
    switch (command.commandType) {
      case "MESH":
        if (this.queue.mesh[targetId] === undefined) { this.queue.mesh[targetId] = []; }
        this.queue.mesh[targetId].push(command);
        index = this.queue.mesh[targetId].length - 1;

        command.removeTimeout = Scheduler.scheduleCallback(() => {
          LOGi.constellation("BleCommandManager: Removing Mesh command due to timeout", targetId, command.id, command.commanderId);
          this._removeMeshCommand(targetId,index,"COMMAND_TIMEOUT");
          SessionManager.evaluateSessionNecessity();
        }, command.timeout*1000 + 5000);

        break;
      case "DIRECT":
        if (this.queue.direct[targetId] === undefined) { this.queue.direct[targetId] = []; }
        this.queue.direct[targetId].push(command);
        index = this.queue.direct[targetId].length - 1;

        command.removeTimeout = Scheduler.scheduleCallback(() => {
          LOGi.constellation("BleCommandManager: Removing Direct command due to timeout", targetId, command.id, command.commanderId);
          this._removeDirectCommand(targetId,index,"COMMAND_TIMEOUT");
          SessionManager.evaluateSessionNecessity();
        }, command.timeout*1000 + 5000);

        break;
    }


  }


  /**
   * This will check all non-private commands and return if there are remaining commands for the requested handle.
   * If the private key is provided, only check commands corresponding to the private key.
   *
   * It will return either false or the commandId of the command that can be performed.
   * @param handle
   */
  areThereCommandsFor(handle: string, privateKey: string | null = null) : string | null {
    let command = this.getCommandFor(handle, privateKey);
    if (command) {
      return command.id;
    }
    return null;
  }


  _getMeshCommands(sphereId) {
    let commandsSphereId = this.queue.mesh[sphereId] || [];
    return commandsSphereId;
  }


  removeCommand(handle: string, commandId: string, errorMessage = null) {
    if (this.queue.direct[handle]) {
      for (let i = 0; i < this.queue.direct[handle].length; i++) {
        let command = this.queue.direct[handle][i];
        if (command.id === commandId) {
          this._removeDirectCommand(handle, i, errorMessage);
          break;
        }
      }
    }


    for (let meshId in this.queue.mesh) {
      let meshCommands = this.queue.mesh[meshId];
      // reverse iterate to be able to remove items from the array while iterating over it.
      for (let i = meshCommands.length-1; i >= 0; i--) {
        let meshCommand = meshCommands[i];
        if (meshCommand.id === commandId || meshCommand.linkedId === commandId) {
          this._removeMeshCommand(meshId, i, errorMessage);
        }
      }
    }
  }

  async _performCommand(handle: string, command: BleCommand) : Promise<string> {
    // After running:
    //   1 - Move the attemptingBy for this handle to executedBy on success, clear the attemptingBy on failure.
    //   2 - Check all executedBy and match this against the minConnections requirement
    //   3 - Clean up the commands that have reached their goals.
    //   4 - If a command is cleaned, ask the SessionManager to re-evaluate their required sessions.
    //   5 - The goal is to close sessions that are still pending connections.
    let errorDuringCommand = null;
    let errorWasThrown = false;
    let commandRemoved = false;
    try {
      // mark this handle as something that is attempting this command.
      command.attemptingBy.push(handle);

      // start performing the command.
      LOGi.constellation("BleCommandManager: Performing command", command.command.type, "on", handle, command.id);
      let result = await Executor.runCommand(handle, command, this.queue);
      LOGi.constellation("BleCommandManager: Succeeded command", command.command.type, "on", handle, command.id);
      let attemptingIndex = command.attemptingBy.indexOf(handle)

      // move attempingby to executed by.
      if (attemptingIndex !== -1 && command.executedBy.indexOf(handle) === -1) {
        command.executedBy.push(handle);
        command.attemptingBy.splice(attemptingIndex, 1);
      }

      if (command.commandType === 'DIRECT') {
        LOGi.constellation("BleCommandManager: Direct command finished.", handle, command.command.type, command.id);
        command.promise.resolve(result);
        this.removeCommand(handle, command.id);
        commandRemoved = true;
      }
      else if (command.executedBy.length >= command.minConnections) {
        LOGi.constellation("BleCommandManager: Mesh command finished.", command.minConnections, "connections achieved.", command.command.type, command.id);
        // mesh action
        command.promise.resolve(result);
        this.removeCommand(handle, command.id);
        commandRemoved = true;
      }
    }
    catch (err) {
      errorWasThrown = true;
      errorDuringCommand = err;
      LOGw.constellation("BleCommandManager: Something went wrong while performing", command.command.type, handle, err?.message, command.id);
      let attemptingIndex = command.attemptingBy.indexOf(handle)
      if (attemptingIndex !== -1 && command.executedBy.indexOf(handle) === -1) {
        command.attemptingBy.splice(attemptingIndex, 1);
      }

      if (command.commandType === 'DIRECT') {
        command.promise.reject(err);
        LOGw.constellation("BleCommandManager: Failing the direct command", command.command.type, handle, err?.message, command.id);
        this.removeCommand(handle, command.id);
        commandRemoved = true;
      }
      else if (command.commandType === 'MESH') {
        // if the error is NOT not_connected,
        if (err?.message !== "NOT_CONNECTED") {
          command.promise.reject(err);
          LOGw.constellation("BleCommandManager: Failing the mesh command", command.command.type, handle, err?.message, command.id);
          // if this is a mesh relay, we have to fail the initial promise. The handle of the endTarget will handle the direct command.
          if (command.endTarget) {
            LOGw.constellation("BleCommandManager: Failing the original direct command", command.command.type,  handle, err?.message, command.id, "Source:", command.endTarget, command.linkedId);
            this.removeCommand(command.endTarget, command.linkedId, err);
          }
          // we always have to remove the mesh commands.
          this.removeCommand(handle, command.id, err);

          commandRemoved = true;
        }
      }
    }

    if (commandRemoved) {
      SessionManager.evaluateSessionNecessity()
    }

    // escalate this error to the caller.
    if (errorWasThrown) {
      LOGw.constellation("BleCommandManager: Escalating error", command.command.type, handle, errorDuringCommand?.message, command.id);
      throw errorDuringCommand;
    }

    return command.id;
  }

  getCommandFor(handle: string, privateId: string | null = null) : BleCommand | null {
    let sphereId = MapProvider.stoneHandleMap[handle]?.sphereId;

    LOGv.constellation(`BleCommandManager.getCommandFor ${handle} ${privateId} checking sphereId ${sphereId}`);

    if (privateId) {
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.private && command.commanderId) {
            return command;
          }
        }
      }
    }
    else {
      let meshCommands = this._getMeshCommands(sphereId);

      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.private === false) {
            return command;
          }
        }
      }
      else if (meshCommands.length > 0) {
        for (let command of meshCommands) {
          if (command.executedBy.indexOf(handle) === -1 && command.attemptingBy.indexOf(handle) === -1) {
            return command;
          }
        }
      }
    }

    LOGd.constellation(`BleCommandManager: no command available for ${handle},${privateId}`);
    return null;
  }


  /**
   * A Session will ask for a task that it could perform on this handle. The private key is used to ensure we only get appropriate
   * private commands for a private connection. If this is not for a private connection, this is just left as null.
   *
   * This does never throw. On failure the promise will be rejected instead.
   * @param handle
   * @param privateId
   */
  async performCommand(handle: string, privateId: string | null = null) : Promise<string> {
    let command = this.getCommandFor(handle, privateId);
    if (command) {
      return await this._performCommand(handle, command);
    }
    return "NO_COMMAND_TO_PERFORM";
  }



  cancelCommanderCommands(commanderId: string, errorMessage: string = "CANCELLED") {
    let directHandles = Object.keys(this.queue.direct);
    for (let handle of directHandles) {
      let commands = this.queue.direct[handle];
      // reverse iterate to be able to remove items from the array while iterating over it.
      for (let i = commands.length-1; i >= 0; i--) {
        let command = commands[i];
        if (command.commanderId === commanderId) {
          this._removeDirectCommand(handle, i, errorMessage);
        }
      }
    }

    for (let meshId in this.queue.mesh) {
      let meshCommands = this.queue.mesh[meshId];
      // reverse iterate to be able to remove items from the array while iterating over it.
      for (let i = meshCommands.length-1; i >= 0; i--) {
        let meshCommand = meshCommands[i];
        if (meshCommand.commanderId === commanderId) {
          this._removeMeshCommand(meshId, i, errorMessage);
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
        if (Date.now() - TimeKeeper.lastTimeSet > 3600000) {
          await BluenetPromiseWrapper.setTime(handle, xUtil.nowToCrownstoneTime())
            .then(() => { TimeKeeper.lastTimeSet = Date.now(); })
            .catch((err) => {})
        }
      }
    }
  }




  // Util methods

  _removeDirectCommand(handle : string, index: number, errorMessage : string | null = null) {
    let command = this.queue.direct[handle]?.[index];
    if (!command) { return; }

    this.queue.direct[handle].splice(index,1);

    if (command.removeTimeout) { command.removeTimeout() }

    LOGi.constellation("BleCommandManager: Removing command", handle, command.id, errorMessage);

    if (errorMessage !== null) {
      command.promise.reject(new Error(errorMessage))
    }
    if (this.queue.direct[handle].length === 0) {
      delete this.queue.direct[handle];
    }
  }

  _removeMeshCommand(meshId: string, index: number, errorMessage: string | null = null) {
    let meshCommand = this.queue.mesh[meshId]?.[index];
    if (!meshCommand) { return; }

    this.queue.mesh[meshId].splice(index,1);

    if (meshCommand.removeTimeout) { meshCommand.removeTimeout() }

    LOGi.constellation("BleCommandManager: Removing mesh command", meshId, meshCommand.id, errorMessage);

    // if this remove is called because of an error, reject all promises
    if (errorMessage !== null) {
      meshCommand.promise.reject(new Error(errorMessage));
    }
    else {
      // if it is not called because of an error, expect the command to have been successful.
      meshCommand.promise.resolve();
    }
    if (this.queue.mesh[meshId].length === 0) {
      delete this.queue.mesh[meshId];
    }
  }

}

export const BleCommandManager = new BleCommandManagerClass();
