import { Component } from "react"; import * as React from 'react';
import { View } from "react-native";
import { Navigation } from "react-native-navigation";


export class ViewStateWatcher extends Component<{onFocus?: () => void, onBlur?: () => void, componentId: any}, any> {
  appearListener;
  disappearListener;

  componentDidMount() {
    this.appearListener = Navigation.events().registerComponentDidAppearListener(({ componentId, componentName }) => {
      if (componentId === this.props.componentId) {
        if (this.props.onFocus) {
          this.props.onFocus();
        }
      }
    });

    this.disappearListener = Navigation.events().registerComponentDidDisappearListener(({ componentId, componentName }) => {
      if (componentId === this.props.componentId) {
        if (this.props.onBlur) {
          this.props.onBlur();
        }
      }
    });
  }

  componentWillUnmount() {
    this.appearListener.remove();
    this.disappearListener.remove();
  }

  render() {
    return <View />;
  }
}
