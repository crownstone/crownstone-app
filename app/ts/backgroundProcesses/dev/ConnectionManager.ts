import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";

class ConnectionManagerClass {
  bleConnectionTimeout = null;
  handle: string = null;

  constructor() {}

  setDisconnectTimeout() {
    if (this.bleConnectionTimeout !== null) {
      clearTimeout(this.bleConnectionTimeout);
    }
    this.bleConnectionTimeout = setTimeout(() => { this.disconnect() }, 5000);
  }

  connectWillStart(handle: string) {
    clearTimeout(this.bleConnectionTimeout);
    this.bleConnectionTimeout = null;
  }

  disconnect() {
    clearTimeout(this.bleConnectionTimeout);
    return BluenetPromiseWrapper.phoneDisconnect(this.handle)
      .catch(() => { return BluenetPromiseWrapper.disconnectCommand(this.handle)})

  }

}

export const ConnectionManager = new ConnectionManagerClass();