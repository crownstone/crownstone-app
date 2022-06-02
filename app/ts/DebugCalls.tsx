import {OnScreenNotifications} from "./notifications/OnScreenNotifications";
import {core} from "./Core";
import {colors, screenHeight, styles} from "./views/styles";
import * as React from "react";
import {NavigationUtil} from "./util/navigation/NavigationUtil";
import {OverlayUtil} from "./views/overlays/OverlayUtil";
import {RoomList} from "./views/components/RoomList";
import {SELECTABLE_TYPE} from "./Enums";

export function DebugNotifications() {
  let activeSphereId = core.store.getState().app.activeSphere;

  // OnScreenNotifications.setNotification({
  //   source: "InviteCenterClassX",
  //   id: "invitationToSphere" + activeSphereId,
  //   label: 'invited',
  //   icon: "ios-mail",
  //   callback: () => {
  //     core.eventBus.emit("showCustomOverlay", {
  //       backgroundColor: colors.green.rgba(0.5),
  //     });
  //   }
  // });
  //
  // OnScreenNotifications.setNotification({
  //   source: "BleStateOverlayX",
  //   id: "bluetoothState",
  //   label: "Bluetooth disabled",
  //   icon: "ios-bluetooth",
  //   backgroundColor: colors.csOrange.rgba(0.5),
  //   callback: () => {
  //     NavigationUtil.showOverlay('BleStateOverlay', { notificationType: this.state.notificationType, type: this.state.type });
  //   }
  // })
}

export function DebugOverlays() {
  // let activeSphereId = core.store.getState().app.activeSphere;
  // OverlayUtil.callRoomSelectionOverlay(activeSphereId, (roomId) => {
  //
  // })
}

export function Debug() {
  DebugCustomView();
  DebugPopup()
}


function DebugPopup() {
  // setTimeout(() => {
  //   core.eventBus.emit('showDimLevelOverlay', {
  //     initialValue: 50,
  //     callback: (newTime: aicoreTime) => {
  //
  //     },
  //   })
  // },200);
}

function DebugCustomView() {
  // setTimeout(() => {
  // NavigationUtil.launchModal("DeviceSmartBehaviour_CopyStoneSelection",{
  //   "sphereId": "8525eed2-684d-f73a-b54d-13f1db84e610",
  //   "stoneId": "9dbe67aa-b176-c1aa-d444-2ab5582c6c1",
  //   "copyType": "TO",
  //   "originId": "9dbe67aa-b176-c1aa-d444-2ab5582c6c1"
  // })},
  //   300);
}
