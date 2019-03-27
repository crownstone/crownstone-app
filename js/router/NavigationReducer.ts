import { createStore, applyMiddleware, combineReducers } from 'redux';
import { createReduxContainer, createReactNavigationReduxMiddleware, createNavigationReducer } from 'react-navigation-redux-helpers';
import { connect } from 'react-redux';

import { RootStack } from "./Routes";
import { xUtil } from "../util/StandAloneUtil";

function revertState(routeState) {
  let topLevel = findTopLevelRoutes(routeState) || routeState;

  if (topLevel.index === 0) {
    console.log("removeElement higher")
    let parent = getParent(routeState, topLevel.routeName)
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
  console.log("searching", state, "for", routeName)
  if (state.routes[state.index].routeName === routeName) {
    return state;
  }

  if (state.routes[state.index].routes) {
    console.log("have children!", state.routes[state.index].routes)
    let subLevel = state.routes[state.index];
    if (subLevel.routeName === routeName) {
      console.log("found summin!")
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
  console.log("Searching", state, "for", routeName)
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

let expectedCompletes = 0;
let choppingBlock = [];
export const getAppReducer = function(navReducer) {
  return combineReducers({
    nav: (state, action) => {
      if (!state) { return navReducer(state,action); }

      if (action.type === "Navigation/NAVIGATE") {
        if (action.routeName !== "AppBase") {
          if (expectedCompletes > 0) { expectedCompletes += 1; }
          else                       { expectedCompletes += 2; }
          // console.log("ExpectedCompletes after Navigation:", expectedCompletes);
        }
      }

      if (action.params && action.params.__popBeforeAdd) {
        choppingBlock.push(getNameOfCurrentRoute(state));
        return navReducer(state, action);
      }

      if (action.type === "Navigation/COMPLETE_TRANSITION") {
        expectedCompletes = Math.max(expectedCompletes - 1, 0);
        // console.log("ExpectedCompletes after complete:", expectedCompletes)

        if (expectedCompletes === 0) {
          // console.log("Working by the chopping block", choppingBlock)
          if (choppingBlock.length > 0) {
            let newState = xUtil.deepExtend({}, state);
            while (choppingBlock.length > 0) {
              let parent = searchTreeForParentOfRoute(newState, choppingBlock[0]);
              if (parent) {
                let index = 0;
                for (let i = 0; i < parent.routes.length; i++) {
                  if (parent.routes[i].routeName === choppingBlock[0]) {
                    index = i;
                    break;
                  }
                }
                if (parent.index < index) {
                  parent.routes.splice(index, 1);
                } else if (parent.index > index) {
                  parent.routes.splice(index, 1);
                  parent.index -= 1;
                } else {

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
}



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
