import { LiveComponent }          from "../LiveComponent";
import { Text, TouchableOpacity, View } from "react-native";
import * as React from "react";
import { colors, screenWidth, styles } from "../styles";
import { SlideFadeInView } from "./animated/SlideFadeInView";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";
import { core } from "../../Core";
import {Icon} from "./Icon";
import {ActiveSphereManager} from "../../backgroundProcesses/ActiveSphereManager";
import {useEvent} from "./hooks/eventHooks";
import {useState} from "react";
import {BlurMessageBar} from "./BlurEntries";


const NotificationPadding = 10;

export class NotificationLine extends LiveComponent<{showNotifications?: boolean}, any> {

  unsubscribe = [];
  hasNotifications = false;
  componentDidMount(): void {
    this.unsubscribe.push(core.eventBus.on("onScreenNotificationsUpdated", () => { this.forceUpdate(); }))
    this.unsubscribe.push(
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (change.changeSpheres || change.updateActiveSphere) {
          this.forceUpdate();
        }
      })
    );
  }

  componentWillUnmount(): void {
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }

  _getNotifications() {
    if (!this.props.showNotifications) { return; }

    let defaultColor = colors.blue;
    let notifications = [];

    let activeSphereId = ActiveSphereManager.getActiveSphereId()

    let availableNotifications = OnScreenNotifications.getNotifications(activeSphereId);
    let notificationIds = Object.keys(availableNotifications);

    let amountOfNotifications = notificationIds.length;
    for (let i = 0; i < amountOfNotifications; i++) {
      let notificationId = notificationIds[i];
      let notification = availableNotifications[notificationId];
      notifications.push(
        <TouchableOpacity
          key={notificationId}
          style={{...styles.centered, width: screenWidth}}
          onPress={() => { notification.callback(); }}
        >
          <BlurMessageBar
            backgroundColor={notification.backgroundColor || defaultColor.rgba(0.5)}
          >
            { notification.icon ? <Icon name={notification.icon} size={notification.iconSize || 34} color={ colors.black.hex } /> : undefined }
            { notification.icon ? <View style={{width:10}}/> : undefined }
            <Text style={{color: colors.black.hex, fontSize: 17, fontWeight:'bold'}}>{notification.label}</Text>
          </BlurMessageBar>
        </TouchableOpacity>
      )
    }
    this.hasNotifications = Object.keys(availableNotifications).length > 0

    return (
      <SlideFadeInView
        visible={this.hasNotifications}
        height={Math.max(1, Object.keys(availableNotifications).length) * (60 + NotificationPadding)}
        style={{paddingTop: NotificationPadding, justifyContent:'space-between'}}
      >
        {notifications}
      </SlideFadeInView>
    );
  }


  render() {
    return (
      <React.Fragment>
        { this._getNotifications() }
      </React.Fragment>
    );

  }
}

export function NotificationFiller(props) {
  let [token, render] = useState(0);
  useEvent('onScreenNotificationsUpdated', () => {render(token++)});

  let availableNotifications = OnScreenNotifications.getNotifications(ActiveSphereManager.getActiveSphereId());
  let hasNotifications = Object.keys(availableNotifications).length > 0
  return (
    <SlideFadeInView
      visible={props.visible ?? hasNotifications}
      height={Math.max(1, Object.keys(availableNotifications).length) * (60 + NotificationPadding)}
    />
  )
}