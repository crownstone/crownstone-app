import * as React from 'react';
import {core} from "../../../Core";
import { FunctionComponent, useEffect, useState } from "react";
import { Util } from "../../../util/Util";
import { useLocalEvent } from "./eventHooks";
import { EventBusClass } from "../../../util/EventBus";

export function useDraggable(isBeingDragged: boolean, eventBus: EventBusClass, dragAction: () => void) {
  const [drag, setDrag] = useState(isBeingDragged);
  useLocalEvent(eventBus, 'END_DRAG', () => { setDrag(false); });

  return {dragging: drag, triggerDrag : () => { dragAction(); setDrag(true); }};
}

export interface DraggableProps {
  isBeingDragged: boolean,
  eventBus: EventBusClass,
  dragAction: () => void
}
export interface OptionalDraggableProps {
  isBeingDragged?: boolean,
  eventBus?: EventBusClass,
  dragAction?: () => void
}
