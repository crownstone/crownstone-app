import { BackHandler } from "react-native";
import { NavigationUtil, NavState } from "../util/NavigationUtil";


class BackButtonHandlerClass {
  init() {
    BackHandler.addEventListener('hardwareBackPress', () => {
      // check if overlay
      if (NavState.isOverlayOpen()) {
        return false;
      }

      if (NavState.canGoBack()) {
        NavigationUtil.back();
        return true;
      }

      if (NavState.isModalOpen()) {
        NavigationUtil.dismissModal();
        return true;
      }

      if (!NavState.isOnBaseTab()) {
        NavigationUtil.navigateToBaseTab()
        return true;
      }

      return false;
    })
  }
}


export const BackButtonHandler = new BackButtonHandlerClass();