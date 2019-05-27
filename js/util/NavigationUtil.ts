// import { DrawerActions, NavigationActions, StackActions } from "react-navigation";
// import { navigationStore } from "../router/NavigationReducer";


import { Navigation } from "react-native-navigation";
import { Stacks } from "../router/Stacks";

let NavigationActions = {
  navigate: function(any?) {},
  back: function(any?) {},
}

let StackActions = {
  navigate: function(any?) {},
  reset: function(any?) {},
}

let navigationStore = {
  dispatch: function(any) {},
}


class NavStateManager {

  activeView = null;
  overlayName = {};
  overlayId = {};
  modals = [];
  views  = [];
  overlayIncoming = false;

  addView(componentId, name) {
    if (this.overlayIncoming === true) {
      // overlays will be closed by their OWN id, it is not tracked by the activeView.
      this.overlayName[name] = {id:componentId, name: name};
      this.overlayId[componentId] = {id:componentId, name: name};
      this.overlayIncoming = false;
      return;
    }
    else if (this.modals.length > 0) {
      this.modals[this.modals.length - 1].push({id:componentId, name: name});
    }
    else {
      this.views.push({id:componentId, name: name});
    }
    this.activeView = componentId;
  }

  pop() {
    if (this.modals.length > 0) {
      if (this.modals[this.modals.length - 1].length > 0) {
        this.modals[this.modals.length - 1].pop();
      }
      else {
        console.log("Maybe wanted to dismiss the modal?")
      }
    }
    else {
      if (this.views.length > 0) {
        this.views.pop();
      }
      else {
        console.log("Maybe something is wrong?")
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
        console.log("Maybe wanted to dismiss the modal?")
      }
    }
    else {
      if (this.views.length > 0) {
        this.activeView = this.views[this.views.length - 1].id;
      }
      else {
        console.log("Maybe something is wrong?")
      }
    }
  }

  modalActive() {
    this.modals.push([]);
  }

  modalDismissed() {
    this.modals.pop();
    this._getId();
  }

  showOverlay() {
    this.overlayIncoming = true;
  }

  closeOverlay(componentId) {
    if (this.overlayId[componentId] !== undefined) {
      let name = this.overlayId[componentId].name;
      delete this.overlayId[componentId];
      delete this.overlayName[name];
    }
  }

  isOverlayOpen(targetName) {
    return this.overlayName[targetName] !== undefined;
  }


  allModalsDismissed() {
    this.modals = [];
    this._getId();
  }

  setRoot() {
    this.modals      = [];
    this.views       = [];
    this.overlayId   = {};
    this.overlayName = {};
  }

  backTo(name) : string {
    let targetId = null;
    let spliceTarget = null;
    if (this.modals.length > 0) {
      let toplevelModal = this.modals[this.modals.length -1];

      for (let i = toplevelModal.length -1; i >= 0; i--) {
        if (toplevelModal[i].name === name) {
          targetId = toplevelModal[i].id;
          spliceTarget = i;
          break;
        }
      }

      if (spliceTarget !== null) {
        this.modals[this.modals.length - 1].splice(spliceTarget)
      }
    }
    else {
      if (this.views.length > 0) {
        for (let i = this.views.length -1; i >= 0; i--) {
          if (this.views[i].name === name) {
            targetId = this.views[i].id;
            spliceTarget = i;
            break;
          }
        }

        if (spliceTarget !== null) {
          this.views.splice(spliceTarget)
        }
      }
      else {
        console.log("Maybe something is wrong?")
      }
    }

    if (targetId !== null) {
      this._getId();
    }

    return targetId;
  }

}


const NavState = new NavStateManager();

// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidAppearListener(({ componentId, componentName }) => {
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
    if (NavState.isOverlayOpen(target)) {
      return;
    }

    NavState.showOverlay();
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

  setRoot(rootStack) {
    NavState.setRoot();
    Navigation.setRoot({ root: rootStack });
  },

  launchModal: function(target, props = {}) {
    console.log("Navigating from", NavState.activeView, "to", target, props)
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
    console.log("Closing modal", NavState.activeView);
    Navigation.dismissModal(NavState.activeView)
    NavState.modalDismissed();
  },
  dismissAllModals: function() {
    console.log("Closing all modals");
    Navigation.dismissAllModals()
    NavState.allModalsDismissed();
  },

  navigate: function(target, props = {}) {
    console.log("Navigating from", NavState.activeView, "to", target, props)
    Navigation.push(NavState.activeView, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },

  back() {
    console.log("Going back from", NavState.activeView)
    Navigation.pop(NavState.activeView)
    NavState.pop();
  },

  backTo(target) {
    let componentId = NavState.backTo(target);
    if (componentId) {
      Navigation.popTo(componentId)
    }
  },
};