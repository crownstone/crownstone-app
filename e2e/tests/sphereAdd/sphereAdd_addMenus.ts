
import {
  $, checkBackOption, delay, goToSettingsTab, goToSphereOverviewTab, replaceText, scrollDownUntilVisible, screenshot, shouldBeOn, tap,
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
    await shouldBeOn('SphereAdd');
    await tap("AddRoom");
    await waitToNavigate("RoomAdd");
    await screenshot();
    await checkBackOption('topBarLeftItem','SphereAdd','AddRoom','RoomAdd')
    await waitToNavigate("SphereAdd");
  });

  test('should be able to go to the addUser view', async () => {
    await shouldBeOn('SphereAdd');
    await scrollDownUntilVisible("AddPerson", "SphereAddScrollView");
    await tap("AddPerson");
    await waitToNavigate("SphereUserInvite");
    await screenshot();
    await checkBackOption("closeModal","SphereAdd", { restoreState: async () => {
      await scrollDownUntilVisible("AddPerson", "SphereAddScrollView");
      await tap("AddPerson");
      await waitToNavigate('SphereUserInvite');
    }});
    await waitToNavigate("SphereAdd");
  });

  test('should be able to go to the AddSomethingElse view', async () => {
    await shouldBeOn('SphereAdd');
    await tap("AddSomethingElse");
    await waitToNavigate("SphereIntegrations");
    await screenshot();
    await checkBackOption("closeModal","SphereAdd", { restoreState: async () => {
      await scrollDownUntilVisible("AddSomethingElse", "SphereAddScrollView");
      await tap("AddSomethingElse");
      await waitToNavigate('SphereIntegrations');
    }});
    await waitToNavigate("SphereAdd");
  });
};
