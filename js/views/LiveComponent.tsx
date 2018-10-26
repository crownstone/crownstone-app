import * as React from 'react'; import { Component } from 'react';
import { AppState } from 'react-native';

export class LiveComponent<a, b> extends Component<a, b> {
  ___subscribedToAppState = false;
  ___shouldForceUpdate = false;

  constructor(props) {
    super(props);
    super.componentWillUnmount = () => {

    }
  }

  forceUpdate() {
    if (AppState.currentState === 'background') {
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
  }

  componentWillUnmount() {
    if (this.___subscribedToAppState) {
      AppState.removeEventListener('change', this.__appStateSubscription)
    }
  }
}