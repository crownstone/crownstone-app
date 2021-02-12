
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("InviteCenter", key)(a,b,c,d,e);
}
import { CLOUD } from "../cloud/cloudAPI";
import { core } from "../core";
import { OnScreenNotifications } from "../notifications/OnScreenNotifications";
import { ScaledImage } from "../views/components/ScaledImage";
import { colors, screenHeight, styles } from "../views/styles";
import * as React from "react";
import { View, Text, Alert } from "react-native";
import { TextButton} from "../views/components/InterviewComponents";
import { LOGe } from "../logging/Log";

export const InviteCenter = {

  availableInvites: {}, // sphereId: {role, state: 'accepted' | 'declined' | 'pending'}

  checkForInvites: function() {
    return CLOUD.getPendingInvites()
      .then((spheresImInvitedTo) => {
        if (spheresImInvitedTo.length === 0) {
          OnScreenNotifications.removeAllNotificationsFrom("InviteCenterClass")
        }

        spheresImInvitedTo.forEach((sphereData) => {
          OnScreenNotifications.setNotification({
            source: "InviteCenterClass",
            id: "invitationToSphere" + sphereData.id,
            label: lang("You_have_been_invited_"),
            icon: "ios-mail",
            callback: () => {
              core.eventBus.emit("showCustomOverlay", {
                backgroundColor: colors.green.hex,
                content: (
                  <View style={{flex:1}}>
                    <Text style={styles.header}>{ lang("Your_invitation_awaits_") }</Text>
                    <View style={{flex:1}} />
                    <View style={{...styles.centered, height:0.2*screenHeight}}>
                      <ScaledImage source={require("..../assets/images/invitationLetter.png")} sourceWidth={400} sourceHeight={400} targetHeight={0.2*screenHeight} />
                    </View>
                    <View style={{flex:1}} />
                    <Text style={styles.explanation}>{ lang("You_have_been_invited_to_j",sphereData.name) }</Text>
                    <View style={{flex:1}} />
                    <TextButton
                      label={ lang("Accept")}
                      callback={() => { InviteCenter.acceptInvitation(sphereData.id); }}
                      backgroundColor={colors.white.rgba(0.1)}
                      textColor={colors.csBlue.hex}
                      rounded={ true }
                    />
                    <View style={{flex:0.5}} />
                    <TextButton
                      label={ lang("Decline")}
                      callback={() => { InviteCenter.declineInvitation(sphereData.id); }}
                      selected={false}
                      backgroundColor={colors.white.rgba(0.1)}
                      borderColor={colors.csOrange.hex}
                      textColor={colors.csBlue.hex}
                      rounded={ true }
                    />
                    <View style={{height:5}} />
                  </View>
                )
              });
            }
          });
        })
      })
      .catch((err) => {LOGe.cloud("Something went wrong while checking for invitations", err); })
  },

  acceptInvitation: function(sphereId) {
    core.eventBus.emit("showLoading", "Accepting invitation...");
    CLOUD.forSphere(sphereId).acceptInvitation()
      .then(() => {
        return CLOUD.sync()
      })
      .then(() => {
        OnScreenNotifications.removeNotification("invitationToSphere" + sphereId);
        Alert.alert(
lang("_Welcome___The_invitation__header"),
lang("_Welcome___The_invitation__body"),
[{text:lang("_Welcome___The_invitation__left")}]);
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("hideCustomOverlay");
      })
      .catch((err) => {
        LOGe.cloud("Something went wrong while accepting the invitation", err);
        Alert.alert(
lang("_Something_went_wrong_____Y_header"),
lang("_Something_went_wrong_____Y_body"),
[{text:lang("_Something_went_wrong_____Y_left")}]);
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("hideCustomOverlay");
      })
  },

  declineInvitation: function(sphereId) {
    core.eventBus.emit("showLoading", "Declining invitation...");
    CLOUD.forSphere(sphereId).declineInvitation()
      .then(() => {
        OnScreenNotifications.removeNotification("invitationToSphere" + sphereId);
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("hideCustomOverlay");
      })
      .catch((err) => {
        LOGe.cloud("Something went wrong while declining the invitation", err);
        Alert.alert(
lang("_Something_went_wrong_____Yo_header"),
lang("_Something_went_wrong_____Yo_body"),
[{text:lang("_Something_went_wrong_____Y_left")}]);
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("hideCustomOverlay");
      })
  }
}
