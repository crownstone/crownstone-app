import { Reducer} from 'react-native-router-flux';
import { Platform } from 'react-native';
import {LOGw} from "../../../logging/Log";
import {Util} from "../../../util/Util";

// check for simple
let stripAdditionalStates = (routeState, target) => {
  for (let i = routeState.index; i >= 0; i--) {
    if (routeState.routes[i].routeName === target) {
      // found it!
      routeState.index = i
      return true;
    }
    else {
      let childRoutes = routeState.routes[i].routes;
      if (childRoutes && Array.isArray(childRoutes)) {
        let subCheck = stripAdditionalStates(routeState.routes[i], target);
        if (subCheck) {
          routeState.index = i;
          return true;
        }
      }
    }
    routeState.routes.pop()
  }
  return false;
}


let getState = (routeState) => {
  for (let i = routeState.routes.length-1; i >= 0; i--) {
    if (routeState.index !== i) {
      routeState.routes.splice(i,1)
    }
  }

  routeState.index = 0;
  if (routeState.routes[0].routes) {
    routeState.routes[0] = getState(routeState.routes[0])
  }
  return routeState;
}

let getNameOfCurrentRoute = (routeState) => {
  if (routeState.routes[routeState.index].routes) {
    return getNameOfCurrentRoute(routeState.routes[routeState.index])
  }
  else {
    return routeState.routes[routeState.index].routeName;
  }
}

let mergeStates = (targetState, oneOver) => {
  if (oneOver.routes && Array.isArray(oneOver.routes) && oneOver.routes.length > 0) {
    if (oneOver.routes[0].routes) {
      if (targetState.routes[0].routes) {
        // we merge it one deeper
        mergeStates(targetState.routes[0], oneOver.routes[0]);
      }
      else {
        targetState.routes.push(oneOver.routes[0]);
        targetState.index = targetState.routes.length - 1;
      }
    }
    else {
      targetState.routes.push(oneOver.routes[0]);
      targetState.index = targetState.routes.length - 1;
    }
  }
}


export const reducerCreate = (params) => {
  const defaultReducer = Reducer(params, {});
  return (state, action) => {

    if (action && action.type == "REACT_NATIVE_ROUTER_FLUX_POP_TO") {
      // check if we can see the key in the list of items, if not, do a back.
      let newState = Util.deepExtend({}, state);
      let isolatedState = Util.deepExtend({}, state);

      let success = stripAdditionalStates(newState, action.routeName)
      if (success) {
        getState(isolatedState);
        mergeStates(newState, isolatedState)

        return defaultReducer(newState, {type: "Navigation/BACK"});
      }
      else {
        // just go back one if we can't find the target?
        LOGw.info("navigation.ts: Tried PopTo with name", action.routeName, " but could not find target route. Popping once.")
        return defaultReducer(state, {type: "Navigation/BACK"});
      }
    }
    if (action && action.type == "REACT_NATIVE_ROUTER_FLUX_PUSH") {
      // check if this is a double trigger.
      let currentTopName = getNameOfCurrentRoute(state);
      if (currentTopName === action.routeName) {
        return state;
      }

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