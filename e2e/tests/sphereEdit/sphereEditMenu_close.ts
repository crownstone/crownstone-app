import {
  $, checkBackOption, delay, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereEditMenu_close = () => {
  test('should be able to go back via edit menu', async () => {
    await waitToStart('SphereEdit');
    await checkBackOption('closeModal', 'SphereOverview','edit','SphereEdit');
  })
};
