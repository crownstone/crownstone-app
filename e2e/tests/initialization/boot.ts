import {device} from "detox";
import {delay} from "../../util/TestUtil";

export const BootApp = () => {
  test("should boot the app", async () => {
    await device.launchApp({launchArgs: { detoxEnableSynchronization: 0 }});
  });

  test("should disable synchronization", async () => {
    await device.disableSynchronization();
    await delay(300);
  });
}