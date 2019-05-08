import { CLOUD } from "../cloud/cloudAPI";
import { core } from "../core";
import { OnScreenNotifications } from "../notifications/OnScreenNotifications";
import { ScaledImage } from "../views/components/ScaledImage";
import { colors, screenHeight, styles } from "../views/styles";
import * as React from "react";
import { View, Text, Alert } from "react-native";
import { TextButton, TextButtonLight, TextButtonSemitranslucentDark } from "../views/components/InterviewComponents";
import { LOGe } from "../logging/Log";

class InviteCenterClass {

  availableInvites = {}; // sphereId: {role, state: 'accepted' | 'declined' | 'pending'}

  checkForInvites() {
    return CLOUD.getPendingInvites()
      .then((spheresImInvitedTo) => {
        if (spheresImInvitedTo.length === 0) {
          OnScreenNotifications.removeAllNotificationsFrom("InviteCenterClass")
        }

        spheresImInvitedTo.forEach((sphereData) => {
          OnScreenNotifications.setNotification({
            source: "InviteCenterClass",
            id: "invitationToSphere" + sphereData.id,
            label:"You have been invited!",
            icon: "ios-mail",
            callback: () => {
              core.eventBus.emit("showCustomOverlay", {
                backgroundColor: colors.green.hex,
                content: (
                  <View style={{flex:1}}>
                    <Text style={styles.header}>{"Your invitation awaits!"}</Text>
                    <View style={{flex:1}} />
                    <View style={{...styles.centered, height:0.2*screenHeight}}>
                      <ScaledImage source={require("../images/invitationLetter.png")} sourceWidth={400} sourceHeight={400} targetHeight={0.2*screenHeight} />
                    </View>
                    <View style={{flex:1}} />
                    <Text style={styles.explanation}>{"You have been invited to join the sphere called " + sphereData.name + "!\n\nDo you accept?"}</Text>
                    <View style={{flex:1}} />
                    <TextButton
                      label={"Accept"}
                      callback={() => { this.acceptInvitation(sphereData.id); }}
                      backgroundColor={colors.white.rgba(0.1)}
                      textColor={colors.csBlue.hex}
                      rounded={ true }
                    />
                    <View style={{flex:0.5}} />
                    <TextButton
                      label={"Decline"}
                      callback={() => { this.declineInvitation(sphereData.id); }}
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
  }

  acceptInvitation(sphereId) {
    core.eventBus.emit("showLoading", "Accepting invitation...")
    CLOUD.forSphere(sphereId).acceptInvitation()
      .then(() => {
        return CLOUD.sync()
      })
      .then(() => {
        OnScreenNotifications.removeNotification("invitationToSphere" + sphereId);
        Alert.alert("Welcome!", "The invitation has been accepted!", [{text:"OK!"}])
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("hideCustomOverlay");
      })
      .catch((err) => {
        LOGe.cloud("Something went wrong while accepting the invitation", err);
        Alert.alert("Something went wrong...", "You can try again later or accept via the email that was sent to you", [{text:"OK"}]);
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("hideCustomOverlay");
      })
  }

  declineInvitation(sphereId) {
    core.eventBus.emit("showLoading", "Declining invitation...")
    CLOUD.forSphere(sphereId).declineInvitation()
      .then(() => {
        OnScreenNotifications.removeNotification("invitationToSphere" + sphereId);
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("hideCustomOverlay");
      })
      .catch((err) => {
        LOGe.cloud("Something went wrong while declining the invitation", err);
        Alert.alert("Something went wrong...", "You can try again later or decline via the email that was sent to you", [{text:"OK"}]);
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("hideCustomOverlay");
      })
  }


}

export const InviteCenter = new InviteCenterClass();