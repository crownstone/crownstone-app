import {
  $, delay, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Settings_appSettings = () => {
  test('should be on the SettingsOverview', async () => {
    await waitToStart('SettingsOverview');
  })

  test('should be able to go the app settings screen', async () => {
    await tap('appSettings');
    await waitToNavigate('SettingsApp');
    await screenshot();
  })

  test('should be able disable/enable the sharing of location', async () => {
    await tap('ShareLocation');
    await tap('ShareLocation');
  })

  test('should be able disable/enable the sharing of the switch state', async () => {
    await tap('ShareSwitchState');
    await tap('ShareSwitchState');
  })

  test('should be able disable/enable the sharing of phone details', async () => {
    await tap('SharePhoneDetails');
    await delay(500);
    await screenshot();
    await tapSingularAlertButton();
    await tap('SharePhoneDetails');
  })

  test('should be able to go back to the settings overview', async () => {
    await tap('BackButton');
    await waitToNavigate('SettingsOverview')
  })

};
