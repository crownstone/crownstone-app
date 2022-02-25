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
  tapSingularAlertButton,
  waitToNavigate,
  waitToShow,
  waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const Rooms_edit = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SphereOverview view', async () => {
    await waitToStart('SphereOverview');
    await screenshot();

    // update the assistant for later use.
    await Assistant.update();
  })

  test('should go to the RoomOverview when you tap a room', async () => {
    let roomIdToPress = await Assistant.getRoomId();
    await tap(`RoomCircle${roomIdToPress}`);
    await waitToNavigate('RoomOverview');
    await screenshot();
  })

  test('should go to RoomEdit when you tap edit', async () => {
    await tap(`edit`);
    await waitToNavigate('RoomEdit');
    await screenshot();
  })

  test('should be able to change the room name', async () => {
    await replaceText("roomName", "TestRoom_2");
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

  test('should be able to change the room image', async () => {
    await tap('roomPicture');
    await tap("optionsPhotoLibrary");
    await screenshot();
  })

  test('should be able cancelling and not store any changes.', async () => {
    await tap('cancelModal');
    await waitToNavigate('RoomOverview');
    await tap(`edit`);
    await waitToNavigate('RoomEdit');
    await expect($("roomName")).not.toHaveText('TestRoom_2');
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
    await tap("optionsPhotoLibrary");
    await tap('save');
    await waitToNavigate('RoomOverview');
  })

  test('should be able to delete a room', async () => {
    await tap(`edit`);
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
