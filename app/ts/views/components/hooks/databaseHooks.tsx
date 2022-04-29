import * as React from 'react';
import {core} from "../../../Core";


function useForceUpdate(){
  const [value, setValue] = React.useState(0); // integer state
  return () => setValue(value => (value + 1)%100); // update the state to force render
}

type filter = DatabaseEventType | Record<DatabaseEventType, databaseId>

// filter = {changeStones: "id"}
// filter = "changeStones"

export function useDatabaseChange(filters: filter | filter[], callback: () => void = null) {
  const forceUpdate = useForceUpdate();

  React.useEffect(() => {
    const unsubscribeStoreEvent = core.eventBus.on('databaseChange', (data) => {
      let change = data.change;

      if (checkFilter(change, filters)) {
        if (callback !== null) { callback();    }
        else                   { forceUpdate(); }
      }
    });

    return unsubscribeStoreEvent();
  });
}

function checkFilter(change: DatabaseChangeEventData, filters: filter | filter[]) {
  if (Array.isArray(filters)) {
    for (let filter of filters) {
      if (typeof filter === 'string') {
        if (change[filter] !== undefined) { return true; }
      }
      else {
        for (let key in filter) {
          let id = filter[key];
          if (change[key]?.id[id]) { return true; }
        }
      }
    }
  }
  else if (typeof filters === 'string') {
    if (change[filters] !== undefined) { return true; }
  }
  return false;
}