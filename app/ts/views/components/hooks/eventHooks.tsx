import * as React from 'react';
import {core} from "../../../Core";

export function useEvent(topic, callback, depencencies: any[] = []) {
  useLocalEvent(core.eventBus, topic, callback);
}

export function useLocalEvent(eventBus, topic, callback, depencencies: any[] = []) {
  React.useEffect(() => {
    const unsubscribe = eventBus.on(topic, callback);
    return () => {
      unsubscribe();
    }
  }, depencencies);
}
