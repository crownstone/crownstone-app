/**
 * The SessionBroker will provide a
 */
import { SessionManager } from "./SessionManager";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Collector } from "./Collector";

export class SessionBroker {

  handles : string[] = []

  options: commandOptions;
  requestedSessions : [] = [];

  pendingSessions : { [handle: string]: Promise<void> } = {};
  pendingCommands : { [commandId: string]: BleCommand } = {};

  constructor(commandOptions: commandOptions) {
    this.options = commandOptions;
  }


  loadPendingCommands(commands: BleCommand[]) {
    for (let command of commands) {
      this.pendingCommands[command.id] = command;
      command.promise.promise
        .then(() => {
          this.cleanup([command.id]); })
        .catch((err) => {
          this.cleanup([command.id]);
          throw err;
        })
    }
    this.evaluateSessions();
  }


  cleanup(commandIds: string[]) {
    for (let id of commandIds) {
      delete this.pendingCommands[id];
    }

    this.evaluateSessions();
  }


  evaluateSessions() {
    let commandIds = Object.keys(this.pendingCommands);
    let requiredHandleMap = {};

    for (let commandId of commandIds) {
      let command = this.pendingCommands[commandId];
      if (command.commandType === 'DIRECT') {
        let handle = command.commandTarget;
        requiredHandleMap[handle] = commandId;
        this.requireSession(handle, command);
      }
      else if (command.commandType === 'MESH') {
        let meshHandles = Collector.collectMesh(command.commandTarget, command.endTarget);
        for (let handle of meshHandles) {
          requiredHandleMap[handle] = commandId;
          this.requireSession(handle, command);
        }
      }
    }

    let openHandles = Object.keys(this.pendingSessions);
    for (let openHandle of openHandles) {
      if (requiredHandleMap[openHandle] === undefined) {
        SessionManager.revokeRequest(openHandle, this.options.commanderId);
        delete this.pendingSessions[openHandle];
      }
    }
  }


  requireSession(handle:string, command: BleCommand) {
    if (this.pendingSessions[handle] === undefined) {
      this.pendingSessions[handle] = SessionManager.request(handle, this.options.commanderId, command.private);
    }
  }

}
