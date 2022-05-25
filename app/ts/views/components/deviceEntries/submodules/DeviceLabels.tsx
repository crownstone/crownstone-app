import {SlideFadeInView} from "../../animated/SlideFadeInView";
import {Text} from "react-native";
import * as React from "react";
import {StoneAvailabilityTracker} from "../../../../native/advertisements/StoneAvailabilityTracker";

export function DeviceEntryLabel({stone, dimMode, editMode}) {
  let canDim  = stone.abilities.dimming.enabledTarget;
  let visible = !canDim || canDim && !dimMode;
  let reachable = !StoneAvailabilityTracker.isDisabled(stone.id);

  let activeLabel = reachable ? stone.state.currentUsage + ' W' : 'Searching...';
  let label = editMode ? 'Hold to drag!' : activeLabel

  return (
    <SlideFadeInView height={15} visible={visible}>
      <Text style={{ fontSize:13, fontStyle:'italic', paddingLeft:15 }}>{label}</Text>
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