import * as React from 'react';
import { Component } from "react";
import { Animated, Pressable, TouchableOpacity, View } from "react-native";
import { screenWidth, styles } from "../../styles";
import { BackgroundImage } from "../BackgroundImage";
import { SafeAreaProvider } from "react-native-safe-area-context";

export class SideBarView extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = { leftOffset: new Animated.Value(0), open:false };
  }

  open() {
    let animation = Animated.timing(this.state.leftOffset, {toValue: 0.7*screenWidth, useNativeDriver: false, duration:250});
    this.setState({open: true});
    animation.start();
  }

  close() {
    let animation = Animated.timing(this.state.leftOffset, {toValue: 0, useNativeDriver: false, duration:250});
    this.setState({open: false});
    animation.start();
  }

  getChild() {
    if (this.state.open) {
      return (
        <TouchableOpacity activeOpacity={1} style={{flex:1}} onPress={(e) => { this.close(); }}>
          <View pointerEvents={'none'}>
            {this.props.content}
          </View>
        </TouchableOpacity>
      );
    }
    else {
      return <View style={{flex:1}}>{this.props.content}</View>
    }
  }

  render() {
    return (
      <SafeAreaProvider style={{flex:1, backgroundColor:"#f00"}}>
        <View style={styles.fullscreen}>
          <View style={{flex:1}}>{this.props.sideMenu}</View>
        </View>
        <Animated.View style={[styles.fullscreen, {left: this.state.leftOffset, overflow:"hidden"}]}>
          {this.getChild()}
        </Animated.View>
      </SafeAreaProvider>
    );
  }
}
