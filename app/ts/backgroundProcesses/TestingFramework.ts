import {FileUtil} from "../util/FileUtil";
import {CloudAddresses} from "./indirections/CloudAddresses";
import {CLOUD_ADDRESS, CLOUD_V2_ADDRESS} from "../ExternalConfig";
import {CameraLibrarySettings} from "./indirections/CameraLibraryInterface";
import {BluenetPromiseInterface} from "../native/libInterface/BluenetPromise";

const TestingOverrideConfigFile = "CLOUD_ADDRESS_OVERWRITE_FILE.config"

export const TestingFramework = {

  async initialize() {
    let data = await FileUtil.readFile(TestingOverrideConfigFile);
    if (data !== null) {
      console.log("TestingFramework: Got data to load.", data);
      try {
        let json = JSON.parse(data);
        CloudAddresses.cloud_v1                     = json.cloud_v1;
        CloudAddresses.cloud_v2                     = json.cloud_v2;
        CameraLibrarySettings.mockImageLibrary      = json.mockImageLibrary;
        CameraLibrarySettings.mockCameraLibrary     = json.mockCameraLibrary;
        BluenetPromiseInterface.mockBluenetPromises = json.mockBluenetPromises;
      }
      catch (err) {
        console.log("TestingFramework: Something went wrong", err);
      }
    }
    else {
      console.log("TestingFramework: No overrides set.");
    }
  },



  async persist() {
    let data = JSON.stringify({
      cloud_v1:            CloudAddresses.cloud_v1,
      cloud_v2:            CloudAddresses.cloud_v2,
      mockImageLibrary:    CameraLibrarySettings.mockImageLibrary,
      mockCameraLibrary:   CameraLibrarySettings.mockCameraLibrary,
      mockBluenetPromises: BluenetPromiseInterface.mockBluenetPromises,
    });
    await FileUtil.writeToFile(TestingOverrideConfigFile, data);
  },


  async clear() {
    await FileUtil.safeDeleteFile(TestingOverrideConfigFile);
    CloudAddresses.cloud_v1                     = CLOUD_ADDRESS;
    CloudAddresses.cloud_v2                     = CLOUD_V2_ADDRESS;
    CameraLibrarySettings.mockImageLibrary      = false;
    CameraLibrarySettings.mockCameraLibrary     = false;
    BluenetPromiseInterface.mockBluenetPromises = false;
  }
}
