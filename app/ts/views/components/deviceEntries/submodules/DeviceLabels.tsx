
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceLabels", key)(a,b,c,d,e);
}
import {SlideFadeInView} from "../../animated/SlideFadeInView";
import {Text, TextStyle} from "react-native";
import * as React from "react";
import {StoneAvailabilityTracker} from "../../../../native/advertisements/StoneAvailabilityTracker";

export function DeviceEntryLabel({stone, dimMode, editMode}) {
  let canDim  = stone.abilities.dimming.enabledTarget;
  let reachable = !StoneAvailabilityTracker.isDisabled(stone.id);
  let visible = !canDim || !reachable || canDim && !dimMode;

  let style : TextStyle = { fontSize:13, fontStyle:'italic', fontWeight:'normal', paddingLeft:15 };

  let label = reachable ? stone.state.currentUsage + ' W' : 'Searching...';

  if (reachable && stone.errors.hasError) {
    label = 'Problem detected, tap here.';
    style.fontStyle = "normal";
    style.fontWeight = "bold";
  }

  label = editMode ? 'Hold to drag!' : label

  return (
    <SlideFadeInView height={15} visible={visible}>
      <Text style={style}>{label}</Text>
    </SlideFadeInView>
  );
}


export function HubEntryLabel({hub, stone, editMode}) {
  let reachable = !StoneAvailabilityTracker.isDisabled(stone.id);

  let activeLabel = reachable ? '' : 'Searching...';
  let label = editMode ? 'Hold to drag!' : activeLabel

  return (
    <Text style={{ fontSize:13, fontStyle:'italic', paddingLeft:15 }}>{label}</Text>
  );
}




export function DfuDeviceEntryLabel(props: {restoring: boolean}) {
  let activeLabel = props.restoring ? 'Working...' : "Tap here to configure me!";

  return (
    <Text style={{ fontSize:13, fontStyle:'italic', paddingLeft:15 }}>{activeLabel}</Text>
  );
}




export function SetupDeviceEntryLabel() {
  // let reachable = !StoneAvailabilityTracker.isDisabled(stone.id);
  //
  // let activeLabel = reachable ? '' : 'Searching...';
  // let label = editMode ? 'Hold to drag!' : activeLabel

  return (
    <Text style={{ fontSize:13, fontStyle:'italic', paddingLeft:15 }}>{ lang("I_need_to_be_setup_again_") }</Text>
  );
}



