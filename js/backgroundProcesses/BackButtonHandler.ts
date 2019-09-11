import { BackHandler } from "react-native";
import { NavigationUtil, NavState } from "../util/NavigationUtil";
import { LOGd } from "../logging/Log";


class BackButtonHandlerClass {

  overrides = {}

  /**
   * Override the back button action from a modal or view. Does not work for overlays
   * @param viewName
   * @param callback
   */
  override(viewName : string, callback: () => void) {
    this.overrides[viewName] = callback;
  }

  clearOverride(viewName : string) {
    delete this.override[viewName];
  }


  /**
   * This binds the listener to the back button press. If return true, we intercept the call.
   */
  init() {
    BackHandler.addEventListener('hardwareBackPress', () => {
      // check if overlay
      let isOverlayOpen = NavState.isOverlayOpen();

      LOGd.nav("BackButtonHandlerClass: check if overlay is open", isOverlayOpen);
      // Do not allow back button to change overlays.
      if (isOverlayOpen) {
        return true;
      }

      let activeViewData = NavState.getCurrentlyActiveComponentData();
      if (activeViewData && this.overrides[activeViewData.name] !== undefined) {
        this.overrides[activeViewData.name]();
        return true;
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