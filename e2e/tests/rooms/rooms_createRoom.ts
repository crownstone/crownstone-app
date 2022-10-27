import {
  $, checkBackOption, delay, longPress, replaceText, screenshot, shouldBeOn, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapPossibleDuplicate, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Rooms_createRoom = () => {
  // if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SphereOverview addRoom view', async () => {
    await waitToStart('SphereOverview_addRoom');
    await screenshot();

  })

  test('should be able to go to the add items page', async () => {
    await tap('Sidebar_button_sphereName');
    await delay(400);
    await tap('addItems',50);
    await waitToNavigate('SphereAdd');
  })

  test('should be able to go to the add items page', async () => {
    await tap('AddRoom');
    await waitToNavigate('RoomAdd');
  })


  test('should give a popup if no name is provided', async () => {
    await tap('RoomAdd_roomName_next')
    await screenshot();
    await tapSingularAlertButton();
  })


  test('should be able to set a name', async () => {
    await replaceText('RoomAdd_roomName', "Kitchen");
    await tapReturnKey('RoomAdd_roomName');
    await tap('RoomAdd_roomName_next')
    await waitToNavigate('RoomAdd_icon');
  })


  test('should be able to set an icon', async () => {
    await tap('RoomAdd_IconSelection');
    await waitToNavigate('RoomIconSelection');
    await screenshot();
    await tap('office');
    await delay(300);
    await screenshot();
    await tap('fiCS1-desk-5');
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
      'back',
      'SphereOverview',
      {restoreState: async () => {
          let roomIdToPress = await Assistant.getRoomId();
          await tap(`RoomCircle${roomIdToPress}`);
        }}
    );
    await waitToNavigate('SphereOverview');
  })

};
