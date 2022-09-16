import {
  delay,
  screenshot, scrollDownUntilVisible, setSliderToPosition,
  tap,
  visitLink,
  waitToNavigate,
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";


export const Stone_edit_abilities_dimming = () => {


  test('should be able to enable dimming and sync it', async () => {
    await tap('dimming_toggle');
    await delay(300);
    await screenshot();
    // trigger an advertisement from the Crownstone to trigger constellation
    let stoneId = await Assistant.getStoneId(0);
    let handle = await Assistant.getStoneHandle(0);
    await Assistant.ble.sendGenericStoneAdvertisement(stoneId);

    await Assistant.ble.for(handle).succeed.connect('operation');
    await Assistant.ble.for(handle).succeed.allowDimming();
    await Assistant.ble.for(handle).succeed.disconnectCommand();

    await screenshot();
  });


  if (!CONFIG.ONLY_ESSENTIALS) {
    async function goToAbilitySettings() {
      await tap('dimming_settings');
      await waitToNavigate("Ability_DimmerSettings")
    }

    test('should be able to configure dimming use soft on', async () => {
      await goToAbilitySettings();
      await screenshot();

      let stoneId = await Assistant.getStoneId(0);
      let handle = await Assistant.getStoneHandle(0);

      await scrollDownUntilVisible("sliderSoftOn", 'AbilityDimming_scrollview')
      await setSliderToPosition('sliderSoftOn', 0.75);
      await screenshot();

      await Assistant.ble.sendGenericStoneAdvertisement(stoneId);
      await Assistant.ble.for(handle).succeed.connect('operation');
      await Assistant.ble.for(handle).succeed.setSoftOnSpeed();
      await Assistant.ble.for(handle).succeed.disconnectCommand();
    });

    test('should be able to configure dimming toggle soft on', async () => {
      let stoneId = await Assistant.getStoneId(0);
      let handle = await Assistant.getStoneHandle(0);

      await tap("toggleSoftOn");
      await screenshot();

      await Assistant.ble.sendGenericStoneAdvertisement(stoneId);
      await Assistant.ble.for(handle).succeed.connect('operation');
      await Assistant.ble.for(handle).succeed.setSoftOnSpeed();
      await Assistant.ble.for(handle).succeed.disconnectCommand();
    });


    test('should be able to configure dimming, visit link', async () => {
      await visitLink('dimmingCompatibility');
    });

    test('should be able to disable dimming', async () => {
      await scrollDownUntilVisible("disableDimming", 'AbilityDimming_scrollview')
      await tap("disableDimming");
      await waitToNavigate("DeviceAbilities");

      let stoneId = await Assistant.getStoneId(0);
      let handle = await Assistant.getStoneHandle(0);
      await Assistant.ble.sendGenericStoneAdvertisement(stoneId);
      await Assistant.ble.for(handle).succeed.connect('operation');
      await Assistant.ble.for(handle).succeed.allowDimming();
      await Assistant.ble.for(handle).succeed.disconnectCommand();
    });

    test('should be able to re-enable dimming and sync it', async () => {
      await tap('dimming_toggle');
      // trigger an advertisement from the Crownstone to trigger constellation
      let stoneId = await Assistant.getStoneId(0);
      let handle = await Assistant.getStoneHandle(0);
      await Assistant.ble.sendGenericStoneAdvertisement(stoneId);

      await Assistant.ble.for(handle).succeed.connect('operation');
      await Assistant.ble.for(handle).succeed.allowDimming();
      await Assistant.ble.for(handle).succeed.disconnectCommand();
    });
  }
};
