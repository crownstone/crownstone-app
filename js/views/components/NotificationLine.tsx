import { LiveComponent }          from "../LiveComponent";
import { Text, TouchableOpacity, View } from "react-native";
import * as React from "react";
import { colors, screenWidth, styles } from "../styles";
import { IconButton } from "./IconButton";
import { SlideFadeInView } from "./animated/SlideFadeInView";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";
import { core } from "../../core";


export class NotificationLine extends LiveComponent<{notificationsVisible?: boolean}, any> {

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
    if (!this.props.notificationsVisible) { return; }

    let color = colors.menuTextSelected.hex;
    let notifications = [];

    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;

    let availableNotifications = OnScreenNotifications.getNotifications(activeSphereId);

    Object.keys(availableNotifications).forEach((notificationId) => {
      let notification = availableNotifications[notificationId];
      notifications.push(
        <TouchableOpacity
          key={notificationId}
          style={{...styles.centered, flexDirection:'row', backgroundColor: color, height: 60, width: screenWidth}}
          onPress={() => { notification.callback(); }}
        >
          <View style={{flex:1}}/>
          { notification.icon ? <IconButton name={notification.icon} size={notification.iconSize || 34} buttonSize={40} radius={20} color={color} buttonStyle={{backgroundColor: colors.white.hex}} /> : undefined }
          { notification.icon ? <View style={{width:10}}/> : undefined }
          <Text style={{color: colors.white.hex, fontSize: 17, fontWeight:'bold'}}>{notification.label}</Text>
          <View style={{flex:1}}/>
        </TouchableOpacity>
      )
    });

    this.hasNotifications = Object.keys(availableNotifications).length > 0

    return (
      <SlideFadeInView
        visible={this.hasNotifications}
        height={Math.max(1, Object.keys(availableNotifications).length) * 60 + 4}
      >
        <View style={{backgroundColor:colors.white.hex, height: 2, width: screenWidth}} />
        {notifications}
        <View style={{backgroundColor:colors.white.hex, height: 2, width: screenWidth}} />
      </SlideFadeInView>
    );
  }


  render() {
    let notifications = this._getNotifications();
    return (
      <View>
        {notifications}
        <SlideFadeInView visible={!this.props.notificationsVisible || this.hasNotifications == false } height={2}>
          <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} />
        </SlideFadeInView>
      </View>
    );

  }
}