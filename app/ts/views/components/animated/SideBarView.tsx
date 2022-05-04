import * as React from 'react';
import { Component } from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import { screenWidth, styles } from "../../styles";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {InvisiblePressable} from "../InvisiblePressable";

const DURATION = 300;

export class SideBarView extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = { leftOffset: new Animated.Value(0), open:false };
  }

  open() {
    let animation = Animated.timing(this.state.leftOffset, {toValue: 0.75*screenWidth, useNativeDriver: false, duration: DURATION});
    this.setState({open: true});
    animation.start();
  }

  close() {
    if (this.state.open) {
      let animation = Animated.timing(this.state.leftOffset, {toValue: 0, useNativeDriver: false, duration: DURATION});
      this.setState({open: false});
      animation.start();
    }
  }


  render() {
    return (
      <SafeAreaProvider style={{flex:1}} >
        <View style={styles.fullscreen}>
          <View style={{flex:1}}>{this.props.sideMenu}</View>
        </View>
        <Animated.View style={[styles.fullscreen, {left: this.state.leftOffset, overflow:"hidden"}]}>
          <InvisiblePressable onPressIn={() => { this.close(); }} disabled={!this.state.open}>
            <View pointerEvents={this.state.open ? 'none' : 'auto'} style={{flex:1}}>
              {this.props.content}
            </View>
          </InvisiblePressable>
        </Animated.View>
      </SafeAreaProvider>
    );
  }
}
