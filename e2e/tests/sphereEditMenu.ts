import { by, device, expect, element, waitFor } from 'detox';
import {
  $, delay, replaceText, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow
} from "../util/testUtil";
import {Assistant, CONFIG} from "../testSuite.e2e";

export const SphereEditMenu = () => {
  test('should be on the SphereOverview view', async () => {
    await waitToNavigate('SphereOverview');
    await Assistant.update()
  })
};
