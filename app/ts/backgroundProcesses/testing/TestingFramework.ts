import { CloudAddresses }                  from "../indirections/CloudAddresses";
import { CLOUD_ADDRESS, CLOUD_V2_ADDRESS, SSE_ADDRESS } from "../../ExternalConfig";
import { CameraLibrarySettings }           from "../indirections/CameraLibraryInterface";
import { CrownstoneSSE }                   from "../../logic/SSE";
import { BridgeMock }                      from "./BridgeMock";
import { BridgeConfig }                    from "../../native/libInterface/BridgeConfig";


export const TestingFramework = {

  SSE: null,

  async initialize(json) {
    if (!json) { return; }

    try {
      CloudAddresses.cloud_v1                 = json.cloud_v1          || CLOUD_ADDRESS;
      CloudAddresses.cloud_v2                 = json.cloud_v2          || CLOUD_V2_ADDRESS;
      CloudAddresses.sse                      = json.sse               || SSE_ADDRESS;
      CameraLibrarySettings.mockImageLibrary  = json.mockImageLibrary  || false;
      CameraLibrarySettings.mockCameraLibrary = json.mockCameraLibrary || false;
      BridgeConfig.mockBluenet                = json.mockBluenet       || false;
      BridgeConfig.mockBridgeUrl              = json.mockBridgeUrl     || null;
    }
    catch (err) {
      console.log("TestingFramework: Something went wrong", err);
    }

    if (BridgeConfig.mockBluenet && BridgeConfig.mockBridgeUrl) {
      await TestingFramework.setupSSE();
    }
  },

  async setupSSE() {
    if (BridgeConfig.mockBluenet) {
      console.log("init", BridgeConfig.mockBridgeUrl)
      if (!TestingFramework.SSE) {
        TestingFramework.SSE = new CrownstoneSSE({sseUrl: BridgeConfig.mockBridgeUrl+'sse'});
      }
      TestingFramework.SSE.accessToken = "TEST_DEV";
      await TestingFramework.SSE.start((event) => { BridgeMock.handleSSE(event); });
    }
  },

  stopSSE() {
    if (TestingFramework.SSE) {
      TestingFramework.SSE.stop();
      delete TestingFramework.SSE;
    }
  },



  // async persist() {
  //   let data = JSON.stringify({
  //     cloud_v1:            CloudAddresses.cloud_v1,
  //     cloud_v2:            CloudAddresses.cloud_v2,
  //     mockImageLibrary:    CameraLibrarySettings.mockImageLibrary,
  //     mockCameraLibrary:   CameraLibrarySettings.mockCameraLibrary,
  //     mockBluenet:         BridgeConfig.mockBluenet,
  //     mockBridgeUrl:       BridgeConfig.mockBridgeUrl,
  //   });
  //   await FileUtil.writeToFile(TestingOverrideConfigFile, data);
  //
  //   if (BridgeConfig.mockBluenet && BridgeConfig.mockBridgeUrl) {
  //     TestingFramework.setupSSE();
  //   }
  //
  //   BluenetPromiseWrapper.isDevelopmentEnvironment().then((result) => {
  //     base_core.sessionMemory.developmentEnvironment = result;
  //   });
  // },


  async clear() {
    TestingFramework.stopSSE();

    CloudAddresses.cloud_v1                 = CLOUD_ADDRESS;
    CloudAddresses.cloud_v2                 = CLOUD_V2_ADDRESS;
    CameraLibrarySettings.mockImageLibrary  = false;
    CameraLibrarySettings.mockCameraLibrary = false;
    BridgeConfig.mockBluenet                = false;
    BridgeConfig.mockBridgeUrl              = '';
  }
}
