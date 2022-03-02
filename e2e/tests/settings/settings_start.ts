import {
  $, delay, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";
import { waitFor } from "detox";

export const Settings_start = () => {
  test('should be able to go the settings tab', async () => {
    await waitFor($('bottomTab_settings')).toBeVisible(100).withTimeout(8000);
    await tap('bottomTab_settings');
    await waitToNavigate('SettingsOverview');
    await screenshot();
  })

};
