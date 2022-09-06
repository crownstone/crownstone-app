import {
  $, checkBackAndForthOption,
  checkBackOption,
  delay,
  goToSettingsTab,
  goToSphereOverviewTab,
  replaceText,
  screenshot,
  scrollDownUntilVisible, shouldBeOn,
  tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapPossibleDuplicate,
  tapReturnKey,
  tapSingularAlertButton,
  visitLink,
  waitToNavigate,
  waitToShow,
  waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereAdd_addCrownstoneMenu = () => {
  test('should be on the SphereAdd view', async () => {
    await waitToNavigate("SphereAdd");
  });

  test('should be able to go to the AddCrownstone view', async () => {
    await tap("AddCrownstone_button");
    await waitToNavigate("AddCrownstone");
  });

  if (CONFIG.ONLY_ESSENTIALS !== true) {
    test('should be able to go back from the AddCrownstone view', async () => {
      await checkBackAndForthOption('topBarLeftItem', 'SphereAdd', 'AddCrownstone_button', 'AddCrownstone');
    });

    test('should be able to see all views for adding a plug', async () => {
      await shouldBeOn("AddCrownstone");
      await tap("Plug");
      await waitToNavigate("installingPlug");
      await screenshot();
      await tap("installingPlugNext");
      await waitToNavigate("ScanningForSetupCrownstones");
      await screenshot();

      await goBackToAdd(true);
    })

    test('should be able to see all views for adding a builtinOne, socket', async () => {
      await shouldBeOn("AddCrownstone");
      await tap("Built_in_One");
      await waitToNavigate("installingBuiltinOne_step1");
      await screenshot();
      await tap("installingBuiltinOne_step1_socketNext");
      await waitToNavigate("installingBuiltin_endSocket");
      await screenshot();
      await tap("installingBuiltin_endSocketNext");

      await goBackToAdd();
    })

    test('should be able to see all views for adding a builtinOne, ceilingLight', async () => {
      await shouldBeOn("AddCrownstone");
      await tap("Built_in_One");
      await waitToNavigate("installingBuiltinOne_step1");
      await tap("installingBuiltinOne_step1_ceilingNext");
      await waitToNavigate("installingBuiltin_endLight");
      await screenshot();
      await tap("installingBuiltin_endLightNext");

      await goBackToAdd();
    })

    test('should be able to see all views for adding a builtinOne, not Yet, socket', async () => {
      await shouldBeOn("AddCrownstone");
      await tap("Built_in_One");
      await waitToNavigate("installingBuiltinOne_step1");
      await tap("installingBuiltinOne_step1_notYetNext");
      await waitToNavigate("installingBuiltin_step2");
      await screenshot();
      await tap("installingBuiltinOne_step2_socketNext");
      await waitToNavigate("installingBuiltin_instructions_socket");
      await screenshot();
      await tap("installingBuiltin_instructions_socketNext");
      await waitToNavigate("installingBuiltin_endSocket");
      await tap("installingBuiltin_endSocketNext");

      await goBackToAdd();
    })

    test('should be able to see all views for adding a builtinOne, not Yet, ceilingLight', async () => {
      await shouldBeOn("AddCrownstone");
      await tap("Built_in_One");
      await waitToNavigate("installingBuiltinOne_step1");
      await tap("installingBuiltinOne_step1_notYetNext");
      await waitToNavigate("installingBuiltin_step2");
      await tap("installingBuiltinOne_step2_ceilingNext");
      await waitToNavigate("installingBuiltin_instructions_light");
      await screenshot();
      await tap("installingBuiltin_instructions_lightNext");
      await waitToNavigate("installingBuiltin_endLight");
      await tap("installingBuiltin_endLightNext");

      await goBackToAdd();
    })

    test('should be able to see all views for adding a hub', async () => {
      await shouldBeOn("AddCrownstone");
      await tap("Hub");
      await waitToNavigate("installingHub_step1");
      await screenshot();

      await tap("installingHub_step1Next");
      await waitToNavigate("installingHub_step2");
      await screenshot();

      await tap("installingHub_step2Next");
      await waitToNavigate("installingHub_step3");
      await screenshot();

      await tap("installingHub_step3Next");

      await goBackToAdd();
    })

    test('should be able to see all views for adding a guidestone', async () => {
      await shouldBeOn("AddCrownstone");
      await scrollDownUntilVisible('Guidestone', 'addCrownstone_scrollView')
      await tap("Guidestone");
      await waitToNavigate("installingGuidestone");
      await screenshot();

      await tap("guideStoneNext");

      await goBackToAdd();
    })

    test('should be able to see all views for adding a CrownstoneUSB', async () => {
      await shouldBeOn("AddCrownstone");
      await scrollDownUntilVisible('Crownstone_USB', 'addCrownstone_scrollView')
      await tap("Crownstone_USB");
      await waitToNavigate("installingUSB");
      await screenshot();

      await tap("USBNext");

      await goBackToAdd();
    })

    test('should be able to buy Crownstones', async () => {
      await shouldBeOn("AddCrownstone");
      await scrollDownUntilVisible('BuyCrownstones','addCrownstone_scrollView');
      await tap("BuyCrownstones");
      await waitToNavigate('BuyCrownstonesCard');
      await screenshot();

      await visitLink('toStore');

      await checkBackOption("topBarLeftItem",'addCrownstone_selection', {restoreState: async () => {
        await scrollDownUntilVisible('BuyCrownstones','addCrownstone_scrollView');
        await tap("BuyCrownstones");
        await waitToNavigate('BuyCrownstonesCard');
      }});
    })
  }

  test('should be able go back to the sphereAdd menu', async () => {
    await shouldBeOn("AddCrownstone");
    await checkBackOption("topBarLeftItem",'SphereAdd', 'AddCrownstone_button', 'AddCrownstone');
  })
};


async function goBackToAdd(backAndForth = false) {
  await waitToNavigate("ScanningForSetupCrownstones");
  if (backAndForth) {
    await checkBackOption("closeModal",'SphereAdd', {restoreState: async () => {
      await tap("AddCrownstone_button");
      await waitToNavigate("AddCrownstone");
      await tap("Plug");
      await waitToNavigate("installingPlug");
      await tap("installingPlugNext");
      await waitToNavigate("ScanningForSetupCrownstones");
    }});
  }
  else {
    await tapPossibleDuplicate("closeModal");
    await waitToNavigate("SphereAdd");
  }
  await tap("AddCrownstone_button");
  await waitToNavigate("AddCrownstone");
}
