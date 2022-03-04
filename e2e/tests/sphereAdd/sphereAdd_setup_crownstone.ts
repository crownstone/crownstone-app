import {
  $, delay, goToSettingsTab, goToSphereOverviewTab, replaceText, screenshot, scrollDownUntilVisible, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, visitLink, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereAdd_setup_crownstone = () => {
  test('should be on the SphereAdd view', async () => {
    await waitToNavigate("SphereAdd");
  });

  test('should be able to go to the AddCrownstone view', async () => {
    await tap("AddCrownstone_button");
    await waitToNavigate("AddCrownstone");
  });

  test('should be able to go to the scanningForSetupCrownstones', async () => {
    await tap("Plug");
    await waitToNavigate("installingPlug");
    await tap("installingPlugNext");
    await waitToNavigate("ScanningForSetupCrownstones");
  })

  test('should be able to see a setupCrownstone, pulse it and select it', async () => {
    await Assistant.update();
    let localId = await Assistant.getActiveSphereLocalId();
    let handle = 'crownstoneHandle';
    await Assistant.ble.sendSetupAdvertisment(handle);
    await waitToShow(`SetupDeviceEntry${handle}`)
    await tap(`setupPulse${handle}`);
    await delay(50);
    await Assistant.ble.sendGenericAdvertisement(handle, -70);

    await Assistant.ble.for(handle).succeed.connect('setup');
    await Assistant.ble.for(handle).succeed.setupPulse();
    await Assistant.ble.for(handle).succeed.phoneDisconnect();

    await Assistant.ble.sendSetupAdvertisment(handle);

    await waitToShow(`selectSetupEntry${handle}`);
    await tap(`selectSetupEntry${handle}`);
    await waitToNavigate('SetupCrownstone');
  })
};
