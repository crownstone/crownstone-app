
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  TouchableOpacity,
  Text,
  View} from "react-native";

import { Icon } from '../Icon';
import { styles, colors}        from '../../styles'
import {BlurEntry} from "../BlurEntries";
import {Get} from "../../../util/GetUtil";


export function DeviceEntryBasic(props: { sphereId: sphereId, stoneId: stoneId, callback: () => void}) {
  let stone = Get.stone(props.sphereId, props.stoneId);
  if (!stone) { return }
  return (
    <TouchableOpacity onPress={props.callback}>
      <BlurEntry
        title={stone.config.name}
        iconItem={<Icon name={stone.config.icon} size={35} color={colors.csBlue.hex} />}
      />
    </TouchableOpacity>
  )
}
