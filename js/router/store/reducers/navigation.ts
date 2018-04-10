import { Reducer, ActionConst } from 'react-native-router-flux';
import { Platform } from 'react-native';
import { LOG } from '../../../logging/Log'

let inTabMenu = (state) => {
  if (state && state.children && state.children.length > 0) {
    return state.children[0].name == "tabBar";
  }
  return false;
};

let getActiveTabName = (state) => {
  if (state && state.children && state.children.length > 0) {
    let tabBar = state.children[0];
    let tabIndex =  tabBar.index;
    return tabBar.children[tabIndex].name;
  }
  return undefined;
};

let getTabTreeIndex = (state) => {
  if (state && state.children && state.children.length > 0) {
    let tabBar = state.children[0];
    let tabIndex =  tabBar.index;
    return tabBar.children[tabIndex].index;
  }
  return undefined;
};

let getTabRootName = (state) => {
  if (state && state.children && state.children.length > 0) {
    let tabBar = state.children[0];
    let tabIndex =  tabBar.index;
    let tabContainer = tabBar.children[tabIndex];
    return tabContainer.children[0].name;
  }
  return undefined;
};

export const reducerCreate = (params) => {
  const defaultReducer = Reducer(params, {});
  return (state, action)=> {
    return defaultReducer(state, action);
  }
};