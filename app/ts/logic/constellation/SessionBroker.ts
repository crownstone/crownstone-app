/**
 * The SessionBroker will provide a
 */
import { SessionManager } from "./SessionManager";
import { Collector } from "./Collector";
import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../Core";
import { LOGd, LOGe, LOGi, LOGw } from "../../logging/Log";
import { BleCommandManager } from "./BleCommandManager";
import { Testing } from "../../util/Testing";

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

  /**
   * This is usually the starting point of the broker from the commander.
   * If this is a direct connection, the first call is loadSession.
   *
   * All commands from the commander are passed through this.
   *
   * The commands are already loaded into the BleCommandManager, ready to be used by sessions.
   * This method will request these sessions from the SessionManager.
   * @param commands
   */
  loadPendingCommands(commands: BleCommand[]) {
    for (let command of commands) {
      this.pendingCommands[command.id] = command;
      // This promise handler will not halt the propagation of the error.
      // This promise chain is parallel to the one that is returned by the commander.
      // The one returned to the commander will be propagated to the user, this one is here to clean up the broker.
      // This is not done via a .finally to ensure that any errors will be handled.
      let handled = false;
      command.promise.promise
        .then(() => {
          LOGi.constellation("SessionBroker: Command finished.", command.id, this.options.commanderId);
          handled = true;
          this.cleanup([command.id]);
        })
        .catch((err) => {
          // If the cleanup throws an error in the .then, do not do it again.
          if (!handled) { this.cleanup([command.id]); }
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

    this.evaluateSessions(false);
  }


  /**
   * This method will go through all pending commands and determine which Sessions are required to fulfill those commands.
   * These sessions will be requested to the SessionManager.
   *
   * If commands have either finished or failed, this method will cancel any pending sessions that were requested to fulfill the finalized command.
   * Since this method is also used as part of the cleanup process, the boolean requestNewSessions is used to avoid re-requesting sessions.
   */
  evaluateSessions(requestNewSessions = true) {
    let commandIds = Object.keys(this.pendingCommands);
    let requiredHandleMap = {};

    for (let commandId of commandIds) {
      let command = this.pendingCommands[commandId];
      if (command.commandType === 'DIRECT') {
        let handle = command.commandTarget;
        requiredHandleMap[handle] = commandId;
        if (requestNewSessions) {
          LOGd.constellation("SessionBroker: requiring session", handle, "DIRECT for commander", this.options.commanderId, "and command", command.command.type);
          this.requireSession(handle, command);
        }
      }
      else if (command.commandType === 'MESH') {
        let meshHandles = Collector.collectSphere(command.commandTarget, command.endTarget);
        for (let handle of meshHandles) {
          requiredHandleMap[handle] = commandId;
          if (requestNewSessions) {
            LOGd.constellation("SessionBroker: requiring session", handle, "MESH for commander", this.options.commanderId, "and command", command.command.type);
            this.requireSession(handle, command);
          }
        }
      }
    }

    let openSessionHandles = Object.keys(this.pendingSessions);
    for (let openHandle of openSessionHandles) {
      if (requiredHandleMap[openHandle] === undefined) {
        if (this.options.private === false) {
          LOGi.constellation("SessionBroker: Revoke session", openHandle, "for", this.options.commanderId);
          SessionManager.revokeRequest(openHandle, this.options.commanderId)
          delete this.pendingSessions[openHandle];
        }
      }
    }
  }


  async requireSession(handle:string, command: BleCommand) {
    if (!handle) { return; }

    if (this.pendingSessions[handle] === undefined && this.connectedSessions[handle] === undefined) {
      LOGi.constellation("SessionBroker: actually requesting session", handle, "for", this.options.commanderId, "private", command.private, "commandType", command.command.type);
      this.pendingSessions[handle] = SessionManager.request(handle, this.options.commanderId, command.private, this.options.timeout)
        .then(() => {
          LOGi.constellation("SessionBroker: Session has connected to", handle, "for", this.options.commanderId);
          // if this request lands, we can remove this session from the pending list.
          // This means that the session won't be closed automatically after command completion if its connected.
          delete this.pendingSessions[handle];
          this.connectedSessions[handle] = {id: command.id, private: command.private};

          this.addCleanupEventListener(handle);
        })
        .catch((err) => {
          delete this.pendingSessions[handle];
          if (err?.message === "SESSION_REQUEST_TIMEOUT") {
            LOGi.constellation("SessionBroker: Session failed to connect: SESSION_REQUEST_TIMEOUT", handle, "for", this.options.commanderId);
            BleCommandManager.removeCommand(handle, command.id, "SESSION_REQUEST_TIMEOUT");
          }
          else if (err?.message === "ALREADY_REQUESTED_TIMEOUT") {
            LOGe.constellation("SessionBroker: Require session has thrown an ALREADY_REQUESTED_TIMEOUT error.", handle, this.options.commanderId);
            Testing.hook("ALREADY_REQUESTED_TIMEOUT", {handle, type: command.command.type} );
          }
          else if (err?.message === "REMOVED_FROM_QUEUE") {
            LOGi.constellation("SessionBroker: Session removed from queue", handle, "for", this.options.commanderId);
            // this will happen if a session is no longer required. This does not need to be escalated.
          }
          else {
            LOGw.constellation("SessionBroker: Failed to request session", handle, "for", this.options.commanderId, err);
            throw err;
          }
        })
    }
    else {
      LOGd.constellation("SessionBroker: Session request to", handle, "for", this.options.commanderId, " is already pending... commandType", command.command.type);
    }
  }

  async killConnectedSessions() {
    LOGi.constellation("SessionBroker: Killing sessions for", this.options.commanderId);
    let connectedSessions = Object.keys(this.connectedSessions);
    for (let sessionHandle of connectedSessions) {
      LOGi.constellation("SessionBroker: Revoke session for kill", sessionHandle, "for", this.options.commanderId);
      await SessionManager.revokeRequest(sessionHandle, this.options.commanderId).catch((err) => {
        if (err?.message !== "REMOVED_FROM_QUEUE") {
          LOGw.constellation("SessionBroker: Failed to request session", sessionHandle, "for", this.options.commanderId, err);
        }
      })
      delete this.connectedSessions[sessionHandle];
    }

    for (let unsubscriber of this._unsubscribeListeners) {
      unsubscriber();
    }
    this._unsubscribeListeners = [];
  }

  async disconnectSession() {
    let connectedSessions = Object.keys(this.connectedSessions);
    for (let sessionHandle of connectedSessions) {
      LOGi.constellation("SessionBroker: Disconnecting session to", sessionHandle, "for", this.options.commanderId);
      await SessionManager.disconnectSession(sessionHandle, this.options.commanderId);
    }
  }

}
