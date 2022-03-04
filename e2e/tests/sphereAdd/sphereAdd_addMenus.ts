
import {
  $, delay, goToSettingsTab, goToSphereOverviewTab, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereAdd_addMenus = () => {
  test('should be on the SphereAdd view', async () => {
    await waitToNavigate("SphereAdd");
  });

  test('should be able to go to the roomAdd view', async () => {
    await tap("AddRoom");
    await waitToNavigate("RoomAdd");
    await screenshot();
    await tap("topBarLeftItem");
    await waitToNavigate("SphereAdd");
  });

  test('should be able to go to the addUser view', async () => {
    await tap("AddPerson");
    await waitToNavigate("SphereUserInvite");
    await screenshot();
    await tap("closeModal");
    await waitToNavigate("SphereAdd");
  });

  test('should be able to go to the AddSomethingElse view', async () => {
    await tap("AddSomethingElse");
    await waitToNavigate("SphereIntegrations");
    await screenshot();
    await tap("closeModal");
    await waitToNavigate("SphereAdd");
  });
};
