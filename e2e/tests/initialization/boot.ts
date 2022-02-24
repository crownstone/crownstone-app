import {device} from "detox";

export const BootApp = () => {
  test("should boot the app", async () => {
    let launchArguments = device.appLaunchArgs.get();
    console.log("LaunchArgs", launchArguments)

    await device.launchApp({launchArgs: { detoxEnableSynchronization: 0, ...launchArguments }});
  });
}