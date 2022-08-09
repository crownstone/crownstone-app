import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../Core";
import { LOGi } from "../../logging/Log";
import { BROADCAST_THROTTLE_TIME} from "../../ExternalConfig";
import { Scheduler } from "../Scheduler";
import { Bluenet } from "../../native/libInterface/Bluenet";
import { CONDITION_MAP } from "../../Enums";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { EventUtil } from "../../util/EventUtil";
import { SessionManager } from "./SessionManager";


export class BroadcastCommandManagerClass {

  queue : BleCommand<BroadcastInterface>[] = [];
  timeLastBroadcast = 0;
  clearPendingCommandCallback = null;

  itemsWaitingForExecute = {};
  lastExecution = 0;


  /**
   * This cleans up the stateful items in the class. Used for unit-testing.
   */
  reset() {
    this.queue = [];
    this.timeLastBroadcast = 0;
    this.clearPendingCommandCallback = null;
    this.itemsWaitingForExecute = {};
    this.lastExecution = 0;
  }

  broadcast(bleCommand : BleCommand<BroadcastInterface>, ignoreDuplicates = false) {
    LOGi.constellation("BroadcastCommandManager: Loading command for broadcast", JSON.stringify(bleCommand));
    
    if (SessionManager.isBlocked()) {
      bleCommand.promise.reject(new Error("SESSION_MANAGER_IS_CLAIMED"));
      LOGi.constellation("BroadcastCommandManager: Can not execute command because sessionManager is blocked", bleCommand.id);
      return;
    }


    if (!ignoreDuplicates) { this._checkforDuplicates(bleCommand); }

    // double check here, this api should be able to be used
    let throttling = this.handleThrottling(bleCommand);
    if (throttling) {
      return;
    }

    this._broadcast(bleCommand);
  }

  _checkPendingCommands() {
    if (this.clearPendingCommandCallback !== null) {
      this.clearPendingCommandCallback();
      this.clearPendingCommandCallback = null;
    }

    // can we broadcast now? If not, then schedule another check.
    if (this.shouldWaitForBroadcast() && this.queue.length > 0) {
      return this._setPendingCommandCheck();
    }

    if (this.queue.length > 0) {
      let activeElement = this.queue[0];
      let wrapup = () => {
        this.queue.shift();
        if (this.queue.length > 0) {
          this._setPendingCommandCheck();
        }
      }

      this.broadcast(activeElement, true);
      wrapup();
    }

  }

  _setPendingCommandCheck() {
    if (this.clearPendingCommandCallback === null) {
      this.clearPendingCommandCallback = Scheduler.scheduleCallback(
        () => { this.clearPendingCommandCallback = null; this._checkPendingCommands(); },
        BROADCAST_THROTTLE_TIME,
        "Loading Pending Command"
      );
    }
  }


  _broadcast(bleCommand: BleCommand<BroadcastInterface>) {
    let itemId = this._prepareForExecution(bleCommand);
    LOGi.constellation("BroadcastCommandManager: broadcasting", bleCommand.command.type, bleCommand.id);
    Scheduler.scheduleCallback(() => { bleCommand.promise.resolve(); }, 120, "auto resolve broadcast promise" );

    let stoneSummary  = MapProvider.stoneHandleMap[bleCommand.commandTarget];
    if (stoneSummary) {
      // ignore old states for a while
      // even though the broadcast is still awaiting execution, this is milliseconds, whereas this takes 2 seconds.
      core.eventBus.emit(EventUtil.getIgnoreTopic(stoneSummary.id), {
        timeoutMs: 2000,
        conditions: [{ type: CONDITION_MAP.SWITCH_STATE, expectedValue: 1 }]
      });
    }
    // broadcast
    bleCommand.command.broadcast(bleCommand)
      .then(() => {
        delete this.itemsWaitingForExecute[itemId];
        LOGi.constellation("BroadcastCommandManager: Successfully broadcast", bleCommand.command.type, bleCommand.id);
      })
      .catch((err) => {
        delete this.itemsWaitingForExecute[itemId];
        LOGi.constellation("BroadcastCommandManager: Error broadcasting", bleCommand.command.type, bleCommand.id, err?.message);
      })

    this.bumpExecutionChecker();
  }

  async bumpExecutionChecker() {
    let now = Date.now()
    this.lastExecution = now;

    await xUtil.nextTick();

    if (this.lastExecution === now) {
      this.execute();
    }
  }


  _prepareForExecution(bleCommand: BleCommand<BroadcastInterface>) {
    let itemId = xUtil.getShortUUID();
    this.itemsWaitingForExecute[itemId] = true;
    return itemId;
  }

  shouldWaitForBroadcast() {
    return Date.now() - this.timeLastBroadcast < BROADCAST_THROTTLE_TIME;
  }

  handleThrottling(bleCommand : BleCommand<BroadcastInterface>) : boolean {
    if (this.shouldWaitForBroadcast()) {
      LOGi.constellation("BroadcastCommandManager: Scheduling broadcast for later.", bleCommand.command.type, bleCommand.id);
      // if already a pending command check scheduled, we do not need to schedule another.
      this._setPendingCommandCheck();
      this.queue.push(bleCommand);
      return true;
    }
    return false;
  }

  _checkforDuplicates(commandSummary : BleCommand) {
    for (let i = this.queue.length-1; i >= 0; i--) {
      // only most recent command of any type will be broadcast
      if (commandSummary.commandTarget === this.queue[i].commandTarget) {
        if (commandSummary.command.isDuplicate(this.queue[i].command)) {
          LOGi.constellation("BroadcastCommandManager: Remove item from duplicate queue",i, this.queue[i].command.type, this.queue[i].id);
          // fail the pending item
          this.queue[i].promise.reject(new Error("BROADCAST_REMOVED_AS_DUPLICATE"));
          // remove from queue
          this.queue.pop();
        }
      }
    }
  }

  execute() {
    if (Object.keys(this.itemsWaitingForExecute).length > 0) {
      this.timeLastBroadcast = Date.now();
      Bluenet.broadcastExecute();
    }
  }
}


export const BroadcastCommandManager = new BroadcastCommandManagerClass();
