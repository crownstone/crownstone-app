import * as React from "react";
import { AnimatedCircle } from "../../animated/AnimatedCircle";
import { Icon } from "../../Icon";
import { AlternatingContent } from "../../animated/AlternatingContent";
import { View } from "react-native";
import { StoneAvailabilityTracker } from "../../../../native/advertisements/StoneAvailabilityTracker";
import { colors, styles } from "../../../styles";
import { Util } from "../../../../util/Util";
import { xUtil } from "../../../../util/StandAloneUtil";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../../../ExternalConfig";


export function DeviceEntryIcon({stone, stoneId, state, overrideStoneState}) {
  let customStyle = {};

  let size = 60;

  let color = colors.darkGray.hex;
  if (StoneAvailabilityTracker.isDisabled(stoneId) !== true) {
    if (overrideStoneState !== undefined) {
      color = (overrideStoneState > 0 ? colors.green.hex : colors.menuBackground.hex)
    }
    else {
      color = (stone.state.state > 0 ? colors.green.hex : colors.menuBackground.hex)
    }
  }

  if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
    if (stone.errors.hasError === true) {
      return (
        <View style={[{
          width:size,
          height:size,
          borderRadius:0.5*size,
          backgroundColor: colors.csOrange.hex,
          borderWidth: 0,
        }, styles.centered]}>
          <AlternatingContent
            style={{width:size, height:size, justifyContent:'center', alignItems:'center'}}
            fadeDuration={500}
            switchDuration={2000}
            contentArray={[
              <Icon name={'ios-warning'} size={40} color={'#fff'} style={{backgroundColor:'transparent'}} />,
              <Icon name={stone.config.icon} size={35} color={'#fff'} />,
            ]}
          />
        </View>
      );
    }
    else if (
      stone.config.firmwareVersion && (
      Util.canUpdate(stone, state) === true ||
      xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false)
    ) {
      return (
        <View style={[{
          width:size,
          height:size,
          borderRadius:size*0.5,
          backgroundColor: colors.white.hex,
          borderWidth: 2,
          borderColor: color,
          justifyContent:'center', alignItems:'center'
        }, styles.centered]}>
          <AlternatingContent
            style={{width:size, height:size, justifyContent:'center', alignItems:'center'}}
            fadeDuration={500}
            switchDuration={2000}
            contentArray={[
              <Icon name={'c1-update-arrow'} size={44} color={color} style={{backgroundColor:'transparent'}} />,
              <Icon name={stone.config.icon} size={35} color={color} />,
            ]} />
        </View>
      );
    }
  }
  else {
    customStyle = {borderWidth:1, borderColor: colors.darkGray2.hex}
  }

  return (
    <AnimatedCircle size={size} color={color} style={customStyle}>
      <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
    </AnimatedCircle>
  );
}