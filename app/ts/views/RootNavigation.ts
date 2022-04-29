// RootNavigation.js

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef       = createNavigationContainerRef();
export const tabBarNavigationContainer = {navigator: null};
export const drawerNavigationContainer = {navigator: null};

export const Navigation = {
  root: navigationRef,
  tab: tabBarNavigationContainer,
  drawer: drawerNavigationContainer,


  navigate(name: string, params?: any) {
    if (navigationRef.isReady()) {

      // @ts-ignore
      navigationRef.navigate(name, params);
    }
  },

  showOverlay(name: string, params: any) {
    Navigation.navigate(name, params)
  },

  pop() {
    navigationRef.goBack();
  },

  popTo(target) {
    Navigation.navigate(target)
  },

  openDrawer() {
    drawerNavigationContainer.navigator.openDrawer();
    drawerNavigationContainer.navigator.setOptions({ swipeEnabled: true });
  },

  closeDrawer(onlyDisableSwipe = false) {
    if (!onlyDisableSwipe) {
      drawerNavigationContainer.navigator.closeDrawer();
    }
    drawerNavigationContainer.navigator.setOptions({ swipeEnabled: false });
  },

  setTabBarOptions(options) {
    tabBarNavigationContainer.navigator.setOptions(options);
  }
}

