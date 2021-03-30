import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";
import { connectTo } from "../../logic/constellation/Tellers";
import { CommandAPI } from "../../logic/constellation/Commander";

class ConnectionManagerClass {
  bleConnectionTimeout = null;
  handle: string = null;
  api: CommandAPI = null;

  constructor() {}

  setDisconnectTimeout() {
    if (this.bleConnectionTimeout !== null) {
      clearTimeout(this.bleConnectionTimeout);
    }
    this.bleConnectionTimeout = setTimeout(() => { this.disconnect() }, 5000);
  }

  async connect(handle: string) : Promise<CommandAPI> {
    if (this.api !== null) {
      return this.api;
    }
    this.handle = handle;
    this.api = await connectTo(handle);
    return this.api;
  }

  async disconnect() {
    await this.api.end();
    this.api = null;
  }

}

export const ConnectionManager = new ConnectionManagerClass();