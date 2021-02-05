import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { xUtil } from "../../util/StandAloneUtil";
import { Get } from "../../util/GetUtil";


class BleCommandLoaderClass {

  /**
   * This function will generate any number of required commands based on the commandOptions and the allowMeshRelays
   * boolean.
   * @param commandOptions
   * @param command
   * @param allowMeshRelays
   * @param promise
   */
  generate(options: commandOptions, command: commandInterface, allowMeshRelays: boolean, promise : PromiseContainer) {
    let commandId = xUtil.getUUID();
    let bleCommand : BleCommand;
    switch (options.commandType) {
      case "SPHERE":
        bleCommand = { id: commandId, linkedId: null, options, command, promise, executedBy: [] };
        break;
      case "MESH":
        bleCommand = { id: commandId, linkedId: null, options, command, promise, executedBy: [] };
        break;
      case "MESH_RELAY":
        bleCommand = { id: commandId, linkedId: null, options, command, promise, executedBy: [] };
        let handle = options.commandTargets[0];
        let meshId = MapProvider.handleMeshMap[handle];
        if (meshId) {
          let stoneData = MapProvider.stoneHandleMap[handle];
          if (stoneData) {
            let sphere = Get.sphere(stoneData.sphereId);
            if (sphere) {
              let amountOfStonesInSphere = Object.keys(sphere.stones).length - 1; // the minus 1 is because we already schedule a direct connection to the target crownstone.
              let relayBleCommand = {
                id: xUtil.getUUID(),
                linkedId: commandId,
                options: {...options, minConnections: Math.min(3, amountOfStonesInSphere), commandTargets:[meshId], endTarget: handle},
                command,
                promise,
                executedBy: []
              };
              BleCommandQueue.load(relayBleCommand)
            }
          }

        }
        break;
      case "DIRECT":
        bleCommand = { id: commandId, linkedId: null, options, command, promise, executedBy: [] };
        break;
    }

    BleCommandQueue.load(bleCommand);
  }

}

export const BleCommandLoader = new BleCommandLoaderClass();







/**
 * The command queue will keep a queue of ble commands that should be performed.
 * It will provide commands to slots when they request them. It will handle duplicates according to "Last command wins".
 * It will also have all intelligence on how to determine duplicate handling per command type.
 */
class BleCommandQueueClass {
  executePending: boolean = false;

  queue : CommandQueueMap = { direct: {}, mesh: {}, sphere: {} };

  load(command: BleCommand) {
    //TODO: check for duplicates

    let targets = command.options.commandTargets;
    for (let targetId of targets) {
      switch (command.options.commandType) {
        case "SPHERE":
          if (this.queue.sphere[targetId] === undefined) { this.queue.sphere[targetId] = []; }
          this.queue.sphere[targetId].push(command);
          break;
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
  }


  /**
   * This will check all non-private commands and return if there are remaining commands for the requested handle.
   * If the private key is provided, only check commands corresponding to the private key.
   * @param handle
   */
  areThereCommandsFor(handle: string, privateKey: string | null = null) : boolean {
    let meshId   = MapProvider.handleMeshMap[handle] || null;
    let sphereId = MapProvider.stoneHandleMap[handle]?.sphereId;

    if (!sphereId) { return null; }

    if (privateKey) {
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.options.private && command.options.commanderId) {
            return true;
          }
        }
      }
    }
    else {
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.options.private === false) {
            return true;
          }
        }
      }
      else if (this.queue.mesh[meshId]) {
        let commands = this.queue.mesh[meshId];
        for (let command of commands) {
          if (command.executedBy.indexOf(handle) === -1) {
            return true;
          }
        }
      }
      else if (this.queue.sphere[sphereId]) {
        let commands = this.queue.sphere[meshId];
        for (let command of commands) {
          if (command.executedBy.indexOf(handle) === -1) {
            return true;
          }
        }
      }
    }

    return false;
  }


  /**
   * A Session will ask for a task that it could perform on this handle. The private key is used to ensure we only get appropriate
   * private commands for a private connection. If this is not for a private connection, this is just left as null.
   *
   * This does never throw. On failure the promise will be rejected instead.
   * @param handle
   * @param privateKey
   */
  async performCommand(handle: string, privateKey: string | null = null) : Promise<void> {
    let meshId   = MapProvider.handleMeshMap[handle] || null;
    let sphereId = MapProvider.stoneHandleMap[handle]?.sphereId;

    if (!sphereId) { return; }

    if (privateKey) {
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.options.private && command.options.commanderId) {
            //TODO: run command;
          }
        }
      }
    }
    else {
      if (this.queue.direct[handle]) {
        let commands = this.queue.direct[handle];
        for (let command of commands) {
          if (command.options.private === false) {
            //TODO: run command;
          }
        }
      }
      else if (this.queue.mesh[meshId]) {
        let commands = this.queue.mesh[meshId];
        for (let command of commands) {
          if (command.executedBy.indexOf(handle) === -1) {
             // TODO: run command
          }
        }
      }
      else if (this.queue.sphere[sphereId]) {
        let commands = this.queue.sphere[handle];
        for (let command of commands) {
          if (command.executedBy.indexOf(handle) === -1) {
          // TODO: run command
          }
        }
      }
    }

    // TODO: After running:
    //       Move the attemptingBy for this handle to executedBy on success, clear the attemptingBy on failure.
    //       Check all executedBy and match this against the minConnections requirement
    //       Clean up the commands that have reached their goals.
    //       If a command is cleaned, ask the SessionManager to re-evaluate their required sessions.
    //       The goal is to close sessions that are still pending connections.
  }


  async performClosingCommands(handle: string, privateKey: string | null, crownstoneMode: CrownstoneMode) : Promise<void> {
    // this should determine if we need to put a set time or anything else before we close the connection.
    // the connection is closed by sending a disconnect command
    // Use the crownstone mode to determine if the disconnect command should be used.


    // check direct commands for possible matches
    // check meshes for possible matches
    // check if it's about time for a suntimes/current time update
    return null;
  }
}

export const BleCommandQueue = new BleCommandQueueClass();
