import {
  $, delay, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereEditMenu = () => {
  test('should be on the SphereOverview view', async () => {
    await waitToStart('SphereOverview');
    await screenshot();

    // update the assistant for later use.
    await Assistant.update();
  })

  test('should go to the SphereEdit menu when you tap edit', async () => {
    await tap('edit')
    await waitToNavigate('SphereEdit');
    await screenshot();
  })

  if (CONFIG.ONLY_ESSENTIALS === false) {
    test('should be able to go back via edit button', async () => {
      await tap('closeModal')
      await waitToNavigate('SphereOverview');
      await tap('edit')
      await waitToNavigate('SphereEdit');
    })
  }
};
