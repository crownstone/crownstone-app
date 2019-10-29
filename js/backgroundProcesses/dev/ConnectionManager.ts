import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";

class ConnectionManagerClass {
  bleConnectionTimeout = null;

  constructor() {}

  setDisconnectTimeout() {
    if (this.bleConnectionTimeout !== null) {
      clearTimeout(this.bleConnectionTimeout);
    }
    this.bleConnectionTimeout = setTimeout(() => { this.disconnect() }, 5000);
  }

  connectWillStart() {
    clearTimeout(this.bleConnectionTimeout);
    this.bleConnectionTimeout = null;
  }

  disconnect() {
    clearTimeout(this.bleConnectionTimeout);
    return BluenetPromiseWrapper.phoneDisconnect()
      .catch(() => { return BluenetPromiseWrapper.disconnectCommand()})

  }

}

export const ConnectionManager = new ConnectionManagerClass();