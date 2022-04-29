import * as React from 'react';
import {core} from "../../../Core";

export function useEvent(topic, callback) {
  React.useEffect(() => {
    let token = Math.round((Math.random()*1e8)).toString(36)
    const unsubscribe = core.eventBus.on(topic, callback);
    return () => {
      unsubscribe();
    }
  });
}
