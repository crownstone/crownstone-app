import { by, device, expect, element, waitFor } from 'detox';
import {
  $,
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

export const Rooms_edit = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SphereOverview view', async () => {
    await waitToStart('SphereOverview');

    // update the assistant for later use.
    await Assistant.update();
  })

  test('should go to the RoomOverview when you tap a room', async () => {
    let roomIdToPress = await Assistant.getRoomIdByName('Living Room');
    await tap(`RoomCircle${roomIdToPress}`);
    await waitToNavigate('RoomOverview');
    await screenshot();
  })

  test('should be able to show and hide the edit button', async () => {
    await tap(`editIcon`);
    await waitToAppear(`editRoom`);
    await tap(`editDone`);
    await tap(`editRoomLabel`);
    await tap(`editIcon`);
    await tap(`editRoomLabel`);
    await waitToNavigate('RoomEdit');
    await tap('cancelModal');
    await tap(`editDone`);
  })

  test('should go to RoomEdit when you tap edit', async () => {
    await tap(`editIcon`);
    await tap(`editRoom`);
    await waitToNavigate('RoomEdit');
    await screenshot();
  })

  test('should be able to change the room name', async () => {
    await replaceText("roomName", "TestRoom_x");
    await tapReturnKey('roomName');
    await screenshot();
  })

  test('should be able to change the room icon', async () => {
    await tap('roomIcon');
    await waitToNavigate('RoomIconSelection');
    await tap('bedRoom');
    await delay(300);
    await screenshot();
    await tap('c1-bunkBeds');
    await waitToNavigate('RoomEdit');
    await screenshot();
  })

  test('should be able to got to the room image selector and back', async () => {
    await tap('roomPicture');
    await waitToNavigate("RoomPictureSelection");
    await screenshot();
    await tap('closeModal')
    await waitToNavigate("RoomEdit");
  })

  test('should be able to select a stock image', async () => {
    await tap('roomPicture');
    await waitToNavigate("RoomPictureSelection");
    await tap('stockImage_csBlue');
    await waitToNavigate("RoomEdit");
    await screenshot();
  })

  test('should be able to select a custom image', async () => {
    await tap('roomPicture');
    await waitToNavigate("RoomPictureSelection");
    await tap('customBackgroundPicture');
    await screenshot();
    await tap("optionsCancel")
    await tap('customBackgroundPicture');
    await tap("optionsPhotoLibrary")
    await waitToNavigate("RoomEdit");
    await screenshot();
  })

  test('should be able cancelling and not store any changes.', async () => {
    await tap('cancelModal');
    await waitToNavigate('RoomOverview');
    await screenshot();
    await tap(`editRoom`);
    await waitToNavigate('RoomEdit');
    await expect($("roomName")).not.toHaveText('TestRoom_x');
  })

  test('should be able to save the changes', async () => {
    await replaceText("roomName", "TestRoom_2");
    await tapReturnKey('roomName');
    await tap('roomIcon');
    await waitToNavigate('RoomIconSelection');
    await tap('bedRoom');
    await delay(300);
    await tap('c1-bunkBeds');
    await waitToNavigate('RoomEdit');
    await tap('roomPicture');
    await waitToNavigate("RoomPictureSelection");
    await tap('stockImage_csBlue');
    await waitToNavigate('RoomEdit');
    await tap('save');
    await waitToNavigate('RoomOverview');
  })

  test('should be able to delete a room', async () => {
    await tap(`editRoom`);
    await waitToNavigate('RoomEdit');
    await expect($("roomName")).toHaveText('TestRoom_2');
    await tap('roomRemove');
    await screenshot();
    await tapAlertCancelButton()
    await tap('roomRemove');
    await screenshot();
    await tapAlertOKButton();
    await waitToNavigate("SphereOverview");
  })
};
