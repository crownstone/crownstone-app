import * as React from "react";
import { Icon } from "../../Icon";
import { AlternatingContent } from "../../animated/AlternatingContent";
import { StoneAvailabilityTracker } from "../../../../native/advertisements/StoneAvailabilityTracker";
import { colors, styles } from "../../../styles";
import { Util } from "../../../../util/Util";
import { xUtil } from "../../../../util/StandAloneUtil";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../../../ExternalConfig";


export function DeviceEntryIcon({stone, stoneId}) {
  let color = colors.black.hex;

  if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
    if (stone.errors.hasError === true) {
      return (
        <AlternatingContent
          style={{width:35, height:35, justifyContent:'center', alignItems:'center'}}
          fadeDuration={500}
          switchDuration={2000}
          contentArray={[
            <Icon name={'ios-warning'} size={40} color={color} style={{backgroundColor:'transparent'}} />,
            <Icon name={stone.config.icon} size={35} color={color} />,
          ]}
        />
      );
    }
    else if (
      stone.config.firmwareVersion && (
      Util.canUpdate(stone) === true ||
      xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false)
    ) {
      return (
        <AlternatingContent
          style={{width:35, height:35, justifyContent:'center', alignItems:'center'}}
          fadeDuration={500}
          switchDuration={2000}
          contentArray={[
            <Icon name={'c1-update-arrow'} size={44} color={color} style={{backgroundColor:'transparent'}} />,
            <Icon name={stone.config.icon} size={35} color={color} />,
          ]}
        />
      );
    }
  }

  return (
      <Icon name={stone.config.icon} size={35} color={color} />
  );
}
