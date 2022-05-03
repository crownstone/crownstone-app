import * as React from 'react';
import {
  TouchableOpacity,
  View, ViewStyle
} from "react-native";
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { Permissions } from "../../../backgroundProcesses/PermissionManager";
import { SPHERE_OVERVIEW_BUTTON_ICON_SIZE, SphereOverviewButton } from "./SphereOverviewButton";
import { Line, Svg } from "react-native-svg";


export function AddItemButton(props: {inSphere: boolean, arrangingRooms: boolean, sphereId: string, noCrownstones: boolean}) {
  if (Permissions.inSphere(props.sphereId).addRoom) {
    let highLight = props.noCrownstones && Permissions.inSphere(props.sphereId).seeSetupCrownstone;

    return (
      <SphereOverviewButton
        visible={props.arrangingRooms === false && props.inSphere}
        customIcon={<AddIconSVG size={18} color={colors.white.hex} opacity={1} />}
        position={"bottom-right"}
        testID={"AddToSphereButton"}
        callback={() => { NavigationUtil.launchModal( "AddItemsToSphere",{sphereId: props.sphereId}); }}
        highlight={highLight}
      />
    );
  }
  return <View />;
}

export function AddIconSVG({ size, color, opacity }) {
  let mid = 0.5*size;
  let margin = 2;
  return (
    <Svg style={{width:size, height:size}}>
      <Line x1={margin} y1={mid} x2={size-margin} y2={mid} stroke={color} strokeOpacity={opacity} strokeLinecap={"round"} strokeWidth={0.15*size}/>
      <Line x1={mid} y1={margin} x2={mid} y2={size-margin} stroke={color} strokeOpacity={opacity} strokeLinecap={"round"} strokeWidth={0.15*size}/>
    </Svg>
  );
}
