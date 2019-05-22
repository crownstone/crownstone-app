import * as React from 'react'; import { Component, PureComponent } from "react";
import { AppState } from 'react-native';


export class LiveComponent<a, b> extends Component<a, b> {
  ___subscribedToAppState = false;
  ___shouldForceUpdate = false;
  ___hasOverriddenUnmount = false;

  constructor(props) {
    super(props);

    let unmounter = this.componentWillUnmount;
    // let renderer = this.render;
    this.componentWillUnmount = () => {
      this.___cleanup();
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
  }

  forceUpdate() {
    if (AppState.currentState !== 'active') {
      this.___shouldForceUpdate = true;
      if (this.___subscribedToAppState === false) {
        this.___subscribedToAppState = true;
        AppState.addEventListener('change', this.__appStateSubscription);
      }
    }
    else {
      this.___shouldForceUpdate = false;
      super.forceUpdate();
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
    if (this.___subscribedToAppState) {
      AppState.removeEventListener('change', this.__appStateSubscription)
    }
  }

}