import { by, device, expect, element, waitFor } from 'detox';
import {
  $,
  delay,
  longPress,
  replaceText,
  screenshot,
  tap,
  tapAlertCancelButton,
  tapAlertOKButton,
  tapReturnKey,
  tapSingularAlertButton, visitLink, waitToAppear, waitToDisappear,
  waitToNavigate,
  waitToShow,
  waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";
import { TestingAssistant } from "../../util/TestingAssistant";

export const Stone_edit_abilities = () => {

  test('should be on the DeviceOverview view', async () => {
    await waitToStart('DeviceOverview');
  });

  test('should be able to go to the Appearance view', async () => {
    await tap("DeviceAbilities");
    await waitToNavigate('DeviceAbilities');
    await screenshot();
  });

  if (!CONFIG.ONLY_ESSENTIALS) {
    test('should be able to go to the dimming help', async () => {
      await visitLink('dimming_information');
    });

    test('should be able to go to the switchcraft help', async () => {
      await tap('switchcraft_information');
      await waitToNavigate('Ability_SwitchcraftInformation');
      await screenshot();
      await tap('BackButton');
      await waitToNavigate('DeviceAbilities');
    });

    test('should be able to go to the tap to toggle help', async () => {
      await tap('tapToToggle_information');
      await waitToNavigate('Ability_TapToToggleInformation');
      await screenshot();
      await tap('BackButton');
      await waitToNavigate('DeviceAbilities');
    });
  }

  test('should be able to enable dimming', async () => {
    await tap('dimming_toggle');
    await delay(300);
    await screenshot();
  });

  test('should be able to sync dimming state to Crownstone', async () => {
    // trigger an enter-sphere to wake the stone-data-syncer.
    await Assistant.update();
    await Assistant.enterSphere();

    // trigger an advertisement from the Crownstone to trigger constellation
    let stoneId = await Assistant.getStoneId(0);
    await Assistant.ble.sendGenericStoneAdvertisement(stoneId);
  });


};
