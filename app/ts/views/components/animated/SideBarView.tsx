import * as React from 'react';
import { Component } from "react";
import { Animated, View } from "react-native";
import { screenWidth, styles } from "../../styles";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {InvisiblePressable} from "../InvisiblePressable";
import {core} from "../../../Core";
import { BackButtonHandler } from "../../../backgroundProcesses/BackButtonHandler";

const DURATION = 300;

export const SIDEBAR_STATE = {
  open: false
}

export class SideBarView extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = {
      leftOffset:   new Animated.Value(0),
      borderRadius: new Animated.Value(0),
      margins:      new Animated.Value(0),
      open:         false
    };
  }

  componentDidMount() {
    BackButtonHandler.override("SideBarView", () => {
      if (this.state.open) {
        this.close();
        return true;
      }
      return false;
    });
  }

  componentWillUnmount() {
    BackButtonHandler.clearOverride("SideBarView");
  }

  open() {
    let animations = [
      Animated.timing(this.state.leftOffset,   {toValue: 0.75*screenWidth, useNativeDriver: false, duration: DURATION}),
      Animated.timing(this.state.borderRadius, {toValue: 30, useNativeDriver: false, duration: DURATION}),
      Animated.timing(this.state.margins,      {toValue: 15, useNativeDriver: false, duration: DURATION}),
    ]
    this.setState({open: true});
    Animated.parallel(animations).start(() => {
      this.state.leftOffset.setValue(0.75*screenWidth);
      this.state.borderRadius.setValue(30);
      this.state.margins.setValue(15);
    });
    SIDEBAR_STATE.open = true;
    core.eventBus.emit("sidebarOpen");
  }

  close() {
    if (this.state.open) {
      let animations = [
        Animated.timing(this.state.leftOffset,    {toValue: 0, useNativeDriver: false, duration: DURATION}),
        Animated.timing(this.state.borderRadius, {toValue: 0, useNativeDriver: false, duration: DURATION}),
        Animated.timing(this.state.margins,      {toValue: 0, useNativeDriver: false, duration: DURATION}),
      ]
      this.setState({open: false});
      SIDEBAR_STATE.open = false;
      Animated.parallel(animations).start(() => {
        this.state.leftOffset.setValue(0);
        this.state.borderRadius.setValue(0);
        this.state.margins.setValue(0);
      });
      core.eventBus.emit("sidebarClose");
    }
  }


  render() {
    return (
      <SafeAreaProvider style={{flex:1}} >
        <View style={styles.fullscreen}>
          <View style={{flex:1}}>{this.props.sideMenu}</View>
        </View>
        <Animated.View style={[styles.fullscreen, {left: this.state.leftOffset, borderRadius: this.state.borderRadius, marginVertical: this.state.margins, overflow:"hidden"}]}>
          <InvisiblePressable onPressIn={() => { this.close(); }} disabled={!this.state.open} testID={'SphereOverviewCloseSidebar'}>
            <View pointerEvents={this.state.open ? 'none' : 'auto'} style={{flex:1}}>
              {this.props.content}
            </View>
          </InvisiblePressable>
        </Animated.View>
      </SafeAreaProvider>
    );
  }
}
