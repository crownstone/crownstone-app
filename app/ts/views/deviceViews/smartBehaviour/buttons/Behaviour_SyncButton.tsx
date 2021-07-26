import { colors } from "../../../styles";
import { core } from "../../../../core";
import { StoneDataSyncer } from "../../../../backgroundProcesses/StoneDataSyncer";
import { Alert } from "react-native";
import { Button } from "../../../components/Button";
import * as React from "react";

export function BehaviourSyncButton({sphereId, stoneId}) {
  return (
    <Button
      backgroundColor = { colors.csBlue.rgba(0.5) }
      label = { "Sync behaviour" }
      callback = {() =>  {
        core.eventBus.emit("showLoading", "Syncing...");
        StoneDataSyncer.checkAndSyncBehaviour(sphereId, stoneId, true)
          .then(() => {
            core.eventBus.emit("hideLoading");
          })
          .catch((err) => {
            Alert.alert(
              "Failed to sync",
              err,
              [{
                text: "OK", onPress: () => {
                  core.eventBus.emit("hideLoading");
                }
              }],
              { cancelable: false }
            )
          });
      }
    }
      icon = { 'md-refresh-circle' }
      iconSize = { 14 }
      iconColor = { colors.darkPurple.blend(colors.blue, 0.5).rgba(0.75) }
    />
  );
}