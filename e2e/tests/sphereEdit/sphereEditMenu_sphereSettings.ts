import {
  $, checkBackOption, delay, longPress, replaceText, screenshot, scrollDownUntilVisible, shouldBeOn, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {by, device, expect, element, waitFor} from 'detox';
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereEditMenu_sphereSettings = () => {
  test('should be on the SphereEdit view', async () => {
    await waitToStart('SphereEdit');
  })


  test('should be able to change the sphere name', async () => {
    await replaceText("SphereName","My Home");
    await tapReturnKey("SphereName");
    await delay(1000);
  })


  if (CONFIG.ONLY_ESSENTIALS === false) {
    test('should be able to go place your sphere on the map', async () => {
      await tap("SphereLocation");
      await waitToNavigate("SphereEditMap");
      await screenshot();
      await tap("UseLocation");
      await waitToNavigate("SphereEdit");
    })
  }
};
