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
  test('should be on the SphereEdit view', async () => {
    await waitToStart('SphereEdit');
  })

  test('should go to the SphereEdit room overview', async () => {
    await tap('SphereEdit_rooms')
    await Assistant.update();
    await waitToNavigate('SphereEdit_RoomOverview');
    await screenshot();
  })

  if (CONFIG.ONLY_ESSENTIALS === false) {
    test('should go to the Rearrange rooms mode', async () => {
      await tap('SphereEdit_roomOverview_rearrange')
      await waitToNavigate('SphereRoomArranger');
      await screenshot();
    })

    test('should be able to cancel', async () => {
      await shouldBeOn('SphereRoomArranger');
      await checkBackAndForthOption(
        'cancel',
        'SphereEdit_RoomOverview',
        'SphereEdit_roomOverview_rearrange',
        'SphereRoomArranger'
      );
    })

    test('should be able auto-arrange rooms and save', async () => {
      await shouldBeOn("SphereRoomArranger");
      await tap('SphereRoomArranger_autoArrange');
      await delay(1000);
      await screenshot();
      await tap('save');
      await waitToNavigate('SphereEdit_RoomOverview');
    })

    test('should be able to go to the room when tapped on the room', async () => {
      let roomIdToNavigateTo = await Assistant.getRoomId();
      await tap(`SphereEdit_roomOverview_room${roomIdToNavigateTo}`)
      await waitToNavigate('RoomOverview');
      await screenshot();
    })

    test('should be able to rearrange rooms by press and holding (iOS only)', async () => {
      await shouldBeOn('RoomOverview')
      await tap('BackButton');
      await waitToNavigate('SphereOverview');
      
      if (isIos()) {
        // Longpress on android does not support a custom duration, so it can't perform this test.
        let roomIdToPress = await Assistant.getRoomId();
        await longPress(`RoomCircle${roomIdToPress}`);
        await delay(200);
        await screenshot();
        await tap("cancel");
        await delay(200);
        await expect($("cancel")).not.toBeVisible();
      }

      await tap("edit");
      await waitToNavigate('SphereEdit');
      await tap('SphereEdit_rooms')
      await waitToNavigate('SphereEdit_RoomOverview');
    })
  }


  test('should be able to create a room', async () => {
    await tap('SphereEdit_roomOverview_addRoom')
    await waitToNavigate('RoomAdd');
    await screenshot();
  });


  if (CONFIG.ONLY_ESSENTIALS === false) {
    test('should be able to go back from add room', async () => {
      await checkBackAndForthOption(
        'topBarLeftItem',
        'SphereEdit_RoomOverview',
        'SphereEdit_roomOverview_addRoom',
        'RoomAdd'
      );
    })

    test('should give a popup if no name is provided', async () => {
      await tap('RoomAdd_roomName_next')
      await screenshot();
      await tapSingularAlertButton();
    })
  }

  test('should be able to set the room name', async () => {
    await replaceText('RoomAdd_roomName', ROOM_NAME);
    await tapReturnKey('RoomAdd_roomName');
    await screenshot();
    await tap('RoomAdd_roomName_next')
    await waitToNavigate('RoomAdd_icon');
  })

  if (CONFIG.ONLY_ESSENTIALS === false) {
    test('should be able to pick an icon', async () => {
      await screenshot();
      await tap('RoomAdd_IconSelection');
      await waitToNavigate('RoomIconSelection');
      await screenshot();
      await tap('hallway');
      await delay(300);
      await screenshot();
      await tap('fiCS1-dungeon');
      await waitToNavigate('RoomAdd_icon');
      await screenshot();
    })

    test('should be able to pick a picture', async () => {
      await tap('PictureCircle');
      await tap("optionsPhotoLibrary");
    })

    test('should be able to remove picture', async () => {
      await tap('PictureCircleRemove');
      await tapAlertOKButton();
    })
  }
  test('should be able to pick a picture again', async () => {
    await tap('PictureCircle');
    await tap("optionsCamera");
    await screenshot();
  })

  test('should be able to create a room', async () => {
    await shouldBeOn("RoomAdd_icon");
    await Assistant.update();
    await tap('RoomAdd_CreateRoom');
    await waitToNavigate('RoomOverview');
    await checkBackOption(
      'BackButton',
      'SphereOverview',
      {restoreState: async () => {
          let roomIdToPress = await Assistant.getRoomId();
          await tap(`RoomCircle${roomIdToPress}`);
      }}
    );
    await waitToNavigate('SphereOverview');
    await tap('edit');
    await waitToNavigate('SphereEdit');
  })

  test('should have created the new room should', async () => {
    await Assistant.update();
    if (await Assistant.doesRoomNameExists(ROOM_NAME) === false) {
      console.error("Room does not exist.")
      throw "ROOM_DOES_NOT_EXIST";
    }
  })
};
