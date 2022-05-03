import { TouchableOpacity, View, ViewStyle } from "react-native";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Icon } from "./Icon";
import { colors } from "../styles";
import * as React from "react";
import { core } from "../../Core";


export function DebugIcon(props : {sphereId: string, stoneId: string, customView?: string}) {
  let state = core.store.getState()
  if (!state.user.developer) { return <View />; }
  let wrapperStyle : ViewStyle = {
    width: 35,
    height: 35,
    position: 'absolute',
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: "center"
  };
  return (
    <TouchableOpacity
      onPress={() => { NavigationUtil.navigate( props.customView ?? "SettingsStoneBleDebug",{sphereId: props.sphereId, stoneId: props.stoneId}) }}
      style={wrapperStyle}>
      <Icon name={"ios-bug"} color={colors.csBlueDarker.rgba(0.5)} size={30} />
    </TouchableOpacity>
  );
}
