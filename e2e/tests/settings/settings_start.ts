import {
  $, delay, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Settings_start = () => {
  test('should be able to go the settings tab', async () => {
    await tap('bottomTab_settings');
    await waitToNavigate('SettingsOverview');
    await screenshot();
  })

};
