import {
  $, delay, longPress, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Rooms_deleteAll = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be able to delete all rooms, one by one.', async () => {
    await Assistant.update();
    let roomCount = await Assistant.getRoomCount();

    for (let i = 0; i < roomCount; i++) {
      let roomIdToPress = await Assistant.getRoomId(i);
      await waitToNavigate("SphereOverview");
      await tap(`RoomCircle${roomIdToPress}`);
      await waitToNavigate('RoomOverview');
      await tap(`edit`);
      await waitToNavigate('RoomEdit');
      await tap('roomRemove');
      await screenshot();
      await tapAlertOKButton();
    }

    await Assistant.update();
    await waitToNavigate("SphereOverview_addRoom");

    if (await Assistant.getRoomCount() !== 0) {
      throw "Not all rooms have been deleted on the cloud...";
    }
  })
};
