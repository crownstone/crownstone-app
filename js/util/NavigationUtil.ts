// import { DrawerActions, NavigationActions, StackActions } from "react-navigation";
// import { navigationStore } from "../router/NavigationReducer";


import { Navigation } from "react-native-navigation";

const BASE_TAB_NAME = "BASE_TAB";

interface views {
  [key: string]: componentInfo[]
}

interface componentInfo {
  id: string,
  name: string,
}

class NavStateManager {

  activeView = {};
  overlayNames = {};
  overlayId = {};
  modals = [];
  views : views = {};
  overlayIncoming = false;

  overlayIncomingName = null;
  activeTab = null;

  baseTab = null;

  setBaseTab() {
    if (this.views[BASE_TAB_NAME] === undefined) {
      this.views[BASE_TAB_NAME] = [];
    }
    this.activeTab = BASE_TAB_NAME;
    this.baseTab = BASE_TAB_NAME;
  }

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
      this.addView(componentId, componentName);
    }
  }

  getActiveView() {
    return this.activeView[this.activeTab];
  }

  addView(componentId, name) {
    // console.log("HERE", componentId, name)
    // console.log("Views:", this.views, "Modals:", this.modals, "overlays:", this.overlayNames)

    if (this.overlayIncoming === true) {
      if (this.overlayIncomingName === name) {
        this.overlayIncomingName = null;
      }

      // overlays will be closed by their OWN id, it is not tracked by the activeView.
      this.overlayNames[name] = {id:componentId, name: name};
      this.overlayId[componentId] = {id:componentId, name: name};
      this.overlayIncoming = false;
      return;
    }
    else if (this.modals.length > 0) {
      this.modals[this.modals.length - 1].push({id:componentId, name: name});
    }
    else {
      this.views[this.activeTab].push({id:componentId, name: name});
    }
    this.activeView[this.activeTab] = componentId;

    // console.log("Views:", this.views, "Modals:", this.modals, "overlays:", this.overlayNames)
  }

  popView() {
    if (this.views[this.activeTab].length > 0) {
      this.views[this.activeTab].pop();
    }
    else {
      // console.warn("Maybe something is wrong?")
    }
  }

  pop() {
    if (this.modals.length > 0) {
      if (this.modals[this.modals.length - 1].length > 0) {
        this.modals[this.modals.length - 1].pop();
      }
      else {
        // console.warn("Maybe wanted to dismiss the modal?")
      }
    }
    else {
      if (this.views[this.activeTab].length > 0) {
        this.views[this.activeTab].pop();
      }
      else {
        // console.warn("Maybe something is wrong?")
      }
    }

    this._getId();
  }

  _getId() {
    if (this.modals.length > 0) {
      if (this.modals[this.modals.length - 1].length > 0) {
        this.activeView = this.modals[this.modals.length - 1].id;
      }
      else {
        // console.warn("Maybe wanted to dismiss the modal?")
      }
    }
    else {
      if (this.views[this.activeTab].length > 0) {
        this.activeView = this.views[this.activeTab][this.views[this.activeTab].length - 1].id;
      }
      else {
        // console.warn("Maybe something is wrong?")
      }
    }
  }

  _getViewId() {
    if (this.views[this.activeTab].length > 0) {
     return this.views[this.activeTab][this.views[this.activeTab].length - 1].id;
    }
    else {
      // console.warn("Maybe something is wrong?")
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
    return this.overlayNames[targetName] !== undefined || this.overlayIncomingName === targetName;
  }

  allModalsDismissed() {
    this.modals = [];
    this._getId();
  }

  setRoot() {
    this.baseTab      = null;
    this.activeTab    = null;
    this.modals       = [];
    this.views        = {};
    this.overlayId    = {};
    this.overlayNames = {};
  }

  backTo(name) : string {
    let targetId = null;
    let spliceTarget = null;
    if (this.modals.length > 0) {
      let toplevelModal = this.modals[this.modals.length -1];

      for (let i = toplevelModal.length -1; i >= 0; i--) {
        if (toplevelModal[i].name === name) {
          targetId = toplevelModal[i].id;
          spliceTarget = i + 1; // we want to keep the target, and remove the rest.
          break;
        }
      }

      if (spliceTarget !== null) {
        this.modals[this.modals.length - 1].splice(spliceTarget)
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

        if (spliceTarget !== null) {
          this.views[this.activeTab].splice(spliceTarget)
        }
      }
      else {
        // console.warn("Maybe something is wrong?")
      }
    }

    if (targetId !== null) {
      this._getId();
    }

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
      if (this.modals[this.modals.length - 1].length > 1) {
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
}

let tabBarComponentNames = [];

// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidAppearListener(({ componentId, componentName }) => {
  if (tabBarComponentNames.indexOf(componentName) !== -1) {
    return NavState.switchTab(componentId, componentName)
  }

  NavState.addView(componentId, componentName);
});

// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidDisappearListener(({ componentId, componentName }) => {

});



export const NavigationUtil = {

  /**
   * this will ensure the overlays will not be opened doubly.
   * @param target
   * @param props
   */
  showOverlay(target, props) {
    // console.log("is this overlay open?", target, NavState.isThisOverlayOpen(target))

    if (NavState.isThisOverlayOpen(target)) {
      return;
    }

    NavState.showOverlay(target);
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
    NavState.setRoot();

    // check if we have a tabBar setup.
    tabBarComponentNames = [];
    loadNamesFromStack(rootStack);
    if (tabBarComponentNames.length === 0) { NavState.setBaseTab(); }

    Navigation.setRoot({ root: rootStack });
  },


  launchModal: function(target, props = {}) {
    // console.log("Navigating from", NavState.activeView, "to", target, props)
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
    // console.log("CALLING dismissModal")
    let backFrom = NavState.getActiveView();
    Navigation.dismissModal(backFrom)
      .then(() => {
        // console.log("Going back from ", backFrom, " success!")
      })
      .catch((err) => {
        // console.log("Going back from ", backFrom, " FAILED!", err)
      })
    NavState.modalDismissed();
  },


  dismissModalAndBack: function() {
    NavigationUtil.baseStackBack();
    NavigationUtil.dismissModal();
  },


  dismissAllModals: function() {
    // console.log("Closing all modals");
    Navigation.dismissAllModals()
    NavState.allModalsDismissed();
  },


  dismissModalAndNavigate(target,props) {
    NavigationUtil.navigateFromUnderlyingStack(target, props);
    NavigationUtil.dismissModal()
  },


  dismissAllModalsAndNavigate(target,props) {
    NavigationUtil.navigateFromUnderlyingStack(target, props);
    NavigationUtil.dismissAllModals()
  },


  navigate: function(target, props = {}) {
    let activeView = NavState.getActiveView();
    // console.log("Navigating from",activeView, "to", target, props)
    Navigation.push(activeView, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },


  navigateFromUnderlyingStack(target, props) {
    let goFrom = NavState._getViewId();
    // console.log("Navigating from", goFrom, "to", target)
    Navigation.push(goFrom, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },


  navigateToBaseTab() {
    if (NavState.baseTab && NavState.baseTab !== BASE_TAB_NAME) {
      Navigation.mergeOptions('bottomTabs', {
        bottomTabs: {
          currentTabIndex: 0
        }
      });
    }
  },


  back() {
    // console.log("CALLING BACK")
    let backFrom = NavState.getActiveView();
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
    // console.log("Going back baseStackBack", backFrom)
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