import {
  $, delay, longPress, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapPossibleDuplicate, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Rooms_createRoom = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SphereOverview addRoom view', async () => {
    await waitToStart('SphereOverview_addRoom');
    await screenshot();

  })

  test('should be able to go to the add items page', async () => {
    await tap('Sidebar_button_sphereName');
    await delay(400);
    await tap('addItems', 1000, 50);
    await waitToNavigate('SphereAdd');
  })

  test('should be able to go to the add items page', async () => {
    await tap('AddRoom');
    await waitToNavigate('RoomAdd');
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

  test('should be able to create the room', async () => {
    await tap('RoomAdd_CreateRoom');
    await waitToNavigate('RoomOverview');
    await tap("back");
    await waitToNavigate('SphereOverview');
  })
};
