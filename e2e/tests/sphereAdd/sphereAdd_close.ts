import {
  $, checkBackOption, delay, goToSettingsTab, goToSphereOverviewTab, replaceText, screenshot, shouldBeOn, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereAdd_close = () => {
  test('should be able to go to the sphereOverview', async () => {
    await shouldBeOn("SphereAdd");
    await checkBackOption('closeModal', 'SphereOverview', 'AddToSphereButton','SphereAdd');
  });
};
