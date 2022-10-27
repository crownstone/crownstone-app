import { by, device, expect, element, waitFor } from 'detox';
import {
  $, checkBackOption,
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

export const Stone_edit_close = () => {

  test('should be go back to SphereOverview view from the deviceOverview', async () => {
    await waitToNavigate('DeviceOverview');
    await tap('closeModal');
    await waitToNavigate('RoomOverview');
    await tap('back');
    await waitToNavigate('SphereOverview');
  })


};
