import {
  $, delay, goToSettingsTab, goToSphereOverviewTab, replaceText, screenshot, scrollDownUntilVisible, shouldBeOn, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, visitLink, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

let UICR_DATA = {
  board          : 10,
  productType    : 10,
  region         : 10,
  productFamily  : 10,
  reserved1      : 10,

  hardwarePatch  : 10,
  hardwareMinor  : 10,
  hardwareMajor  : 10,
  reserved2      : 10,

  productHousing : 10,
  productionWeek : 10,
  productionYear : 10,
  reserved3      : 10,
}

export const SphereAdd_setup_more_crownstones = () => {
  test("should be able to setup up to 4 Crownstones", async () => {
    await waitToNavigate("SphereAdd");
    await tap("AddCrownstone_button");
    await waitToNavigate("AddCrownstone");
    await tap("Plug");
    await waitToNavigate("installingPlug");
    await tap("installingPlugNext");
    for (let i = 0; i < 2; i++) {
      let handle = 'crownstoneHandle_additional_' + i;
      await Assistant.update();
      await waitToNavigate("ScanningForSetupCrownstones");
      let localId = await Assistant.getActiveSphereLocalId();
      await Assistant.ble.sendSetupAdvertisment(handle);
      await tap(`selectSetupEntry${handle}`);
      await waitToNavigate('SetupCrownstone');
      await shouldBeOn('SetupCrownstone');
      await tap("name_next");
      await waitToNavigate("addCrownstone_iconPhase")
      await tap("icon_next");
      await waitToNavigate('addCrownstone_roomPhase');
      let locationId = await Assistant.getRoomId(0);
      await scrollDownUntilVisible(`crownstoneInLocation${locationId}`, "addCrownstone_roomPhase_scroll");
      await tap(`crownstoneInLocation${locationId}`);
      await waitToNavigate("addCrownstone_waitToFinish")
      await Assistant.ble.for(handle).succeed.connect('setup');
      await Assistant.ble.for(handle).succeed.getMACAddress('AB:CD:CA:FE:BA:0'+i);
      await Assistant.ble.for(handle).succeed.getFirmwareVersion('5.6.4');
      await Assistant.ble.for(handle).succeed.getHardwareVersion('10106');
      await Assistant.ble.for(handle).succeed.getUICR(UICR_DATA);
      await Assistant.ble.sendSetupProgress(13);
      await Assistant.ble.for(handle).succeed.setupCrownstone()
      await Assistant.ble.for(handle).disconnectEvent()
      await waitToNavigate('addCrownstone_setupMore')
      await tap("addCrownstone_addMore");
    }
    await waitToNavigate("ScanningForSetupCrownstones");
    await tap("closeModal");
    await waitToNavigate("SphereAdd");
  });


};

