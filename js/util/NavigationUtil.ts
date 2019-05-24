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

  },

  backToTop() {
    setTimeout(() => {
      const navigateAction = NavigationActions.back();
      navigationStore.dispatch(navigateAction);
    })
  },

  reset(target, params = {}) {
    setTimeout(() => {
      const navigateAction = StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName: target, params: params })],
      });

      navigationStore.dispatch(navigateAction);
    })
  },

  navigateAndReplace: function(target, params = {}) {
    setTimeout(() => {
      const navigateAction = NavigationActions.navigate({
        routeName: target,
        params: {...params, __popBeforeAdd:1},
      });

      navigationStore.dispatch(navigateAction);
    });
  },

  navigateAndReplaceVia: function(via, target, params = {}) {
    setTimeout(() => {
      const navigateAction1 = NavigationActions.navigate({
        routeName: via,
        params: { ...params, __popBeforeAdd: 1 },
      });
      const navigateAction2 = NavigationActions.navigate({
        routeName: target,
        params: params,
      });

      navigationStore.dispatch(navigateAction1);
      navigationStore.dispatch(navigateAction2);
    });
  },

  backAndNavigate: function(target, params = {}) {
    setTimeout(() => {
      const navigateAction2 = NavigationActions.navigate({
        routeName: target,
        params: params,
      });

      navigationStore.dispatch(NavigationActions.back());
      navigationStore.dispatch(navigateAction2);
    });
  },

  logout: function() {
    setTimeout(() => {
      let action = {
        type: 'Navigation/BACK',
        logout: true,
      };
      navigationStore.dispatch(action);
    });
  }
};