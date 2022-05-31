
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react';
import {TouchableOpacity} from "react-native";

import { Icon } from '../Icon';
import { styles, colors}        from '../../styles'
import {Get} from "../../../util/GetUtil";
import {BlurEntry} from "../BlurEntries";


export function HubEntryBasic(props: { sphereId: sphereId, hubId: hubId, callback: () => void}) {
  let hub = Get.hub(props.sphereId, props.hubId);
  if (!hub) { return }
  let linkedStone = Get.stone(props.sphereId, hub.config.linkedStoneId);
  return (
    <TouchableOpacity onPress={props.callback}>
      <BlurEntry
        title={hub.config.name}
        iconItem={<Icon name={linkedStone?.config?.icon ?? 'c1-router'} size={35} color={colors.csBlue.hex} />}
      />
    </TouchableOpacity>
  )
}
