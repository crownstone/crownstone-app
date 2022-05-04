import * as React from 'react';
import { Component } from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import { screenWidth, styles } from "../../styles";
import { SafeAreaProvider } from "react-native-safe-area-context";

const DURATION = 300;

export class SideBarView extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = { leftOffset: new Animated.Value(0), open:false };
  }

  open() {
    let animation = Animated.timing(this.state.leftOffset, {toValue: 0.7*screenWidth, useNativeDriver: false, duration: DURATION});
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
      <SafeAreaProvider style={{flex:1}}>
        <View style={styles.fullscreen}>
          <View style={{flex:1}}>{this.props.sideMenu}</View>
        </View>
        <Animated.View style={[styles.fullscreen, {left: this.state.leftOffset, overflow:"hidden", backgroundColor:"#f00"}]}>
          <TouchableOpacity activeOpacity={1} style={{flex:1, backgroundColor:"#0f0"}} onPress={(e) => { this.close(); }}>
            <View pointerEvents={this.state.open ? 'none' : undefined} style={{flex:1}}>
              {this.props.content}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaProvider>
    );
  }
}
