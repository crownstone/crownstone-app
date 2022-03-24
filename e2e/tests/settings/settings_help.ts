import {
  $, checkBackOption, delay, goToSettingsTab, replaceText, screenshot, scrollDownUntilVisible, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, visitLink, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";
import { device, waitFor } from "detox";
import { boot } from "../initialization/boot";

export const Settings_help = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SettingsOverview', async () => {
    await waitToStart('SettingsOverview');
  })

  test('should be able to go the help screen', async () => {
    await tap('help');
    await waitToNavigate('SettingsFAQ');
    await screenshot();
  })


  test('should be able to look at the questions', async () => {
    for (let i = 1; i <= 9; i++) {
      await scrollDownUntilVisible(`question${i}`, "SettingsFAQ_scrollview");
      await tap(`question${i}`);
      await delay(400);
      await screenshot();
    }
  })

  test('should be able to go to the Redownload screen', async () => {
    await scrollDownUntilVisible(`Redownload`, "SettingsFAQ_scrollview");
    await tap("Redownload");
    await waitToNavigate("SettingsRedownloadFromCloud");
    await screenshot();
  })

  test('should be able to redownload data', async () => {
    await tap("ResetDatabase");
    await delay(10000);
    await boot();
    await goToSettingsTab()
    await waitToNavigate('SettingsOverview');
    await tap('help');
    await waitToNavigate('SettingsFAQ');
  })

  test('should be able to look at the rest of the questions', async () => {
    for (let i = 10; i <= 14; i++) {
      await scrollDownUntilVisible(`question${i}`, "SettingsFAQ_scrollview");
      await tap(`question${i}`);
      await delay(400);
      await screenshot();
    }
  })

  test('should be able to go to the ble troubleshooting', async () => {
    await scrollDownUntilVisible('bleTroubleShooting', "SettingsFAQ_scrollview");
    await tap('bleTroubleShooting');
    await waitToNavigate('SettingsBleTroubleshooting');
    await screenshot();
    await checkBackOption('closeModal', 'SettingsFAQ', 'bleTroubleShooting', 'SettingsBleTroubleshooting');
  })


  test('should be able to see the online help', async () => {
    await scrollDownUntilVisible('onlineHelp','SettingsFAQ_scrollview');
    await visitLink("onlineHelp");
  })


  test('should be able to go back to the settings overview', async () => {
    await checkBackOption('BackButton', 'SettingsOverview', 'help', 'SettingsFAQ');
  })

};
