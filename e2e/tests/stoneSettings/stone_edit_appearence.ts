import { by, device, expect, element, waitFor } from 'detox';
import {
  $,
  delay,
  longPress,
  replaceText,
  screenshot,
  tap,
  tapAlertCancelButton,
  tapAlertOKButton,
  tapReturnKey,
  tapSingularAlertButton, waitToAppear, waitToDisappear,
  waitToNavigate,
  waitToShow,
  waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Stone_edit_appearence = () => {

  test('should be on the DeviceOverview view', async () => {
    await waitToStart('DeviceOverview');
  });

  test('should be able to go to the Appearance view', async () => {
    await tap("DeviceAppearence");
    await waitToNavigate('DeviceEditAppearence');
    await screenshot();
  });

  test('should be able to change the name and cancel without changes are applied.', async () => {
    await replaceText("deviceEdit_name", "testStoneName");
    await tapReturnKey("deviceEdit_name");
    await tap("cancelBack");
    await waitToNavigate('DeviceOverview');
    await screenshot();
    await tap(`DeviceAppearence`);
    await waitToNavigate('DeviceEditAppearence');
    await expect($("deviceEdit_name")).not.toHaveText('testStoneName');
  });

  test('should be able to change the items and save.', async () => {
    await replaceText("deviceEdit_name", "testStoneName");
    await tapReturnKey("deviceEdit_name");
    await replaceText("deviceEdit_description", "My test Crownstone");
    await tapReturnKey("deviceEdit_description");
    await tap('deviceEdit_icon');
    await waitToNavigate('DeviceIconSelection');
    await tap('ceilingLights');
    await delay(300);
    await tap('fiCS1-bar');
    await waitToNavigate('DeviceEditAppearence');
    await tap('save');
    await waitToNavigate('DeviceOverview');
    await screenshot();
    await tap(`DeviceAppearence`);
    await waitToNavigate('DeviceEditAppearence');
    await expect($("deviceEdit_name")).toHaveText('testStoneName');
    await tap("cancelBack");
    await waitToNavigate('DeviceOverview');
  });

};
