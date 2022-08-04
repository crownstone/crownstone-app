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
  let activeSphereId = core.store.getState().app.activeSphere;
  OverlayUtil.callCrownstoneSelectionOverlay(activeSphereId, (roomId) => {

  })
}

export function Debug() {
  // DebugCustomView();
  // DebugPopup()
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
  setTimeout(() => {
  NavigationUtil.launchModal("RoomTraining_conclusion",{"sphereId":"1aaef17a-48c9-f3de-8d0a-48b078f65ce5","locationId":"832b879a-deb6-636d-646-f5b027b37df","type":"IN_HAND"})}
  ,300);
}
