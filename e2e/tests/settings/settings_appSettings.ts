import {
  $, checkBackOption, delay, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Settings_appSettings = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SettingsOverview', async () => {
    await waitToStart('SettingsOverview');
  })

  test('should be able to go the app settings screen', async () => {
    await tap('appSettings');
    await waitToNavigate('SettingsApp');
    await screenshot();
  })

  test('should be able enable tap-to-toggle globally', async () => {
    await tap('tapToToggle_switch');
    await screenshot()
    await tap('SliderBar_hide');
    await screenshot()
  })

  test('should be able disable indoor localization', async () => {
    await tap('useIndoorLocalization');
    await screenshot()
  })

  test('should be able disable tap-to-toggle globally', async () => {
    await tap('tapToToggle_switch');
    await screenshot()
  })

  test('should be able enable indoor localization', async () => {
    await tap('useIndoorLocalization');
  })

  test('should be able to go back to the settings overview', async () => {
    await checkBackOption('BackButton', 'SettingsOverview', 'appSettings', 'SettingsApp');
  })

};
