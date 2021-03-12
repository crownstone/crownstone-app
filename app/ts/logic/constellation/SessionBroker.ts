/**
 * The SessionBroker will provide a
 */
import { SessionManager } from "./SessionManager";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Collector } from "./Collector";
import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../core";

export class SessionBroker {

  handles : string[] = []

  options: commandOptions;

  _unsubscribeListeners = [];

  requestedSessions : [] = [];

  connectedSessions : { [handle: string]:    { id: string, private: boolean } } = {};
  pendingSessions   : { [handle: string]:    Promise<void> } = {};
  pendingCommands   : { [commandId: string]: BleCommand } = {};

  constructor(commandOptions: commandOptions) {
    this.options = commandOptions;
  }


  loadSession(handle: string, commandId: string = xUtil.getUUID(), privateSession: boolean = true) {
    this.connectedSessions[handle] = { id: xUtil.getUUID(), private: privateSession };
    this.addCleanupEventListener(handle);
  }

  addCleanupEventListener(handle) {
    this._unsubscribeListeners.push(core.eventBus.once(`SessionClosed_${handle}`, (privateId) => {
      delete this.connectedSessions[handle];
    }))
  }

  loadPendingCommands(commands: BleCommand[]) {
    for (let command of commands) {
      this.pendingCommands[command.id] = command;
      command.promise.promise
        .then(() => {
          this.cleanup([command.id]);
        })
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
      let handles = Object.keys(this.connectedSessions);
      for (let handle of handles) {
        let session = this.connectedSessions[handle];
        if (session.id == id && session.private == false) {
          delete this.connectedSessions[handle];
        }
      }
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
        if (this.options.private === false) {
          SessionManager.revokeRequest(openHandle, this.options.commanderId);
          delete this.pendingSessions[openHandle];
        }
      }
    }
  }


  async requireSession(handle:string, command: BleCommand) {
    if (this.pendingSessions[handle] === undefined && this.connectedSessions[handle] === undefined) {
      this.pendingSessions[handle] = SessionManager.request(handle, this.options.commanderId, command.private)
        .then(() => {
          // if this request lands, we can remove this session from the pending list.
          // //This means that the session won't be closed automatically
          // after command completion if its connected.
          delete this.pendingSessions[handle];
          this.connectedSessions[handle] = {id: command.id, private: command.private};

          this.addCleanupEventListener(handle);
        })
    }
  }


  async killConnectedSessions() {
    let connectedSessions = Object.keys(this.connectedSessions);
    for (let sessionHandle of connectedSessions) {
      await SessionManager.revokeRequest(sessionHandle, this.options.commanderId);
      delete this.connectedSessions[sessionHandle];
    }

    for (let unsubscriber of this._unsubscribeListeners) {
      unsubscriber();
    }
  }

}
