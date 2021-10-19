import * as React from 'react'; import { Component, PureComponent } from "react";
import { AppState } from 'react-native';
import { Navigation } from "react-native-navigation";
import { NavigationUtil } from "../util/NavigationUtil";
import { core } from "../Core";
import { TopBarUtil } from "../util/TopBarUtil";


export class LiveComponent<a, b> extends Component<a, b> {
  ___subscribedToAppState = false;
  ___shouldForceUpdate = false;
  ___hasOverriddenUnmount = false;
  ___navListener = null;
  ___eventListeners = [];


  constructor(props) {
    super(props);

    let removeNavBarRedrawListener = core.eventBus.on("permissionsHaveBeenUpdated", () => {

      // @ts-ignore
      if (this._updateNavBar && typeof this._updateNavBar === 'function') {
        // @ts-ignore
        this._updateNavBar();
      }

      super.forceUpdate();
    })

    let removeRefreshListener = core.eventBus.on("FORCE_RERENDER", () => {
      Navigation.mergeOptions(props.componentId,{})
      this.forceUpdate();
    });

    let unmounter = this.componentWillUnmount;
    // let renderer = this.render;
    this.componentWillUnmount = () => {
      this.___cleanup();
      removeRefreshListener();
      removeNavBarRedrawListener();
      if (unmounter) {
        unmounter.call(this)
      }
    }


    // this.render = () => {
    //   // @ts-ignore
    //   // console.log("RENDERING", this.__proto__.constructor.name);
    //   if (renderer) {
    //     return renderer.call(this)
    //   }
    // }

    let buttonPress = this.navigationButtonPressed;
    if (props.componentId) {
      this.___navListener = Navigation.events().bindComponent(this);

      this.navigationButtonPressed = (data) => {
        buttonPress.call(this,data);
        if (data.buttonId === 'closeModal')  { NavigationUtil.dismissModal(); }
        if (data.buttonId === 'cancelModal') { NavigationUtil.dismissModal(); }
      }
    }
  }

  navigationButtonPressed(data) {
  }

  forceUpdate(cb?) {
    if (AppState.currentState !== 'active') {
      this.___shouldForceUpdate = true;
      if (this.___subscribedToAppState === false) {
        this.___subscribedToAppState = true;
        AppState.addEventListener('change', this.__appStateSubscription);
      }
    }
    else {
      this.___shouldForceUpdate = false;
      super.forceUpdate(cb);
    }
  }

  __appStateSubscription = (nextAppState) => {
    if (nextAppState === "active") {
      if (this.___shouldForceUpdate === true) {
        this.___shouldForceUpdate = false;
        super.forceUpdate();
      }
    }
  };

  ___cleanup() {
    if (this.___navListener) {
      this.___navListener.remove();
    }

    if (this.___eventListeners.length > 0) {
      this.___eventListeners.forEach((unsubscribe) => { unsubscribe() })
    }

    if (this.___subscribedToAppState) {
      AppState.removeEventListener('change', this.__appStateSubscription)
    }
  }

}