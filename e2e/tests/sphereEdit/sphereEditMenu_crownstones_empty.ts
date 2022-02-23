import {
  $, delay, longPress, replaceText, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {by, device, expect, element, waitFor} from 'detox';
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereEditMenu_crownstones_empty = () => {
  test('should be on the SphereEdit view', async () => {
    await waitToStart('SphereEdit');
  })

  test('should go to the SphereEdit crownstone overview', async () => {
    await tap('SphereEdit_crownstones')
    await waitToNavigate('SphereCrownstoneOverview');
  })

  test('should go to the Add Crownstone view', async () => {
    await tap('AddCrownstone_button')
    await waitToNavigate('AddCrownstone');
  })

  test('should go back to the edit view', async () => {
    await tap('topBarLeftItem')
    await waitToNavigate('SphereCrownstoneOverview');
    await tap('BackButton')
    await waitToNavigate('SphereEdit');
  })
};
