import {
  screenshot,
  tap,
  visitLink,
  waitToNavigate,
  waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Stone_edit_abilities_start = () => {

  test('should be on the DeviceOverview view', async () => {
    await waitToStart('DeviceOverview');
    // trigger an enter-sphere to wake the stone-data-syncer.
    await Assistant.update();
    await Assistant.enterSphere();
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
};
