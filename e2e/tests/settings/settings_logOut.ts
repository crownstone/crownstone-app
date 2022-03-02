
import {
  $, delay, goToSettingsTab, replaceText, screenshot, scrollDownUntilVisible, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToDisappear, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";
import { device, waitFor } from "detox";
import { boot } from "../initialization/boot";

export const Settings_logOut = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SettingsOverview', async () => {
    await waitToStart('SettingsOverview');
  })

  test('should be able to log out', async () => {
    await scrollDownUntilVisible('logOut','SettingsOverview_scrollview');
    await tap("logOut");
    await screenshot();
    await tapAlertCancelButton();
    await tap('logOut');
    await tapAlertOKButton();
    await waitToNavigate('Processing_text');
    await screenshot();
    await delay(8000);
    await boot();
  })

  test("should be able to login again", async () => {
    await waitToNavigate('LoginSplash');
    await waitToShow('loginButton');
    await tap('loginButton');
    await waitToNavigate('LoginView');
    await replaceText('login_email_address','crownstone.main.test@gmail.com');
    await replaceText('login_password','testPassword');
    await tapReturnKey('login_password');
    await tap('login_big_button')
    await waitToNavigate('PermissionIntroduction', 15000);
    await tap('permission_i_understand')
    await waitToNavigate('permission_Notifications_view');
    await tap('permission_sounds_fair')
    await waitToNavigate('SphereOverview', 15000);
    await goToSettingsTab()
  })
};
