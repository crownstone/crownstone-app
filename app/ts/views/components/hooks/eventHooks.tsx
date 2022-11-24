import * as React from 'react';
import {core} from "../../../Core";
import {useForceUpdate} from "./databaseHooks";

export function useEvent(topic, callback, dependencies: any[] = []) {
  useLocalEvent(core.eventBus, topic, callback, dependencies);
}
export function useEvents(topics : string[], callback, dependencies: any[] = []) {
  for (let topic of topics) {
    useLocalEvent(core.eventBus, topic, callback, dependencies);
  }
}

export function useEventUpdate(topic, dependencies: any[] = []) {
  const forceUpdate = useForceUpdate();
  useLocalEvent(core.eventBus, topic, forceUpdate, dependencies);
}

export function useNativeEvent(topic: NativeBusTopic, callback, depencencies: any[] = []) {
  React.useEffect(() => {
    const unsubscribe = core.nativeBus.on(topic, callback);
    return () => {
      unsubscribe();
    }
  }, depencencies);
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
