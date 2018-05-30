import { Reducer} from 'react-native-router-flux';
import { Platform } from 'react-native';
import {LOGw} from "../../../logging/Log";

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
  return (state, action)=>{
    if (action && action.type == "REACT_NATIVE_ROUTER_FLUX_POP_TO") {
      // check if we can see the key in the list of items, if not, do a back.
      let popCount = 0;
      let success = false;
      // search throught all routes in the state, starting from the top, for one that matches the route name
      for (let i = state.index; i >= 0; i--) {
        if (state.routes[i].routeName == action.routeName) {
          // we found it!
          success = true
          break;
        }
        // how many pops do we need for this operation?
        popCount++;
      }
      if (success) {
        // if our routing stack is [1, 2, 3, 4, 5] and we're in 5 and want to go back to 1, we remove [2,3,4] so [1,5] are left, then do a nav/back for animated transition
        // cut out the intermediates ([2,3,4])
        if (popCount == 1) {
          return defaultReducer(state, {type: "Navigation/BACK"});
        }
        else if (popCount > 1) {
          let newState = {...state};
          newState.routes = newState.routes.slice(0, newState.routes.length - popCount);
          // push the current scene back on top of the stack.
          newState.routes.push(state.routes[state.routes.length-1])

          // have the index point to a the correct scene.
          newState.index -= (popCount - 1);

          // go back one step to go from 5 to 1
          return defaultReducer(newState, {type: "Navigation/BACK"});
        }
        else {
          // popCount = 0, we're already there?
          LOGw.info("navigation.ts: Tried PopTo with name", action.routeName, " while already on that route. Popping once.")
          return defaultReducer(state, {type: "Navigation/BACK"});
        }
      }
      else {
        // just go back one if we can't find the target?
        LOGw.info("navigation.ts: Tried PopTo with name", action.routeName, " but could not find target route. Popping once.")
        return defaultReducer(state, {type: "Navigation/BACK"});
      }
    }
    if (action && action.type == "REACT_NATIVE_ROUTER_FLUX_PUSH") {
      if (action.params && action.params.__popBeforeAddCount) {
        let newState = {...state};
        for (let i = 0; i < action.params.__popBeforeAddCount; i++) {
          newState.routes.pop();
          newState.index -= 1;
        }
        return defaultReducer(newState, action);
      }
    }
    return defaultReducer(state, action);
  }
};