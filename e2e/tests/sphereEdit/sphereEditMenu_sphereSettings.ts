import {
  $, backButtonOrTap, delay, longPress, replaceText, screenshot, tap,
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

  test('should go to the SphereEditSettings view', async () => {
    await tap("SphereEdit_settings");
    await waitToNavigate('SphereEditSettings');
    await screenshot();
  })

  test('should be able to change the sphere name', async () => {
    await replaceText("SphereName","My Home");
    await tapReturnKey("SphereName");
    await delay(1000);
  })

  if (CONFIG.ONLY_ESSENTIALS === false) {
    test('should be able to go to the accept the AI name', async () => {
      await tap("SphereAI_button");
      await waitToNavigate("AiStart");
      await tap("AiStart_OK");
      await screenshot();
      await tapSingularAlertButton();
      await waitToNavigate("SphereEditSettings");
    })

    test('should be able to go to the change the AI name', async () => {
      await tap("SphereAI_button");
      await waitToNavigate("AiStart");
      await replaceText("AiName", "Frank");
      await tapReturnKey('AiName');
      await tap("AiStart_OK");
      await screenshot();
      await tapSingularAlertButton();
      await waitToNavigate("SphereEditSettings");
    })


    test('should be able to go place your sphere on the map', async () => {
      await tap("SphereLocation");
      await waitToNavigate("SphereEditMap");
      await screenshot();
      await tap("UseLocation");
      await waitToNavigate("SphereEditSettings");
    })

    test('should be able to go to the sphere users', async () => {
      await tap("SphereUser_button");
      await waitToNavigate("SphereUserOverview");
      await backButtonOrTap("BackButton");
      await waitToNavigate("SphereEdit");
    })
  }
  else {
    test('should be able to back from the sphere settings', async () => {
      await backButtonOrTap("BackButton");
      await waitToNavigate("SphereEdit");
    })
  }
};
