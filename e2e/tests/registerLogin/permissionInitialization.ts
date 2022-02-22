import { waitFor } from 'detox';
import {
  $,
  delay,
  replaceText,
  tap,
  tapAlertCancelButton,
  tapAlertOKButton,
  tapReturnKey,
  tapSingularAlertButton,
  waitToNavigate, waitToShow,
} from "../../util/testUtil";
import {CONFIG} from "../../testSuite.e2e";


export const PermissionInitialization = () => {
  test('should be on the PermissionIntroduction screen', async () => {
    await waitToNavigate('PermissionIntroduction');
  })

  test('accept permissions', async () => {
    await tap('permission_i_understand')
    await waitToNavigate('permission_Notifications_view')
    await tap('permission_sounds_fair')
    await delay(500)
    await waitToNavigate('permission_AI_setup')
    await tap('permission_nice_to_meet_you')
    await waitToNavigate('SphereOverview')
  })







};
``