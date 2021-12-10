import {CLOUD_ADDRESS, CLOUD_V2_ADDRESS} from "../ExternalConfig";
import {FileUtil} from "../util/FileUtil";

const CLOUD_ADDRESS_FILE = "CLOUD_ADDRESS_OVERWRITE_FILE.config"

class CloudAddressesClass {

  cloud_v1 = CLOUD_ADDRESS;
  cloud_v2 = CLOUD_V2_ADDRESS;


  async initialize() {
    let data = await FileUtil.readFile(CLOUD_ADDRESS_FILE);
    if (data !== null) {
      console.log("CloudAddressesClass: Got data to load.", data);
      try {
        let json = JSON.parse(data);
        this.cloud_v1 = json.cloud_v1;
        this.cloud_v2 = json.cloud_v2;
      }
      catch (err) {
        console.log("CloudAddressesClass: Something went wrong");
      }
    }
    else {
      console.log("CloudAddressesClass: No overrides set.");
    }
  }


  async persist() {
    let data = JSON.stringify({
      cloud_v1: this.cloud_v1,
      cloud_v2: this.cloud_v2
    });
    await FileUtil.writeToFile(CLOUD_ADDRESS_FILE, data);
  }


  async clear() {
    await FileUtil.safeDeleteFile(CLOUD_ADDRESS_FILE);
    this.cloud_v1 = CLOUD_ADDRESS;
    this.cloud_v2 = CLOUD_V2_ADDRESS;
  }
}

export const CloudAddresses = new CloudAddressesClass()