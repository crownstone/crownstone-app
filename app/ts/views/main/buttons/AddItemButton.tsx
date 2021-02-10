import * as React from 'react';
import {
  TouchableOpacity,
  View, ViewStyle
} from "react-native";
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { Permissions } from "../../../backgroundProcesses/PermissionManager";


export function AddItemButton(props: {inSphere: boolean, arrangingRooms: boolean, sphereId: string, noCrownstones: boolean}) {
  if (Permissions.inSphere(props.sphereId).addRoom) {
    let setupIcon = props.noCrownstones && Permissions.inSphere(props.sphereId).seeSetupCrownstone;

    let outerRadius = 0.12*screenWidth;
    let iconSize = 0.09*screenWidth;
    let iconColor = colors.csBlueDark.rgba(0.75);
    if (setupIcon) {
      iconSize = 0.11*screenWidth;
      outerRadius = 0.15*screenWidth;
      iconColor = colors.white.hex;
    }

    let buttonStyle = {
      position:'absolute',
      bottom: 0,
      right: 0,
      padding: 6,
      paddingLeft:10,
      paddingTop:10,
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'center',
    };
    let viewStyle : ViewStyle = {
      width: outerRadius,
      height:outerRadius,
      borderRadius:0.5*outerRadius,
      backgroundColor: setupIcon ? colors.blue.hex : colors.white.rgba(0.55),
      alignItems:'center',
      justifyContent:'center',
    };

    return (
      <HiddenFadeInView visible={props.arrangingRooms === false && props.inSphere} style={buttonStyle}>
        <TouchableOpacity onPress={() => { NavigationUtil.launchModal( "AddItemsToSphere",{sphereId: props.sphereId}); }}>
          <View style={viewStyle}>
            <Icon name="c3-addRounded" size={ iconSize } color={ iconColor } />
          </View>
        </TouchableOpacity>
      </HiddenFadeInView>
    );
  }
  return <View />;
}

