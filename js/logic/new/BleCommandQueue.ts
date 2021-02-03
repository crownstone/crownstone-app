interface CommandQueueMap {
  [sphereId : string] : {
    requirement: {
      type: "SPECIFIC" | "MESH" | "SPHERE"
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

  queue : CommandQueueMap;


  /**
   * A Session will ask for a task that it could perform on this handle. The private key is used to ensure we only get appropriate
   * private commands for a private connection. If this is not for a private connection, this is just left as null.
   * @param handle
   * @param privateKey
   */
  requestTask(handle, privateKey: string | null = null) : () => Promise<void> | null {
    // check direct commands for possible matches
    // check meshes for possible matches
    // check if it's about time for a suntimes/current time update
    return null
  }

  connectionFailed(handle : string, privateKey: string | null) {

  }

  connectionClosed(handle : string, privateKey: string | null) {

  }


  /**
   * Load a command into the queue
   * @param sphereId
   * @param commandType
   * @param identifier
   * @param command
   * @param promiseContainer
   */
  load(commandOptions: CommandOptions, command: commandInterface, promiseContainer) {

  }


  /**
   * This will check all non-private commands and return if there are remaining commands for the requested handle.
   * If the private key is provided, only check commands corresponding to the private key.
   * @param handle
   */
  areThereCommandsFor(handle: string, privateKey: string | null = null) : boolean {

    return false;
  }

  async runCommandOn(handle: string, privateKey: string | null = null) : Promise<void> {

  }

  async performClosingCommands(handle: string, privateKey: string | null, crownstoneMode: CrownstoneMode) : Promise<void> {
    // this should determine if we need to put a set time or anything else before we close the connection.
    // the connection is closed by sending a disconnect command
    // Use the crownstone mode to determine if the disconnect command should be used.
  }


}

export const BleCommandQueue = new BleCommandQueueClass();
