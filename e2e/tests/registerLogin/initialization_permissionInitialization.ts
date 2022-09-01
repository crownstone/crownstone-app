import { waitFor } from 'detox';
import {
  $,
  delay,
  isAndroid,
  isIos,
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
    if (isIos()) {
      await waitToNavigate('permission_Notifications_view')
    }
    else {
      await waitToNavigate('SphereOverview')
    }
  })

  if (isIos()) {
    test('accept notifications permissions', async () => {
      await screenshot();
      await tap('permission_sounds_fair')
      await waitToNavigate('SphereOverview')
    })
  }

};
