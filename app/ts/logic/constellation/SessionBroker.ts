/**
 * The SessionBroker will provide a
 */
import { SessionManager } from "./SessionManager";

export class SessionBroker {

  handles : string[] = []

  options: commandOptions;
  requestedSessions : [] = []

  constructor(commandOptions: commandOptions) {
    this.options = commandOptions;
  }


  /**
   * This will place Session requests at the Session Manager.
   */
  source() {
    for (let handle of this.handles) {

    }
  }

}
