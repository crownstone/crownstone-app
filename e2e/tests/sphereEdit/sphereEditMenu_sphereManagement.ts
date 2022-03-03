import {
  $, delay, longPress, replaceText, screenshot, scrollDownUntilVisible, swipeNext, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {by, device, expect, element, waitFor} from 'detox';
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereEditMenu_sphereManagement = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SphereEdit view', async () => {
    await waitToStart('SphereEdit');
  })

  test("should not be able to leave the sphere as the only user", async () => {
    await tap("SphereEdit_settings");
    await waitToNavigate('SphereEditSettings');
    await screenshot();
    await tap("LeaveSphere")
    await screenshot();
    await tapAlertCancelButton();
    await tap("LeaveSphere")
    await tapAlertOKButton();
    await delay(1000);
    await screenshot();
    await tapSingularAlertButton()
  })

  test("should be able to delete sphere", async () => {
    await tap("DeleteSphere")
    await screenshot();
    await tapAlertCancelButton();
    await tap("DeleteSphere")
    await tapAlertOKButton();
    await waitToNavigate('SphereOverview_noSphere');
  })

  test("should be able to create a new sphere when you dont have any spheres", async () => {
    await tap('edit')
    await waitToNavigate('SphereEdit');
    await screenshot();
    await tap("SphereEdit_createOnlySphere");
    await waitToNavigate('AiStart');
    await replaceText('AiName','James the Second');
    await tapReturnKey('AiName');
    await screenshot();
    await tap('AiStart_OK');
    await tapSingularAlertButton();
    await waitToNavigate('SphereOverview');
    await tap('edit')
    await waitToNavigate('SphereEdit');
  })

  test('should go to the SphereEditSettings view', async () => {
    await scrollDownUntilVisible('SphereEdit_createSphere', "SphereEditScrollView");
    await tap("SphereEdit_createSphere");
    await waitToNavigate('AddSphereTutorial');
    await screenshot();
  })

  test('should be able to swipe left to the second view', async () => {
    await swipeNext('AddSphereTutorial_introduction');
    await waitToNavigate('AddSphereTutorial_multiple');
    await screenshot();
  })

  test('should be able to swipe left to the third view', async () => {
    await swipeNext('AddSphereTutorial_multiple');
    await waitToNavigate('AddSphereTutorial_intended');
    await screenshot();
  })

  test('should be able to tap never mind', async () => {
    await tap("AddSphere_nevermind")
    await waitToNavigate('SphereEdit');
  })

  test("should be able to create sphere", async () => {
    await scrollDownUntilVisible('SphereEdit_createSphere', "SphereEditScrollView");
    await tap("SphereEdit_createSphere");
    await waitToNavigate('AddSphereTutorial');
    await swipeNext('AddSphereTutorial_introduction');
    await waitToNavigate('AddSphereTutorial_multiple');
    await swipeNext('AddSphereTutorial_multiple');
    await waitToNavigate('AddSphereTutorial_intended');
    await tap("AddSphere_create")
    await waitToNavigate('AiStart');
  })

  test("should be able to name the AI", async () => {
    await replaceText('AiName','James the Third');
    await tapReturnKey('AiName');
    await tap('AiStart_OK');
    await tapSingularAlertButton();
    await waitToNavigate("SphereOverview");
  })

  test("should be able to tap the sphere change button", async () => {
    await tap('SphereChangeButton');
    await waitToNavigate("ZoomInstructionOverlay")
    await screenshot();
    await tap("ZoomInstructionsButton")
    await waitToNavigate("SphereOverview_SphereLevel")
    await screenshot();
  })

  test("should be able to tap a sphere", async () => {
    await Assistant.update();
    let sphereId = Assistant.getSphereIdMostRecent();
    await tap(`SphereCircle${sphereId}`);
    await waitToNavigate("SphereOverview")
  })

  test("should be able to delete all spheres", async () => {
    await waitToNavigate("SphereOverview")
    await tap('edit')
    await waitToNavigate('SphereEdit');
    await tap("SphereEdit_settings");
    await waitToNavigate('SphereEditSettings');
    await tap("DeleteSphere")
    await tapAlertOKButton();
    await waitToNavigate('SphereOverview_SphereLevel');
    await screenshot();
    await Assistant.update();
    let sphereId = Assistant.getSphereIdMostRecent();
    await tap(`SphereCircle${sphereId}`);
    await waitToNavigate("SphereOverview");
    await tap('edit');
    await waitToNavigate('SphereEdit');
  })
};
