import * as React from 'react';
import {core} from "../../../Core";
import { useEvent } from "./eventHooks";
import {useState} from "react";
import {Navigation} from "react-native-navigation";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {act} from "@testing-library/react-native";
import {AppState} from "react-native";


export function useForceUpdate(){
  const [value, setValue] = React.useState(0); // integer state
  return () => setValue(value => (value + 1)%100); // update the state to force render
}

type filter = DatabaseEventType | PartialRecord<DatabaseEventType, databaseId>

// filter = {changeStones: "id"}
// filter = "changeStones"

export function useDatabaseChange(filters: filter | filter[], callback: () => void = null, dependencies = []) {
  const forceUpdate = useForceUpdate();

  useEvent('databaseChange', (data) => {
    let change = data.change;

    if (checkFilter(change, filters)) {
      if (callback !== null) { callback();    }
      else                   { forceUpdate(); }
    }
  }, dependencies);
}

export function useSphereSwitching(callback: () => void = null) {
  useDatabaseChange(['updateActiveSphere'], callback);
}


export function useSpherePresence() {
  const forceUpdate = useForceUpdate();

  useEvent('enterSphere', forceUpdate);
  useEvent('exitSphere', forceUpdate);
}

/**
 * Will trigger if we go from or to this view
 * @param viewName
 */
export function useViewSwitching(viewName) {
  // let forceUpdate = useForceUpdate();
  let [currentView, setCurrentView] = useState(null);
  useAppStateChangeRedraw();

  useEvent('VIEW_DID_APPEAR', () => {
    let activeView = NavigationUtil.getActiveView();

    if (viewName === activeView) {
      setCurrentView(viewName);
    }
    else {
      if (currentView === viewName) {
        setCurrentView(null);
      }
    }
  });
}
/**
 * Will trigger if we go from or to this view
 * @param viewName
 */
export function useAppStateChangeRedraw() {
  let forceUpdate = useForceUpdate()
  useEvent("AppStateChange", (appState) => {forceUpdate();});
}


export function useAppStateChange(callback : (appState) => void) {
  useEvent("AppStateChange", (appState) => {
    callback(appState);
  });
}

function checkFilter(change: DatabaseChangeEventData, filters: filter | filter[]) {
  if (Array.isArray(filters)) {
    for (let filter of filters) {
      if (_checkFilter(change, filter)) {
        return true;
      }
    }
    return false;
  }

  return _checkFilter(change, filters);
}

function _checkFilter(change: DatabaseChangeEventData, filter: filter) : boolean {
  if (typeof filter === 'string') {
    if (change[filter] !== undefined) { return true; }
  }
  else {
    for (let key in filter) {
      let id = filter[key];
      if (change[key] === undefined) { continue; }

      for (let idType in change[key]) {
        if (change[key][idType][id]) { return true;}
      }
    }
  }

  return false
}
