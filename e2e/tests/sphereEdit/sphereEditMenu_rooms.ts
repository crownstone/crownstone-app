import {
  $, checkBackAndForthOption, checkBackOption, delay, isIos, longPress, replaceText, screenshot, shouldBeOn, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {by, device, expect, element, waitFor} from 'detox';
import {Assistant, CONFIG} from "../../testSuite.e2e";

const ROOM_NAME = 'TestRoom_1';

export const SphereEditMenu_rooms = () => {
  if (CONFIG.ONLY_ESSENTIALS !== false) { return; }

  test('should be on the SphereEdit view', async () => {
    await waitToStart('SphereEdit');
  })

  test('should go to the Rearrange rooms mode', async () => {
    await tap('SphereEdit_rooms')
    await waitToNavigate('SphereRoomArranger');
    await screenshot();
  })

  test('should be able to cancel', async () => {
    await shouldBeOn('SphereRoomArranger');
    await checkBackAndForthOption(
      'cancel',
      'SphereOverview',
      {
        afterBack: async () => {
          await tap('editSphere')
          await waitToNavigate('SphereEdit');
          await tap('SphereEdit_rooms')
          await waitToNavigate('SphereRoomArranger');
        }
      },
      'SphereRoomArranger'
    );
  })

  test('should be able auto-arrange rooms and save', async () => {
    await shouldBeOn("SphereRoomArranger");
    await tap('SphereRoomArranger_autoArrange');
    await delay(1000);
    await screenshot();
    await tap('savePositions');
    await waitToNavigate('SphereOverview');
  })

  test('should be able to rearrange rooms by press and holding (iOS only)', async () => {
    if (isIos()) {
      // Longpress on android does not support a custom duration, so it can't perform this test.
      await Assistant.update();
      let roomIdToPress = await Assistant.getRoomId();
      await longPress(`RoomCircle${roomIdToPress}`);
      await delay(200);
      await screenshot();
      await tap("cancel");
      await delay(200);
      await expect($("cancel")).not.toBeVisible();
    }

    await tap("editSphere");
    await waitToNavigate('SphereEdit');
  })
};
