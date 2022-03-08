import {
  $, checkBackOption, delay, replaceText, screenshot, scrollDownUntilVisible, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, visitLink, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Settings_privacy = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SettingsOverview', async () => {
    await waitToStart('SettingsOverview');
  })

  test('should be able to go the privacy screen', async () => {
    await tap('privacy');
    await waitToNavigate('SettingsPrivacy');
    await screenshot();
  })

  test('should be able disable and enable the sharing of location', async () => {
    await tap('ShareLocation');
    await tap('ShareLocation');
  })

  test('should be able disable and enable the sharing of the switch state', async () => {
    await tap('ShareSwitchState');
    await tap('ShareSwitchState');
  })

  test('should be able disable and enable the sharing of phone details', async () => {
    await tap('SharePhoneDetails');
    await delay(500);
    await screenshot();
    await tapSingularAlertButton();
    await tap('SharePhoneDetails');
  })

  test('should be able to see the privacyPolicy', async () => {
    await scrollDownUntilVisible('PrivacyPolicy','SettingsPrivacy_scrollView');
    await visitLink("PrivacyPolicy");
  })

  test('should be able to go back to the settings overview', async () => {
    await checkBackOption('BackButton', 'SettingsOverview', 'privacy', 'SettingsPrivacy');
  })

};
