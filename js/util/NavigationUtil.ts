import { DrawerActions, NavigationActions, StackActions } from "react-navigation";
import { navigationStore } from "../router/NavigationReducer";

export const NavigationUtil = {

  navigate(target,params = {}) {
    const navigateAction = NavigationActions.navigate({
      routeName: target,
      params: params,
    });

    navigationStore.dispatch(navigateAction);
  },

  back() {
    const navigateAction = NavigationActions.back();

    navigationStore.dispatch(navigateAction);
  },


  backTo(target) {
    console.log("I want to go back to: ", target);
    const navigateAction = {
      type: "Navigation/BACK",
      target: target
    };
    navigationStore.dispatch(navigateAction);
  },

  backToTop() {
    const navigateAction = NavigationActions.back();

    navigationStore.dispatch(navigateAction);
  },

  reset(target, params = {}) {
    const navigateAction = StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: target, params: params })],
    });

    navigationStore.dispatch(navigateAction);
  },

  navigateAndReplace: function(target, params = {}) {
    const navigateAction = NavigationActions.navigate({
      routeName: target,
      params: {...params, __popBeforeAdd:1},
    });

    navigationStore.dispatch(navigateAction);
  },

  navigateAndReplaceVia: function(via, target, params = {}) {
    const navigateAction1 = NavigationActions.navigate({
      routeName: via,
      params: {...params, __popBeforeAdd:1},
    });
    const navigateAction2 = NavigationActions.navigate({
      routeName: target,
      params:params,
    });

    navigationStore.dispatch(navigateAction1);
    navigationStore.dispatch(navigateAction2);
  },

  openDrawer: function() {
    const action = DrawerActions.openDrawer();
    navigationStore.dispatch(action);
  },

  closeDrawer: function() {
    const action = DrawerActions.closeDrawer();
    navigationStore.dispatch(action);
  },

  logout: function() {
    let action = {
      type: 'Navigation/BACK',
      logout: true,
    };
    navigationStore.dispatch(action);
  }
};