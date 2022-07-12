import * as React from "react";
import { Icon } from "../../Icon";
import { AlternatingContent } from "../../animated/AlternatingContent";
import { StoneAvailabilityTracker } from "../../../../native/advertisements/StoneAvailabilityTracker";
import { colors, styles } from "../../../styles";
import { Util } from "../../../../util/Util";
import { xUtil } from "../../../../util/StandAloneUtil";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../../../ExternalConfig";


export function SetupDeviceEntryIcon(props: {icon: string}) {
  let color = colors.black.hex;

  return (
      <Icon name={props.icon} size={40} color={color} />
  );
}
