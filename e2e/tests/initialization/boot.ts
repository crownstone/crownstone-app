import {device} from "detox";

export const BootApp = () => {
  test("should boot the app", async () => {
    let launchArguments = device.appLaunchArgs.get();
    await device.launchApp({launchArgs: { detoxEnableSynchronization: 0, ...launchArguments }});
    await device.disableSynchronization();
  });
}