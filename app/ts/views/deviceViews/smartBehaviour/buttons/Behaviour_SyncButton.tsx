import { colors } from "../../../styles";
import { core } from "../../../../Core";
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
            setTimeout(() => {
              core.eventBus.emit("hideLoading");
            }, 500);
          })
          .catch((err) => {
            Alert.alert(
              "Failed to sync",
              err?.message ?? "Unknown reason.",
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