import { Reducer } from 'react-native-router-flux';

let inTabMenu = (state) => {
  if (state && state.children && state.children.length > 0) {
    return state.children[0].name = "tabBar";
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

export const reducerCreate = params=> {
  const defaultReducer = Reducer(params);
  return (state, action)=> {
    // // this part makes sure that when a menuIcon is pressed AND you are already in that menu tree,
    // // it goes back to the root of that tree
    // if (action.type === 'jump' && inTabMenu(state)) {
    //   let activeTabName = getActiveTabName(state);
    //   // We only want to reset if the icon is tapped when we're already in the view
    //   if (activeTabName === action.key) {
    //     // if we're already at root, do not do anything.
    //     if (getTabTreeIndex(state) === 0) {
    //       return state;
    //     }
    //     // snap to root.
    //     let rootName = getTabRootName(state);
    //     if (rootName) {
    //       console.log("ACTION", {key:rootName, type:'reset'});
    //       return defaultReducer(state, {key:rootName, type:'reset'});
    //     }
    //   }
    // }
    console.log("ACTION", action);
    return defaultReducer(state, action);
  }
};