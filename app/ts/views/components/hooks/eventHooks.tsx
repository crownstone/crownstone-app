import * as React from 'react';
import {core} from "../../../Core";
import {useForceUpdate} from "./databaseHooks";

export function useEvent(topic, callback, depencencies: any[] = []) {
  useLocalEvent(core.eventBus, topic, callback, depencencies);
}
export function useEvents(topics : string[], callback, depencencies: any[] = []) {
  for (let topic of topics) {
    useLocalEvent(core.eventBus, topic, callback, depencencies);
  }
}

export function useSidebarState() {
  const forceUpdate = useForceUpdate();
  useEvents(['sidebarOpen', 'sidebarClose'], forceUpdate);
}

export function useLocalEvent(eventBus, topic: string, callback: (data: any) => void, depencencies: any[] = []) {
  React.useEffect(() => {
    const unsubscribe = eventBus.on(topic, callback);
    return () => {
      unsubscribe();
    }
  }, depencencies);
}
