import { BackHandler } from "react-native";
import { NavigationUtil, NavState } from "../util/NavigationUtil";
import { LOGd } from "../logging/Log";


class BackButtonHandlerClass {
  init() {
    BackHandler.addEventListener('hardwareBackPress', () => {
      // check if overlay
      let isOverlayOpen = NavState.isOverlayOpen();

      LOGd.nav("BackButtonHandlerClass: check if overlay is open", isOverlayOpen);
      if (isOverlayOpen) {
        return false;
      }


      let canGoBack = NavState.canGoBack();
      LOGd.nav("BackButtonHandlerClass: check if we can go back", canGoBack);
      if (canGoBack) {
        NavigationUtil.back();
        return true;
      }


      let isModalOpen = NavState.areModalsOpen();
      LOGd.nav("BackButtonHandlerClass: check if a modal is open", isModalOpen);
      if (isModalOpen) {
        NavigationUtil.dismissModal();
        return true;
      }


      let areOnBaseTab = NavState.isOnBaseTab();
      LOGd.nav("BackButtonHandlerClass: check if we are ont he base tab", areOnBaseTab);
      if (!areOnBaseTab) {
        NavigationUtil.navigateToBaseTab()
        return true;
      }

      return false;
    })
  }
}


export const BackButtonHandler = new BackButtonHandlerClass();