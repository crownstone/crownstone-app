import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { xUtil } from "../../util/StandAloneUtil";
import { Get } from "../../util/GetUtil";
import { BCH_ERROR_CODES } from "../../Enums";
import { BleCommandCleaner } from "./BleCommandCleaner";
import { Executor } from "./Executor";
import { SessionManager } from "./SessionManager";
import { LOG, LOGi, LOGw } from "../../logging/Log";
import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";
import { BroadcastCommandManager } from "./BroadcastCommandManager";
import { ConstellationUtil } from "./util/ConstellationUtil";


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
    let usedOptions = {...options};
    delete usedOptions.commandTargets;

    let targets = options.commandTargets;

    let commandsToLoad = [];

    for (let targetId of targets) {
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
          let meshId = MapProvider.handleMeshMap[handle];
          if (meshId) {
            if (stoneData) {
              let sphere = Get.sphere(options.sphereId);
              if (sphere) {
                let stoneIdsInSphere = Object.keys(sphere.stones);
                let amountOfStonesInMesh = 0;
                for (let stoneId of stoneIdsInSphere) {
                  if (sphere.stones[stoneId].config.meshNetworkId === meshId) {
                    amountOfStonesInMesh++;
                  }
                }
                amountOfStonesInMesh -= 1; // the minus 1 is because we already schedule a direct connection to the target crownstone.

                let relayBleCommand : BleCommand = {
                  ...sharedItems,
                  // changes for the mesh relay method.
                  commandType: "MESH",
                  id: xUtil.getUUID(),
                  linkedId: commandId,
                  minConnections: Math.min(options.minConnections, amountOfStonesInMesh),
                  commandTarget: meshId,
                  endTarget: handle,
                  promise: xUtil.getPromiseContainer<any>()
                };
                commandsToLoad.push(relayBleCommand);
              }
            }
          }
        }
      }
      else if (options.commandType === "MESH") {
        // target is the meshId
        let sphere = Get.sphere(options.sphereId);
        if (sphere) {
          let stoneIdsInSphere = Object.keys(sphere.stones);
          let amountOfStonesInMesh = 0;
          for (let stoneId of stoneIdsInSphere) {
            if (sphere.stones[stoneId].config.meshNetworkId === targetId) {
              amountOfStonesInMesh++;
            }
          }

          let command : BleCommand = { ...sharedItems, promise };
          command.minConnections = Math.min(options.minConnections ?? 3, amountOfStonesInMesh);
          commandsToLoad.push(command);
        }
      }
    }

    for (let command of commandsToLoad) {
      this.load(command);
    }

    return commandsToLoad;
  }

  load(command: BleCommand) {
    this._removeDuplicates(command);

    let targetId = command.commandTarget;
    switch (command.commandType) {
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

          meshCommand.promise.resolve();
          if (this.queue.mesh[meshId].length === 0) {
            delete this.queue.mesh[meshId];
          }
        }
      }
    }
  }

  async _performCommand(handle: string, command: BleCommand) {
    // After running:
    //   1 - Move the attemptingBy for this handle to executedBy on success, clear the attemptingBy on failure.
    //   2 - Check all executedBy and match this against the minConnections requirement
    //   3 - Clean up the commands that have reached their goals.
    //   4 - If a command is cleaned, ask the SessionManager to re-evaluate their required sessions.
    //   5 - The goal is to close sessions that are still pending connections.

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

      console.log("attemptingBy", handle, command.commandType, command.attemptingBy, command.attemptingBy.length, command.minConnections)
      console.log("executedBy",   handle, command.commandType, command.executedBy, command.executedBy.length, command.minConnections)
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
      LOGw.constellation("BleCommandManager: Something went wrong while performing", command.command.type, handle, err, command.id);
      let attemptingIndex = command.attemptingBy.indexOf(handle)
      if (attemptingIndex !== -1 && command.executedBy.indexOf(handle) === -1) {
        command.attemptingBy.splice(attemptingIndex, 1);
      }

      if (command.commandType === 'DIRECT') {
        command.promise.reject(err);
        LOGw.constellation("BleCommandManager: Failing the direct command", command.command.type, handle, err, command.id);
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
            await this._performCommand(handle, command);
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
            await this._performCommand(handle, command);
            break;
          }
        }
      }
      else if (this.queue.mesh[meshId]) {
        let commands = this.queue.mesh[meshId];
        for (let command of commands) {
          if (command.executedBy.indexOf(handle) === -1 && command.attemptingBy.indexOf(handle) === -1) {
            await this._performCommand(handle, command);
            break;
          }
        }
      }
    }
  }



  cancelCommanderCommands(commanderId: string) {
    let directHandles = Object.keys(this.queue.direct);
    for (let handle of directHandles) {
      let commands = this.queue.direct[handle];
      // reverse iterate to be able to remove items from the array while iterating over it.
      for (let i = commands.length-1; i >= 0; i--) {
        let command = commands[i];
        if (command.commanderId === commanderId) {
          this.queue.direct[handle].splice(i,1);
          command.promise.reject("CANCELLED");

          if (this.queue.direct[handle].length === 0) {
            delete this.queue.direct[handle];
          }
        }
      }
    }

    let meshIds = Object.keys(this.queue.mesh);
    for (let meshId of meshIds) {
      let meshCommands = this.queue.mesh[meshId];
      // reverse iterate to be able to remove items from the array while iterating over it.
      for (let i = meshCommands.length-1; i >= 0; i--) {
        let meshCommand = meshCommands[i];
        if (meshCommand.commanderId === commanderId) {
          this.queue.mesh[meshId].splice(i,1);

          meshCommand.promise.reject("CANCELLED");
          if (this.queue.mesh[meshId].length === 0) {
            delete this.queue.mesh[meshId];
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

export const BleCommandManager = new BleCommandManagerClass();
