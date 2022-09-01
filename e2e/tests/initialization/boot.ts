import {device} from "detox";
import { replaceText, tap, tapReturnKey } from "../../util/TestUtil";
import { CONFIG } from "../../testSuite.e2e";

export const BootApp = () => {
  test("should boot the app", async () => {
    await boot();
  });
}

export async function boot() {
  let launchArguments = device.appLaunchArgs.get();

  let allArguments = {
    detoxEnableSynchronization: 0,
    detoxURLBlacklistRegex: 'http.*',
    ...launchArguments,
    "cloud_v1"          : `http://${CONFIG.IP_ADDRESS}:3000/api/`,
    "cloud_v2"          : `http://${CONFIG.IP_ADDRESS}:3050/api/`,
    "mockBridgeUrl"     : `http://${CONFIG.IP_ADDRESS}:3100/`,
    "mockCameraLibrary" : true,
    "mockImageLibrary"  : true,
    "mockBluenet"       : true,
  }

  await device.launchApp({launchArgs: allArguments});
  await device.disableSynchronization();
}
