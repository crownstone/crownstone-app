// RootNavigation.js

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef()

export const Navigation = {

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
  }

}

