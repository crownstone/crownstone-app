import {
  screenshot,
  tap,
  visitLink,
  waitToNavigate,
  waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Stone_edit_abilities_end = () => {

  test('should be able to go back to theDeviceOverview view', async () => {
    await tap("BackButton")
    await waitToStart('DeviceOverview');
  });

};
