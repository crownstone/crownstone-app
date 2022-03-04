import {
  $, delay, goToSettingsTab, goToSphereOverviewTab, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereAdd_start = () => {
  test('should be on the sphereOverview', async () => {
    await goToSphereOverviewTab();
    await waitToNavigate("SphereOverview");
  });

  test('should be able to go to the sphereAdd menu', async () => {
    await tap("AddToSphereButton");
    await waitToNavigate("SphereAdd");
    await screenshot();
  });

};
