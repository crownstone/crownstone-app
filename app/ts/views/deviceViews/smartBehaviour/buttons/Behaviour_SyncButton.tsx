
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Behaviour_SyncButton", key)(a,b,c,d,e);
}
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
lang("_Failed_to_sync_arguments_header"),
lang("_Failed_to_sync_arguments_body",err.message),
[{text: lang("_Failed_to_sync_arguments_left"), onPress: () => {
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