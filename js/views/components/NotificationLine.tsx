import { Component } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import * as React from "react";
import { colors, screenWidth, styles } from "../styles";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { HiddenFadeIn, HiddenFadeInView } from "./animated/FadeInView";
import { SlideFadeInView } from "./animated/SlideFadeInView";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";


export class NotificationLine extends Component<{notificationsVisible?: boolean}, any> {

  _getNotifications() {
    let color = colors.menuTextSelected.hex;
    let notifications = [];
    if (OnScreenNotifications.hasNotifications()) {
      notifications.push(
        <SlideFadeInView key={"sphereUpdate"} visible={this.props.notificationsVisible} height={64}>
          <View style={{backgroundColor:colors.white.hex, height: 2, width: screenWidth}} />
          <TouchableOpacity style={{...styles.centered, flexDirection:'row', backgroundColor: color, height: 60, width: screenWidth}}>
            <View style={{flex:1}}/>
            <IconButton name={'c1-update-arrow'}  size={34} buttonSize={40} radius={20} color={color} buttonStyle={{backgroundColor: colors.white.hex}} />
            <View style={{width:10}}/>
            <Text style={{color: colors.white.hex, fontSize: 17, fontWeight:'bold'}}>{"Sphere update available!"}</Text>
            <View style={{flex:1}}/>
          </TouchableOpacity>
          <View style={{backgroundColor:colors.white.hex, height: 2, width: screenWidth}} />
        </SlideFadeInView>
      )
    }
    return notifications;
  }


  render() {
    let notifications = this._getNotifications();
    return (
      <View>
        {notifications}
        <SlideFadeInView visible={!this.props.notificationsVisible || notifications.length == 0} height={2}>
          <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} />
        </SlideFadeInView>
      </View>
    );

  }
}