import { Component } from "react";
import { View } from "react-native";
import * as React from "react";


/**
 * Wrapper for a view where you can use the mount and unmount methods as props.
 */
export class LifeCycleView extends Component<{unmount?: () => void, mount?: () => void, layout?:(event) => void, style?: any, testID?:string}, any> {
  componentWillUnmount() {
    if (this.props.unmount) {
      this.props.unmount();
    }
  }

  componentDidMount() {
    if (this.props.mount) {
      this.props.mount();
    }
  }

  render() {
    return (
      <View onLayout={(event) => { if (this.props.layout) { this.props.layout(event); }}} style={this.props.style} testID={this.props.testID}>
        {this.props.children}
      </View>
    );
  }
}
