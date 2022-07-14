import {OnScreenNotifications} from "./notifications/OnScreenNotifications";
import {core} from "./Core";
import {colors, screenHeight, styles} from "./views/styles";
import * as React from "react";
import {NavigationUtil} from "./util/navigation/NavigationUtil";
import {RoomList} from "./views/components/RoomList";
import {SELECTABLE_TYPE} from "./Enums";
import { OverlayUtil } from "./util/OverlayUtil";

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
  // NavigationUtil.launchModal("Quickfix",{
  //   "sphereId":"2bb36a17-f6fd-5d1-41cc-cb92dd406c70"
  // })},
  //   300);
}
