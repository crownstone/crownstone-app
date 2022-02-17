import {device} from "detox";

export const BootApp = () => {
  test("should boot the app", async () => {
    await device.launchApp();
    await device.disableSynchronization();
  });
}