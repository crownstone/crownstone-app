import { LiveComponent }          from "../LiveComponent";
import { Text, TouchableOpacity, View } from "react-native";
import * as React from "react";
import { colors, screenWidth, styles } from "../styles";
import { IconButton } from "./IconButton";
import { SlideFadeInView } from "./animated/SlideFadeInView";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";
import { core } from "../../core";


export class NotificationLine extends LiveComponent<{notificationsVisible?: boolean}, any> {

  unsubscribe: any;
  componentDidMount(): void {
    this.unsubscribe = core.eventBus.on("onScreenNotificationsUpdated", () => { this.forceUpdate(); })
  }

  componentWillUnmount(): void {
    this.unsubscribe();
  }

  _getNotifications() {
    let color = colors.menuTextSelected.hex;
    let notifications = [];

    Object.keys(OnScreenNotifications.notifications).forEach((notificationId) => {
      let notification = OnScreenNotifications.notifications[notificationId];
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

    return (
      <SlideFadeInView
        visible={OnScreenNotifications.hasNotifications()}
        height={Math.max(1,OnScreenNotifications.count()) * 60 + 4}
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
        <SlideFadeInView visible={!this.props.notificationsVisible || OnScreenNotifications.hasNotifications() == false } height={2}>
          <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} />
        </SlideFadeInView>
      </View>
    );

  }
}