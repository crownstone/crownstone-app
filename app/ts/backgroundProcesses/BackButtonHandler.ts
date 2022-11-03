import { BackHandler } from "react-native";
import { NavigationUtil } from "../util/navigation/NavigationUtil";
import { LOGd } from "../logging/Log";
import { NavState } from "../util/navigation/NavState";


class BackButtonHandlerClass {

  overrides = {}

  /**
   * Override the back button action from a modal or view. Does not work for overlays
   *
   * The name is either the name of the view or the componentId. A custom name will not work!
   *
   * If the callback return false, the override falls through
   * @param viewName
   * @param callback
   */
  override(viewName : string, callback: () => void | boolean) {
    this.overrides[viewName] = callback;
  }

  clearOverride(viewName : string) {
    delete this.overrides[viewName];
  }


  /**
   * This binds the listener to the back button press. If return true, we intercept the call.
   */
  init() {
    BackHandler.addEventListener('hardwareBackPress', () => {
      // throw new Error("Not implemented BackHandler")
      // check if overlay
      let isOverlayOpen = NavState.isOverlayOpen();

      LOGd.nav("BackButtonHandlerClass: check if overlay is open", isOverlayOpen);
      // Do not allow back button to change overlays.
      if (isOverlayOpen) {
        return true;
      }

      let activeViewData = NavState.getCurrentlyActiveComponentData();
      LOGd.nav("BackButtonHandlerClass: check if activeViewData", activeViewData,  this.overrides);
      if (activeViewData) {
        if (this.overrides[activeViewData.name] !== undefined && this.overrides[activeViewData.name]() !== false) {
          return true;
        }
        if (this.overrides[activeViewData.id] !== undefined && this.overrides[activeViewData.id]() !== false) {
          return true;
        }
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
      LOGd.nav("BackButtonHandlerClass: check if we are on the base tab", areOnBaseTab);
      if (!areOnBaseTab) {
        NavigationUtil.navigateToBaseTab()
        return true;
      }

      return false;
    })
  }
}


export const BackButtonHandler = new BackButtonHandlerClass();
