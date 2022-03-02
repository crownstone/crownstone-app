import { waitFor } from 'detox';
import {
  $,
  delay,
  replaceText, screenshot,
  tap,
  tapAlertCancelButton,
  tapAlertOKButton,
  tapReturnKey,
  tapSingularAlertButton,
  waitToNavigate, waitToShow,
} from "../../util/TestUtil";
import {CONFIG} from "../../testSuite.e2e";


export const Initialization_permissionInitialization = () => {
  test('should be on the PermissionIntroduction screen', async () => {
    await waitToNavigate('PermissionIntroduction');
  })

  test('accept localization permissions', async () => {
    await screenshot();
    await tap('permission_i_understand')
    await waitToNavigate('permission_Notifications_view')
  })
  test('accept notifications permissions', async () => {
    await screenshot();
    await tap('permission_sounds_fair')
    await waitToNavigate('permission_AI_setup')
  })
  test('set AI Name', async () => {
    await replaceText('AI_name','James');
    await tapReturnKey('AI_name')
    await delay(500);
    await screenshot();
    await tap('permission_nice_to_meet_you')
    await waitToNavigate('SphereOverview')
  })
};