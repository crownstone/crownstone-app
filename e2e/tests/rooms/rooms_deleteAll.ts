import {
  $, delay, longPress, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Rooms_deleteAll = () => {
  // if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be able to delete all rooms, one by one.', async () => {
    await Assistant.update();
    let roomCount = await Assistant.getRoomCount();
    console.log("ROOM COUNT: ", roomCount);
    for (let i = 0; i < roomCount; i++) {
      let roomIdToPress = await Assistant.getRoomId(i);
      await waitToNavigate("SphereOverview");
      await tap(`RoomCircle${roomIdToPress}`);
      await waitToNavigate('RoomOverview');
      await tap(`editIcon`);
      await tap(`editRoom`);
      await waitToNavigate('RoomEdit');
      await tap('roomRemove');
      await screenshot();
      await tapAlertOKButton();
    }

    await waitToNavigate("SphereOverview_addRoom");
    await Assistant.update();

    if (await Assistant.getRoomCount() !== 0) {
      console.error("Not all rooms have been deleted on the cloud...")
      throw new Error("Not all rooms have been deleted on the cloud...");
    }
  })
};
