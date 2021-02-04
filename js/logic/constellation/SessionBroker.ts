/**
 * The SessionBroker will provide a
 */
import { SessionManager } from "./SessionManager";

export class SessionBroker {

  handles : string[] = []

  options: commandOptions;
  requestedSessions : [] = []

  constructor(handles: string[], commandOptions: commandOptions) {
    this.handles = handles;
    this.options = commandOptions;

    this.source();
  }


  /**
   * This will place Session requests at the Session Manager.
   */
  source() {
    for (let handle of this.handles) {
      // if (this.options.private) {
      //   this.requestedSessions.push(SessionManager.requestPrivate(handle, this.options.privateId))
      // }
      // else {
        this.requestedSessions.push(SessionManager.request(handle))
      // }
    }
  }

}
