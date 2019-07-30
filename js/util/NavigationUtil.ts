// import { DrawerActions, NavigationActions, StackActions } from "react-navigation";
// import { navigationStore } from "../router/NavigationReducer";


import { Navigation } from "react-native-navigation";

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


/**
 * This class mimics the state of the navigation.
 *
 *
 * Overlays live on top of everything
 *
 * Modals can be layered and always live on top of views.
 *  their data model is an array of component arrays. Every modal can have it's own navigation stack.
 *
 * Views can be sorted with tabs. We have to maintain a number of stacks, one for each tab. If there are no tabs used, we
 *   fall back to the BASE_TAB_NAME
 *
 *
 */
class NavStateManager {
  activeModal : string = null;
  activeView : activeView = {};
  overlayNames = {};
  overlayId = {};
  modals : componentInfo[][] = [];
  views : views = {};
  overlayIncoming = false;

  overlayIncomingName = null;
  activeTab = null;

  baseTab = null;


  /**
   * Load the default initial tabname into the views so we have something to navigate from
   */
  setBaseTab() {
    this.views = {};

    if (this.views[BASE_TAB_NAME] === undefined) {
      this.views[BASE_TAB_NAME] = [];
    }
    this.activeTab = BASE_TAB_NAME;
    this.baseTab = BASE_TAB_NAME;
  }


  /**
   * A stack has loaded, prepare the view objects.
   * @param tabNames
   */
  prepareTabs(tabNames : string[]) {
    this.views = {};

    for (let i = 0; i < tabNames.length; i++) {
      if (this.views[tabNames[i]] === undefined) { this.views[tabNames[i]] = []; }
    }
    this.activeTab = tabNames[0];
    this.baseTab = tabNames[0];
  }

  /**
   * The pointer is on the base tab
   */
  isOnBaseTab() {
    return this.baseTab === this.activeTab;
  }


  switchTab(componentId, componentName) {
    if (this.activeTab === null) {
      this.baseTab = componentName;
    }

    this.activeTab = componentName;
    if (this.views[componentName] === undefined) {
      this.views[componentName] = [];
    }
  }

  tabIsLoaded(tabName) {
    return this.views[tabName] !== undefined;
  }


  /**
   * This returns the id of the active view. We call it component since it can also be a modal.
   */
  getActiveComponent() {
    if (this.activeModal !== null) {
      return this.activeModal;
    }

    return this.activeView[this.activeTab];
  }


  /**
   * We get an appear of a view, check if it is already open, if so, reset the pointer and stack to that.
   * @param componentId
   * @param name
   */
  handleIfAlreadyOpen(componentId, name) {
    // check if this component is already open as a modal
    if (this.isModalIdAlreadyOpen(componentId)) {
      this.backTo(name);
      return true;
    }

    if (!this.activeTab) { return false; }


    // check if this component is already open as a view.
    if (this.isViewIdAlreadyOpen(componentId)) {
      this.backTo(name);
      return true;
    }
    return false;
  }

  isModalIdAlreadyOpen(componentId) {
    for (let i = 0; i < this.modals.length; i++) {
      for (let j = 0; j < this.modals[i].length; j++) {
        if (this.modals[i][j].id === componentId) {
          return true;
        }
      }
    }
    return false;
  }

  isViewNameAlreadyOpen(name) {
    for (let i = 0; i < this.views[this.activeTab].length; i++) {
      if (this.views[this.activeTab][i].name === name) {
        return true;
      }
    }
    return false;
  }

  isViewIdAlreadyOpen(componentId) {
    for (let i = 0; i < this.views[this.activeTab].length; i++) {
      if (this.views[this.activeTab][i].id === componentId) {
        return true;
      }
    }
    return false;
  }

  addView(componentId, name) {
    if (this.handleIfAlreadyOpen(componentId, name)) { return; }

    // console.log("HERE", componentId, name);
    // console.log("active: ", this.activeTab);
    // console.log("Views:", this.views, "Modals:", this.modals, "overlays:", this.overlayNames);

    if (this.overlayIncoming === true && this.overlayIncomingName === name) {
      this.overlayIncomingName = null;

      // overlays will be closed by their OWN id, it is not tracked by the activeView.
      // we use this layer to catch incoming overlay views so that they do not contaminate the underlaying modal and view stacks.
      this.overlayNames[name] = {id:componentId, name: name};
      this.overlayId[componentId] = {id:componentId, name: name};
      this.overlayIncoming = false;
      return;
    }
    else if (this.modals.length > 0) {
      lastItem(this.modals).push({id:componentId, name: name});
      this.activeModal = componentId;
    }
    else {
      // No modals, just in case, set it back to null.
      this.activeModal = null;

      // if the root view has not loaded yet and another view comes in first,
      // this is probably a race condition and we'll ignore the intervening view
      if (this.baseTab !== BASE_TAB_NAME) {
        if (
          name !== this.baseTab &&                   // if this view is not the actual base tab.
          this.activeTab === this.baseTab &&         // this is only valid if we are actually on the base tab
          this.isViewNameAlreadyOpen(this.baseTab) === false // if the base tab itself has not loaded yet
        ) {
          // console.log("IGNORE PROBABLE RACE CONDITION.", this.baseTab, componentId, name);
          return;
        }
      }
      this.views[this.activeTab].push({id:componentId, name: name});
      this.activeView[this.activeTab] = componentId;
    }

    // console.log("Views:", this.views, "Modals:", this.modals, "overlays:", this.overlayNames)
  }

  isTargetViewNameCurrentlyActive(targetName) {
    if (lastItem(this.views[this.activeTab]).name === targetName) {
      return true;
    }
  }

  getCurrentlyActiveViewData() {
    if (this.views[this.activeTab].length === 0) {
      return null;
    }
    return lastItem(this.views[this.activeTab]);
  }

  popView() {
    if (this.views[this.activeTab].length > 0) {
      this.views[this.activeTab].pop();
    }
    else {
      console.warn("Maybe something is wrong?")
    }
  }

  pop() {
    if (this.modals.length > 0) {
      if (lastItem(this.modals).length > 0) {
        lastItem(this.modals).pop();
      }
      else {
        console.warn("Maybe wanted to dismiss the modal?")
      }
    }
    else {
      if (this.views[this.activeTab].length > 0) {
        this.views[this.activeTab].pop();
      }
      else {
        console.warn("Maybe something is wrong?")
      }
    }

    this._getId();
  }

  _getId() {
    if (this.modals.length > 0) {
      if (lastItem(this.modals).length > 0) {
        this.activeModal = lastItem(lastItem(this.modals)).id;
      }
      else {
        console.warn("Maybe wanted to dismiss the modal?")
      }
    }
    else {
      this.activeModal = null;

      if (this.views[this.activeTab].length > 0) {
        this.activeView[this.activeTab] = lastItem(this.views[this.activeTab]).id;
      }
      else {
        console.warn("Maybe something is wrong?")
      }
    }
  }

  _getModalId() : string {
    // console.log(JSON.stringify(this.modals), this.activeModal);
    return this.activeModal;
  }

  _getViewId() {
    if (this.views[this.activeTab].length > 0) {
     return lastItem(this.views[this.activeTab]).id;
    }
    else {
      console.warn("Maybe something is wrong?")
    }
  }

  modalActive() {
    this.modals.push([]);
  }

  modalDismissed() {
    this.modals.pop();
    this._getId();
  }

  showOverlay(targetName) {
    this.overlayIncoming = true;
    this.overlayIncomingName = targetName;
  }

  closeOverlay(componentId) {
    if (this.overlayId[componentId] !== undefined) {
      let name = this.overlayId[componentId].name;
      delete this.overlayId[componentId];
      delete this.overlayNames[name];
    }
  }

  isThisOverlayOpen(targetName) {
    // console.log("@isThisOverlayOpen Views:", this.views, "Modals:", this.modals, "overlays:", this.overlayNames, "overlayIncomingName", this.overlayIncomingName);

    return this.overlayNames[targetName] !== undefined || this.overlayIncomingName === targetName;
  }

  allModalsDismissed() {
    this.modals = [];
    this._getId();
  }

  setRoot() {
    this.baseTab      = null;
    this.activeTab    = null;
    this.activeView   = {};
    this.modals       = [];
    this.views        = {};
    this.overlayId    = {};
    this.overlayNames = {};
  }

  backTo(name) : string {
    let targetId = null;
    let spliceTarget = null;
    if (this.modals.length > 0) {
      let toplevelModal = lastItem(this.modals);

      for (let i = toplevelModal.length -1; i >= 0; i--) {
        if (toplevelModal[i].name === name) {
          targetId = toplevelModal[i].id;
          spliceTarget = i + 1; // we want to keep the target, and remove the rest.
          break;
        }
      }

      this.activeModal = targetId;

      if (spliceTarget !== null) {
        lastItem(this.modals).splice(spliceTarget);
      }
    }
    else {
      if (this.views[this.activeTab].length > 0) {
        for (let i = this.views[this.activeTab].length -1; i >= 0; i--) {
          if (this.views[this.activeTab][i].name === name) {
            targetId = this.views[this.activeTab][i].id;
            spliceTarget = i + 1; // we want to keep the target, and remove the rest.
            break;
          }
        }

        this.activeView[this.activeTab] = targetId;

        if (spliceTarget !== null) {
          this.views[this.activeTab].splice(spliceTarget)
        }
      }
      else {
        console.warn("Maybe something is wrong?")
      }
    }

    if (targetId === null) {
      this._getId();
    }

    // console.log("IN BACK TO active: ", this.activeTab);
    // console.log("IN BACK TO Views:", this.views, "Modals:", this.modals, "overlays:", this.overlayNames);

    return targetId;
  }

  isOverlayOpen() {
    return Object.keys(this.overlayId).length > 0;
  }

  isModalOpen() {
    return this.modals.length > 0;
  }

  canGoBack() {
    if (this.modals.length > 0) {
      if (lastItem(this.modals).length > 1) {
        return true;
      }
      else {
        return false;
      }
    }
    else {
      if (this.views[this.activeTab].length > 1) {
        return true;
      }
      else {
        return false;
      }
    }
  }
}

export const NavState = new NavStateManager();

let loadNamesFromStack = (stack) => {
  if (stack && stack.bottomTabs && stack.bottomTabs.children) {
    stack.bottomTabs.children.forEach((child) => {
      if (child && child.stack && child.stack.children) {
        tabBarComponentNames.push(child.stack.children[0].component.name);
      }
    })
  }
};

let tabBarComponentNames = [];

// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidAppearListener(({ componentId, componentName }) => {
  // console.log("VIEW DID APPEAR", componentId, componentName);
  if (tabBarComponentNames.indexOf(componentName) !== -1) {
    NavState.switchTab(componentId, componentName)
  }

  NavState.addView(componentId, componentName);
});

// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidDisappearListener(({ componentId, componentName }) => {
  // console.log("VIEW DID DISAPPEAR", componentId, componentName)
});



export const NavigationUtil = {

  /**
   * this will ensure the overlays will not be opened doubly.
   * @param target
   * @param props
   */
  showOverlay(target, props) {
    // console.log("I WANT TO SHOW THIS OVERLAY", target);

    // console.log("is this overlay open?", target, NavState.isThisOverlayOpen(target));

    if (NavState.isThisOverlayOpen(target)) {
      return;
    }

    NavState.showOverlay(target);

    // console.log("WILL SHOW NOW");
    Navigation.showOverlay({
      component: {
        id: target,
        name: target,
        passProps: props,
        options: {
          overlay: {
            interceptTouchOutside: true
          }
        }
      },
    })
  },

  closeOverlay(componentId) {
    NavState.closeOverlay(componentId);
    Navigation.dismissOverlay(componentId);
  },


  setRoot(rootStack : StackData) {
    // reset the NavState
    NavState.setRoot();

    // console.log("----------------------_____SET ROOT");
    // check if we have a tabBar setup.
    tabBarComponentNames = [];
    loadNamesFromStack(rootStack);
    if (tabBarComponentNames.length === 0) {
      NavState.setBaseTab();
    }
    else {
      NavState.prepareTabs(tabBarComponentNames);
    }

    // console.log("This is the tabBarComponentNames", tabBarComponentNames);

    Navigation.setRoot({ root: rootStack });
  },


  launchModal: function(target, props = {}) {
    // console.log("Navigating from", NavState.activeView, "to", target, props);
    NavState.modalActive();
    Navigation.showModal({
      stack:{
        children: [
          { component: { name: target, passProps: props }}
        ]
      }
    })
  },


  dismissModal: function() {
    // console.log("CALLING dismissModal");
    let backFrom = NavState.getActiveComponent();
    Navigation.dismissModal(backFrom)
      .then(() => {
        // console.log("DISMISS Going back from ", backFrom, " success!")
      })
      .catch((err) => {
        // console.log("DISMISS Going back from ", backFrom, " FAILED!", err)
      });
    NavState.modalDismissed();
  },


  dismissModalAndBack: function() {
    NavigationUtil.baseStackBack();
    NavigationUtil.dismissModal();
  },


  dismissAllModals: function() {
    // console.log("Closing all modals");
    Navigation.dismissAllModals();
    NavState.allModalsDismissed();
  },


  dismissModalAndNavigate(target,props) {
    NavigationUtil.navigateFromUnderlyingStack(target, props);
    NavigationUtil.dismissModal()
  },

  dismissModalAndNavigateFromModal(target,props) {
    NavigationUtil.dismissModal()
    NavigationUtil.navigateFromUnderlyingModal(target, props);
  },


  dismissAllModalsAndNavigate(target,props) {
    NavigationUtil.navigateFromUnderlyingStack(target, props);
    NavigationUtil.dismissAllModals()
  },


  /**
   * This method is meant to call a view from a modal or an overlay. It will handle not knowing which tab you're on gracefully.
   * @param livesOnTab
   * @param target
   * @param props
   */
  navigateSafely: function(livesOnTab : string, target : string, props : any) {
    if (!NavState.tabIsLoaded(livesOnTab)) {
      // if not, ignore.
      return;
    }

    if (NavState.isModalOpen()) {
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
    // console.log("Navigating from",activeView, "to", target, props);
    Navigation.push(activeView, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },


  navigateFromUnderlyingModal(target, props) {
    // console.log("UNDERLYING MODAL");
    let goFrom = NavState._getModalId();
    // console.log("navigateFromUnderlyingModal from", goFrom, "to", target)
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
    // console.log("Navigating from", goFrom, "to", target);
    Navigation.push(goFrom, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },


  navigateToBaseTab() {
    NavigationUtil.navigateToTab(0)
  },

  navigateToTabName(tabName) {
    let tabIndex = tabBarComponentNames.indexOf(tabName);
    if (tabIndex !== -1) {
      NavigationUtil.navigateToTab(tabIndex)
    }
  },

  navigateToTab(tabIndex) {
    if (NavState.baseTab && NavState.baseTab !== BASE_TAB_NAME) {
      // console.log(tabBarComponentNames, tabIndex);
      NavState.activeTab = tabBarComponentNames[tabIndex];
      Navigation.mergeOptions('bottomTabs', {
        bottomTabs: {
          currentTabIndex: tabIndex
        }
      });
    }
  },


  back() {
    // console.log("CALLING BACK");
    let backFrom = NavState.getActiveComponent();
    NavState.pop();
    return Navigation.pop(backFrom)
      .then(() => {
        // console.log("Going back from ", backFrom, " success!")
      })
      .catch((err) => {
        // console.log("Going back from ", backFrom, " FAILED!", err)
      })
  },


  baseStackBack() {
    let backFrom = NavState._getViewId();
    // console.log("Going back baseStackBack", backFrom);
    NavState.popView();
    Navigation.pop(backFrom)
      .then(() => {
        // console.log("Going back baseStackBack ", backFrom, " success!")
      })
      .catch((err) => {
        // console.log("Going back baseStackBack ", backFrom, " FAILED!", err)
      })
  },


  backTo(target) {
    let componentId = NavState.backTo(target);
    if (componentId) {
      Navigation.popTo(componentId)
    }
    else {
      throw "CAN NOT FIND THIS COMPONENT " + target
    }
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
