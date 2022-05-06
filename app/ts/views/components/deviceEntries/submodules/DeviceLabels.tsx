import {SlideFadeInView} from "../../animated/SlideFadeInView";
import {Text} from "react-native";
import * as React from "react";

export function DevicePowerUsage({stone, dimMode, editMode}) {
  let canDim  = stone.abilities.dimming.enabledTarget;
  let visible = !canDim || canDim && !dimMode

  return (
    <SlideFadeInView height={15} visible={visible}>
      <Text style={{ fontSize:13, fontStyle:'italic', paddingLeft:15 }}>{editMode ? 'Hold to drag!' : stone.state.currentUsage + ' W'}</Text>
    </SlideFadeInView>
  );
}