
import * as React from 'react'; import { Component } from 'react';
import {
  PanResponder,
  View, ViewStyle
} from 'react-native';


export class InvisiblePressable extends Component<{onPressIn: () => void, style?: ViewStyle, disabled?: boolean}, any> {

  _panResponder: any = {};

  constructor(props) {
    super(props);

    this.init();
  }

  init() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        if (this.props.onPressIn && this.props.disabled !== true) {
          this.props.onPressIn();
        }
        return false;
        },
    });
  }

  render() {
    return (
      <View {...this._panResponder.panHandlers} style={{flex:1, ...this.props.style}}>
        { this.props.children }
      </View>
    );
  }
}

