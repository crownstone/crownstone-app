import {
  $, delay, goToSettingsTab, goToSphereOverviewTab, replaceText, screenshot, scrollDownUntilVisible, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, visitLink, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereAdd_crownstone = () => {
  test('should be on the SphereAdd view', async () => {
    await waitToNavigate("SphereAdd");
  });

  test('should be able to go to the AddCrownstone view', async () => {
    await tap("AddCrownstone_button");
    await waitToNavigate("AddCrownstone");
  });

  test('should be able to go back from the AddCrownstone view', async () => {
    await tap("topBarLeftItem");
    await waitToNavigate("SphereAdd");
    await tap("AddCrownstone_button");
    await waitToNavigate("AddCrownstone");
  });

  // test('should be able to see all views for adding a plug', async () => {
  //   await tap("Plug");
  // })

  // test('should be able to see all views for adding a builtinOne', async () => {
  //   await tap("Built_in_One");
  // })
  //
  // test('should be able to see all views for adding a hub', async () => {
  //   await tap("Hub");
  // })
  //
  // test('should be able to see all views for adding a guidestone', async () => {
  //   await tap("Guidestone");
  // })
  //
  // test('should be able to see all views for adding a USB dongle', async () => {
  //   await tap("Crownstone_USB");
  // })
  //
  // test('should be able to buy Crownstones', async () => {
  //   await scrollDownUntilVisible('BuyCrownstones','addCrownstone_scrollView');
  //   await tap("BuyCrownstones");
  //   await waitToNavigate('BuyCrownstonesCard');
  //   await screenshot();
  //
  //   await visitLink('toStore');
  //   await tap("topBarLeftItem");
  //   await waitToNavigate('addCrownstone_selection');
  // })
};
