// import * as Sentry from "@sentry/react-native";
import {LOGd, LOGi, LOGw} from "../../logging/Log";
import {core} from "../../Core";
import { Navigation } from "react-native-navigation";
import { colors } from "../../views/styles";
import { BASE_TAB_NAME, NavState } from "./NavState";



let loadNamesFromStack = (stack) => {
  if (stack?.bottomTabs?.children) {
    stack.bottomTabs.children.forEach((child) => {
      if (child?.stack?.children) {
        tabBarComponentNames.push(child.stack.children[0].component.name);
      }
      else if (child?.sideMenu?.center?.stack?.children) {
        tabBarComponentNames.push(child.sideMenu.center.stack.children[0].component.name);
      }
    })
  }
};

let tabBarComponentNames = [];
export let topBarComponentNames = [];


// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidAppearListener(({ componentId, componentName }) => {
  if (componentId === 'SphereOverviewSideBar') { return; }

  // console.log("registerComponentDidAppearListener", { componentId, componentName })
  if (topBarComponentNames.indexOf(componentName) === -1) {
    LOGi.nav("VIEW DID APPEAR", componentId, componentName);
    if (tabBarComponentNames.indexOf(componentName) !== -1) {
      NavState.switchTab(componentId, componentName);
    }
    NavState.addView(componentId, componentName);
  }

  core.eventBus.emit("VIEW_DID_APPEAR", componentId);
});
// Listen for componentDidAppear screen events
Navigation.events().registerComponentWillAppearListener(({ componentId, componentName }) => {
  // console.log('registerComponentWillAppearListener', componentId, componentName)
});
// Listen for componentDidAppear screen events
Navigation.events().registerCommandListener((data, args) => {
  // console.log('registerCommandListener', data, JSON.stringify(args, null, 2))
});

// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidDisappearListener(({ componentId, componentName }) => {
  core.eventBus.emit("VIEW_DID_DISAPPEAR", componentId);
  LOGi.nav("VIEW DID DISAPPEAR", componentId, componentName);
});



export const NavigationUtil = {

  /**
   * this will ensure the overlays will not be opened doubly.
   * @param target
   * @param props
   */
  showOverlay(target, props) {
    // // addSentryLog("showOverlay", target);
    LOGi.nav("NavigationUtil: I WANT TO SHOW THIS OVERLAY", target);
    LOGi.nav("NavigationUtil: is this overlay open?", target, NavState.isThisOverlayOpen(target));

    if (NavState.isThisOverlayOpen(target)) {
      return;
    }

    NavState.showOverlay(target);

    LOGi.nav("WILL SHOW NOW", target);
    Navigation.showOverlay({
      component: {
        id: target,
        name: target,
        passProps: props,
        options: {
          layout: {
            componentBackgroundColor: "transparent",
          },
          overlay: {
            interceptTouchOutside: true,
            handleKeyboardEvents: true,
          },
          statusBar: {
            drawBehind: true,
          },
        }
      },
    })
  },

  closeOverlay(componentId) {
    NavState.closeOverlay(componentId);
    Navigation.dismissOverlay(componentId);
  },


  init() {
    NavState.resetState();
  },

  setRoot(rootStack : StackData) {
    // we add a timeout to ensure that there are no raceconditions when
    setTimeout(() => {
      // // addSentryLog("rootStack", "stack");

      // reset the NavState
      NavState.setRoot();

      LOGi.nav("NavigationUtil: -------------------------- SET ROOT", rootStack);
      // check if we have a tabBar setup.
      tabBarComponentNames = [];
      loadNamesFromStack(rootStack);
      if (tabBarComponentNames.length === 0) {
        NavState.setBaseTab();
      }
      else {
        NavState.prepareTabs(tabBarComponentNames);
      }

      LOGi.nav("NavigationUtil: This is the tabBarComponentNames", tabBarComponentNames);

      Navigation.setRoot({ root: rootStack });
    }, 25);
  },


  launchModal: function(target, props = {}) {
    // // addSentryLog("launchModal", target);
    LOGi.nav("NavigationUtil: Navigating from", NavState.activeView, "to", target, props);
    NavState.expectModal(target);
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


  getActiveView() : string {
    return NavState.getActiveComponent()
  },

  isOnView(viewName) : boolean {
    let activeView = NavState.getActiveComponent()
    return activeView === viewName;
  },

  isModalOpen(viewName) {
    return NavState.isModalViewNameOpen(viewName);
  },

  setForcedModalStackRoot(viewName) {
    NavState.setForcedModalStackRoot(viewName)
  },

  dismissModal: function() {
    LOGi.nav("NavigationUtil: CALLING dismissModal start");
    let backFrom = NavState.getActiveComponent();
    LOGi.nav("NavigationUtil: CALLING dismissModal on", backFrom);
    // addSentryLog("dismissModal", backFrom);
    NavState.modalDismissed();
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
    NavState.allModalsDismissed();
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
    let componentId = NavState.getActiveComponent();
    Navigation.mergeOptions(componentId, {popGesture: state});
  },


  /**
   * This method is meant to call a view from a modal or an overlay. It will handle not knowing which tab you're on gracefully.
   * @param livesOnTab
   * @param target
   * @param props
   */
  navigateSafely: function(livesOnTab : string, target : string, props : any) {
    // addSentryLog("navigateSafely", target);

    if (!NavState.tabIsLoaded(livesOnTab)) {
      // if not, ignore.
      return;
    }

    if (NavState.areModalsOpen()) {
      NavigationUtil.dismissAllModals();
    }

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
    let activeView = NavState.getActiveComponent();
    if (activeView === target) {
      LOGi.nav("NavigationUtil: Ignoring duplicate navigate");
      return;
    }

    // addSentryLog("navigate", target);
    LOGi.nav("NavigationUtil: Navigating from",activeView, "to", target, props);
    Navigation.push(activeView, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
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


  navigateToBaseTab() {
    // addSentryLog("navigateToBaseTab", "null");
    NavigationUtil.navigateToTab(0)
  },

  navigateToTabName(tabName) {
    // addSentryLog("navigateToTabName", tabName);

    let tabIndex = tabBarComponentNames.indexOf(tabName);
    if (tabIndex !== -1) {
      NavigationUtil.navigateToTab(tabIndex)
    }
  },

  navigateToTab(tabIndex) {
    // addSentryLog("back", tabIndex);

    if (NavState.baseTab && NavState.baseTab !== BASE_TAB_NAME) {
      LOGi.nav(tabBarComponentNames, tabIndex);
      NavState.activeTab = tabBarComponentNames[tabIndex];
      Navigation.mergeOptions('bottomTabs', {
        bottomTabs: {
          currentTabIndex: tabIndex
        }
      });
    }
  },


  back() {
    LOGi.nav("NavigationUtil: CALLING BACK");
    let backFrom = NavState.getActiveComponent();
    NavState.pop();

    // addSentryLog("back", backFrom);
    return Navigation.pop(backFrom)
      .then(() => {
        LOGi.nav("NavigationUtil: Going back from ", backFrom, " success!")
      })
      .catch((err) => {
        LOGw.nav("NavigationUtil: Going back from ", backFrom, " FAILED!", err?.message)
      })
  },


  async baseStackBack() {
    let backFrom = NavState._getViewId();
    // addSentryLog("baseStackBack", backFrom);
    LOGi.nav("NavigationUtil: Going back baseStackBack", backFrom);
    try {
      await Navigation.pop(backFrom);
      LOGi.nav("NavigationUtil: Going back baseStackBack ", backFrom, " done on the native side, updating state...");
      NavState.popView();
      LOGi.nav("NavigationUtil: Going back baseStackBack ", backFrom, " success!");
    }
    catch (err) {
      LOGw.nav("NavigationUtil: Going back baseStackBack ", backFrom, " FAILED!", err?.message);
    }
  },


  backTo(target) {
    // addSentryLog("backTo", target);
    let componentId = NavState.backTo(target);
    if (componentId) {
      Navigation.popTo(componentId)
    }
    else {
      throw new Error("CAN NOT FIND THIS COMPONENT " + target);
    }
  },


  setTabBarOptions(selectedColor: string, baseColor: string) {
    let componentId = NavState._getViewId();
    let options = { bottomTab: {
        textColor: baseColor,
        selectedTextColor: selectedColor,
        iconColor: baseColor,
        selectedIconColor: selectedColor,
      }}
    Navigation.mergeOptions("SphereOverview", options);
    Navigation.mergeOptions("ScenesOverview", options);
    Navigation.mergeOptions("EnergyUsage", options);
    Navigation.mergeOptions("SettingsOverview", options);
  },

  openDrawer() {
    let componentId = NavState._getViewId();
    Navigation.mergeOptions(componentId, { sideMenu: {left:{visible: true}}})
  },
  closeDrawer() {
    let componentId = NavState._getViewId();
    Navigation.mergeOptions(componentId, { sideMenu: {left:{visible: false}}})
  },
};

