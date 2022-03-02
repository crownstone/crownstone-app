
import {
  $, delay, goToSettingsTab, replaceText, screenshot, scrollDownUntilVisible, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, visitLink, waitToDisappear, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";
import { device, waitFor } from "detox";
import { boot } from "../initialization/boot";

export const Settings_termsConditions = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SettingsOverview', async () => {
    await waitToStart('SettingsOverview');
  })

  test('should be able to view the terms of service', async () => {
    await scrollDownUntilVisible('TermsOfService','SettingsOverview_scrollview');
    await visitLink("TermsOfService");
  });

  test('should be able to view the terms of service', async () => {
    await scrollDownUntilVisible('PrivacyPolicy','SettingsOverview_scrollview');
    await visitLink("PrivacyPolicy");
  });
};
