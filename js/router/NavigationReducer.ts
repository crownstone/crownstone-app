import { createStore, applyMiddleware, combineReducers } from 'redux';
import { createReduxContainer, createReactNavigationReduxMiddleware, createNavigationReducer } from 'react-navigation-redux-helpers';
import { connect } from 'react-redux';

import { RootStack } from "./Routes";
import { xUtil } from "../util/StandAloneUtil";


// check for simple
let stripAdditionalStates = (routeState, target) => {
  for (let i = routeState.index; i >= 0; i--) {
    if (routeState.routes[i].routeName === target) {
      // found it!
      routeState.index = i;
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
};



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
};

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
};











function revertState(routeState) {
  let topLevel = findTopLevelRoutes(routeState) || routeState;

  if (topLevel.index === 0) {
    console.log("removeElement higher");
    let parent = getParent(routeState, topLevel.routeName);
    parent.index -= 1;
    parent.routes.pop();
  }
  else {
    topLevel.index -= 1;
    topLevel.routes.pop();
  }
}

const getNameOfCurrentRoute = (routeState) => {
  if (routeState.routes[routeState.index].routes) {
    return getNameOfCurrentRoute(routeState.routes[routeState.index])
  }
  else {
    return routeState.routes[routeState.index].routeName;
  }
};

function getParent(state, routeName) {
  console.log("searching", state, "for", routeName);
  if (state.routes[state.index].routeName === routeName) {
    return state;
  }

  if (state.routes[state.index].routes) {
    console.log("have children!", state.routes[state.index].routes);
    let subLevel = state.routes[state.index];
    if (subLevel.routeName === routeName) {
      console.log("found summin!");
      return state;
    }
    else {
      return getParent(subLevel, routeName);
    }
  }
  else {
    return null
  }
}


function searchTreeForParentOfRoute(state, routeName) {
  console.log("Searching", state, "for", routeName);
  if (state.routes) {
    for ( let i = 0; i < state.routes.length; i++) {
      if (state.routes[i].routeName === routeName) {
        return state;
      }
    }
    for ( let i = 0; i < state.routes.length; i++) {
      let result = searchTreeForParentOfRoute(state.routes[i], routeName);
      if (result) {
        return result;
      }
    }
  }
}


function findTopLevelRoutes(state) {
  if (state.routes[state.index].routes) {
    let subLevel = state.routes[state.index];
    if (subLevel.routes[subLevel.index].routes) {
      return findTopLevelRoutes(subLevel);
    }
    else {
      return state.routes[state.index]
    }
  }
  else {
    return null
  }
}

function getIndexOfRouteName(state, routeName) {
  let index = null;
  for (let i = 0; i < state.routes.length; i++) {
    if (state.routes[i].routeName === routeName) {
      index = i;
      break;
    }
  }
  return index;
}


function changeStateToGoToRoute(state, routeName) {
  if (!routeName) { return }

  let parent = searchTreeForParentOfRoute(state, routeName);
  if (!parent) {
    return;
  }
  let targetIndex = getIndexOfRouteName(parent, routeName);
  if (parent.index === targetIndex) {
    return changeStateToGoToRoute(state, parent.routeName)
  }
  else if (parent.index < targetIndex) {
    parent.index = targetIndex;
    return changeStateToGoToRoute(state, parent.routeName)
  }
  else if (parent.index > targetIndex) {
    let diff = parent.index - targetIndex;
    // shift the index.
    parent.index = targetIndex;
    // pop the higher routes:
    for (let i = 0; i < diff; i++) {
      parent.routes.pop();
    }
    return changeStateToGoToRoute(state, parent.routeName)
  }
}




let expectedCompletes = 0;
let choppingBlock = [];
export const getAppReducer = function(navReducer) {
  return combineReducers({
    nav: (state, action) => {
      if (!state) { return navReducer(state,action); }

      // console.log("NAV STATE", state)
      // console.log("NAV ACTION", action)

      if (action.type === "Navigation/NAVIGATE") {
        if (action.routeName !== "AppBase") {
          if (expectedCompletes > 0) { expectedCompletes += 1; }
          else                       { expectedCompletes += 2; }
          console.log("ExpectedCompletes after Navigation:", expectedCompletes);
        }
      }
      else if (action.type === "Navigation/BACK") {
        if (action.logout === true) {
          let newState = xUtil.deepExtend({}, state);
          newState.index = getIndexOfRouteName(newState, "Logout");
          return navReducer(newState, action);
        }
        else if (action.target !== undefined) {
          let newState = xUtil.deepExtend({}, state);
          changeStateToGoToRoute(newState, action.target);
          // console.log(state, newState)
          action.type = "Navigation/COMPLETE_TRANSITION";
          return navReducer(newState, action);
        }
      }

      if (action.params && action.params.__popBeforeAdd) {
        choppingBlock.push(getNameOfCurrentRoute(state));

        return navReducer(state, action);
      }

      if (action.type === "Navigation/COMPLETE_TRANSITION") {
        expectedCompletes = Math.max(expectedCompletes - 1, 0);
        console.log("ExpectedCompletes after complete:", expectedCompletes);

        if (expectedCompletes === 0) {
          console.log("Working by the chopping block", choppingBlock);
          if (choppingBlock.length > 0) {
            let newState = xUtil.deepExtend({}, state);
            while (choppingBlock.length > 0) {
              let parent = searchTreeForParentOfRoute(newState, choppingBlock[0]);
              if (parent) {
                let index = getIndexOfRouteName(parent, choppingBlock[0]);
                if (index) {
                  if (parent.index < index) {
                    parent.routes.splice(index, 1);
                  }
                  else if (parent.index > index) {
                    parent.routes.splice(index, 1);
                    parent.index -= 1;
                  }
                  else {
                    // TODO
                  }

                }
              }
              choppingBlock.splice(0, 1);
            }
            // console.log(newState)
            return navReducer(newState, action);
          }
        }
      }

      return navReducer(state,action);
    }
  });
};



const navReducer = createNavigationReducer(RootStack);

// Note: createReactNavigationReduxMiddleware must be run before createReduxContainer
const middleware = createReactNavigationReduxMiddleware((state : any) => { return state.nav });

const App                    = createReduxContainer(RootStack);
const mapStateToProps        = (state) => ({state: state.nav});
export const AppWithNavigationState = connect(mapStateToProps)(App);
export const navigationStore = createStore(
  getAppReducer(navReducer),
  applyMiddleware(middleware),
);
