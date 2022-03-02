import { device, waitFor } from "detox";
import {
  $,
  delay,
  replaceText, screenshot,
  tap,
  tapAlertCancelButton,
  tapAlertOKButton,
  tapReturnKey,
  tapSingularAlertButton, visitLink,
  waitToNavigate, waitToShow
} from "../../util/TestUtil";
import {CONFIG} from "../../testSuite.e2e";


export const Initialization_buyCrownstones = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the splash screen', async () => {
    await waitToNavigate('LoginSplash');
    await waitToShow('BuyButton');
  })

  test('should be able to buy crownstones!', async () => {
    await visitLink('BuyButton');
  })


};
