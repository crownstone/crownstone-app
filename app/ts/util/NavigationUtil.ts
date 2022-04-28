// import * as Sentry from "@sentry/react-native";
import {LOGd, LOGi, LOGw} from "../logging/Log";
import {core} from "../Core";
import { Navigation } from "../views/RootNavigation";

const BASE_TAB_NAME = "BASE_TAB";

interface views {
  [key: string]: componentInfo[]
}
interface activeView {
  [key: string]: string
}

interface componentInfo {
  id: string,
  name: string,
}

const OVERLAY_APPEARING_TIMEWINDOW = 2000; // 2seconds


export const NavigationUtil = {

  /**
   * this will ensure the overlays will not be opened doubly.
   * @param target
   * @param props
   */
  showOverlay(target, props) {
    // // addSentryLog("showOverlay", target);
    LOGi.nav("NavigationUtil: I WANT TO SHOW THIS OVERLAY", target);

    LOGi.nav("WILL SHOW NOW", target);

    Navigation.showOverlay(target, props);
  },

  closeOverlay(componentId) {
    Navigation.pop();
  },


  init() {
  },

  setRoot(rootStack : StackData) {
    // we add a timeout to ensure that there are no raceconditions when
    setTimeout(() => {
      // reset the NavState

      LOGi.nav("NavigationUtil: -------------------------- SET ROOT", rootStack);
      // check if we have a tabBar setup.

      LOGi.nav("NavigationUtil: This is the tabBarComponentNames");

      Navigation.setRoot({ root: rootStack });
    }, 25);
  },


  launchModal: function(target, props = {}) {
    // // addSentryLog("launchModal", target);
    LOGi.nav("NavigationUtil: Navigating from", NavState.activeView, "to", target, props);
    // NavState.modalActive();
    Navigation.showModal({
      stack:{
        children: [
          { component: { name: target, passProps: props }}
        ],
        options: {
          modal: {
            swipeToDismiss: false,
          }
        }
      }
    })
  },


  dismissModal: function() {
    LOGi.nav("NavigationUtil: CALLING dismissModal start");
    LOGi.nav("NavigationUtil: CALLING dismissModal on", backFrom);
    // addSentryLog("dismissModal", backFrom);
    return Navigation.dismissModal(backFrom)
      .then(() => {
        LOGi.nav("NavigationUtil: DISMISS Going back from ", backFrom, " success!")
      })
      .catch((err) => {
        LOGw.nav("NavigationUtil: DISMISS Going back from ", backFrom, " FAILED!", err?.message)
      });
  },

  dismissModalAndBack: async function() {
    // addSentryLog("dismissModalAndBack", "null");
    await NavigationUtil.baseStackBack();
    NavigationUtil.dismissModal();
  },


  dismissAllModals: function() {
    // addSentryLog("dismissAllModals", "null");
    LOGi.nav("NavigationUtil: Closing all modals");
    Navigation.dismissAllModals();
  },


  dismissModalAndNavigate(target,props) {
    // addSentryLog("dismissModalAndNavigate", target);
    NavigationUtil.navigateFromUnderlyingStack(target, props);
    NavigationUtil.dismissModal()
  },

  dismissModalAndNavigateFromModal(target,props) {
    // addSentryLog("dismissModalAndNavigateFromModal", target);
    NavigationUtil.dismissModal();
    NavigationUtil.navigateFromUnderlyingModal(target, props);
  },


  dismissAllModalsAndNavigate(target,props) {
    // addSentryLog("dismissAllModalsAndNavigate", target);
    NavigationUtil.navigateFromUnderlyingStack(target, props);
    NavigationUtil.dismissAllModals()
  },

  /**
   * This wil enable (true) or disable (false) the gesture used on ios to swipe to go back on the active view.
   * @param state
   */
  setViewBackSwipeEnabled(state) {
    // Navigation.mergeOptions(componentId, {popGesture: state});
  },


  /**
   * This method is meant to call a view from a modal or an overlay. It will handle not knowing which tab you're on gracefully.
   * @param livesOnTab
   * @param target
   * @param props
   */
  navigateSafely: function(livesOnTab : string, target : string, props : any) {
    // addSentryLog("navigateSafely", target);
    if (NavState.activeTab !== livesOnTab) {
      // go to the tab
      NavigationUtil.navigateToTabName(livesOnTab);
    }

    let currentlyActiveView = NavState.getCurrentlyActiveViewData();
    if (currentlyActiveView.name === target) {
      // update view with new params
      NavigationUtil.back();
      NavigationUtil.navigate(target, props);
    }
    else {
      if (NavState.isViewNameAlreadyOpen(target)) {
        // go back to the view
        NavigationUtil.backTo(target);
        NavigationUtil.back();
        NavigationUtil.navigate(target, props);
      }
      else {
        // navigate to the view
        NavigationUtil.navigate(target, props);
      }
    }
  },

  navigate: function(target : string, props = {}) {
    // let activeView = NavState.getActiveComponent();
    // if (activeView === target) {
    //   LOGi.nav("NavigationUtil: Ignoring duplicate navigate");
    //   return;
    // }

    // addSentryLog("navigate", target);
    LOGi.nav("NavigationUtil: Navigating to", target, props);
    Navigation.navigate(target, props);
  },

  navigateTab: function(currentTabIndex) {
    let activeView = NavState.getActiveComponent();
    LOGi.nav("NavigationUtil: Navigating from ",activeView, "to tab index", currentTabIndex);
    Navigation.mergeOptions(activeView, {
      bottomTabs: {
        currentTabIndex: currentTabIndex
      }
    });
  },


  navigateFromUnderlyingModal(target, props) {
    LOGi.nav("NavigationUtil: UNDERLYING MODAL");
    let goFrom = NavState._getModalId();
    // addSentryLog("navigateFromUnderlyingModal", target);
    LOGi.nav("NavigationUtil: navigateFromUnderlyingModal from", goFrom, "to", target);
    Navigation.push(goFrom, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },

  navigateFromUnderlyingStack(target, props) {
    let goFrom = NavState._getViewId();
    // addSentryLog("navigateFromUnderlyingStack", target);
    LOGi.nav("NavigationUtil: Navigating from", goFrom, "to", target);
    Navigation.push(goFrom, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },


  back() {
    LOGi.nav("NavigationUtil: CALLING BACK");

    // addSentryLog("back", backFrom);
    return Navigation.pop()
  },


  async baseStackBack() {
    // addSentryLog("baseStackBack", backFrom);
    LOGi.nav("NavigationUtil: Going back baseStackBack");
    try {
      await Navigation.pop();
      LOGi.nav("NavigationUtil: Going back baseStackBack done on the native side, updating state...");
      LOGi.nav("NavigationUtil: Going back baseStackBack success!");
    }
    catch (err) {
      LOGw.nav("NavigationUtil: Going back baseStackBack FAILED!", err?.message);
    }
  },


  backTo(target) {
    // addSentryLog("backTo", target);
    Navigation.popTo(target)
  },

};

/**
 * quickly get the last item in an array. This should clean up the code a bit since:
 * this.modals[this.modal.length - 1][this.modals[this.modal.length - 1].length -1] is very ugly and unclear
 * lastItem(lastItem(this.modals)) is much compacter.
 *
 * It is also typed to catch most errors.
 * @param arr
 */
function lastItem<T>(arr : T[]) : T {
  return arr[arr.length - 1];
}
