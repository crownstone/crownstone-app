import {
  $, delay, longPress, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton,  tapReturnKey,
  tapSingularAlertButton, waitToAppear, waitToDisappear, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SideBar_usage = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SphereOverview view', async () => {
    await waitToStart('SphereOverview');
    await screenshot();

  })

  test('should be able to open and close the sidebar', async () => {
    await tap('Sidebar_button')
    await screenshot();
    await waitToAppear("addItems", 2000, 50);
    await tap('Sidebar_button')
    await screenshot();
    await waitToDisappear("addItems", 2000);
  })


};
