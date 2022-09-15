import { by, device, expect, element, waitFor } from 'detox';
import {
  $,
  delay,
  longPress,
  replaceText,
  screenshot, scrollDownUntilVisible,
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

export const Stone_edit_start = () => {

  test('should be on the SphereOverview view', async () => {
    await waitToStart('SphereOverview');
  })

  test('should be able to go to stoneEdit of a Crownstone via longpress', async () => {
    // update the assistant for later use.
    await Assistant.update();

    let roomIdToPress = await Assistant.getRoomId(0);
    await tap(`RoomCircle${roomIdToPress}`);
    await waitToNavigate('RoomOverview');

    let stoneIdToPress = await Assistant.getStoneId(0);
    await scrollDownUntilVisible(`deviceEntry_${stoneIdToPress}_edit`, 'RoomOverview_NestableScrollContainer');
    await longPress(`deviceEntry_${stoneIdToPress}_edit`);
    await waitToNavigate('DeviceOverview');
    await screenshot();
    await tap('closeModal');
    await waitToNavigate('RoomOverview');
  })

  test('should be able to go to stoneEdit of a Crownstone via edit icon', async () => {
    await waitToNavigate('RoomOverview');

    await tap(`editIcon`);
    await waitToAppear(`editRoom`);

    let stoneIdToPress = await Assistant.getStoneId(0);
    await scrollDownUntilVisible(`deviceEntry_${stoneIdToPress}_edit`, 'RoomOverview_NestableScrollContainer');
    await tap(`deviceEntry_${stoneIdToPress}_edit`);
    await waitToNavigate('DeviceOverview');
    await screenshot();
  })

};
