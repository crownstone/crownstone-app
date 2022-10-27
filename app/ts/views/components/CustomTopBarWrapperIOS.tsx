import {colors, statusBarHeight, topBarHeight} from "../styles";
import {Text, TouchableOpacity, View} from "react-native";
import {topBarStyle} from "./topbar/TopbarStyles";
import {Icon} from "./Icon";
import * as React from "react";

export function TopBarLeftIOS(props) {
  let barHeight = topBarHeight - statusBarHeight;
  if (props.notBack !== true && props.leftAction !== undefined) {
    if (props.leftItem !== undefined) {
      return (
        <TouchableOpacity onPress={() => {props.leftAction();}} style={{...topBarStyle.topBarLeftTouch, paddingLeft:10}} testID={"topBarLeftItem"}>
          <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
            {props.leftItem}
          </View>
        </TouchableOpacity>
      );
    }
    else {
      let color = colors.iosBlue.hex;
      if (props.leftStyle && props.leftStyle.color) {
        color = props.leftStyle.color;
      }
      return (
        <TouchableOpacity
          onPress={() => {props.leftAction();}}
          style={[topBarStyle.topBarLeftTouch, {paddingLeft:10}, props.leftButtonStyle]} testID={"topBarLeftItem"}>
          <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
            <Icon name="ios-arrow-back" size={33} color={color} style={{paddingRight:6, marginTop:2}} />
            <Text style={[topBarStyle.topBarLeft,topBarStyle.leftText, {color: colors.iosBlue.hex}, props.leftStyle]}>{props.left}</Text>
          </View>
        </TouchableOpacity>
      );
    }
  }
  else if (props.left) {
    let left = props.left;
    if (typeof props.left === 'function') {
      left = props.left();
    }
    return (
      <TouchableOpacity onPress={() => {props.leftAction();}}  style={{...topBarStyle.topBarLeftTouch, paddingLeft:10}} testID={"topBarLeftItem"}>
        <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
          <Text style={[topBarStyle.topBarLeft, topBarStyle.text, props.leftStyle]}>{left}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  return <View style={topBarStyle.topBarLeftTouch} />;
}


export function TopBarCenterIOS(props) {
  let barHeight = topBarHeight - statusBarHeight;
  return (
    <View style={[topBarStyle.topBarCenterView, {height: barHeight}]}>
      { props.titleObject ?? <Text style={[topBarStyle.topBarCenter, topBarStyle.titleText, props.titleStyle]}>{props.title}</Text> }
    </View>
  )
}


export function TopBarRightIOS(props) {
  let barHeight = topBarHeight - statusBarHeight;

  if (props.rightItem) {
    return (
      <TouchableOpacity onPress={() => {props.rightAction();}} style={topBarStyle.topBarRightTouch} testID={"topBarRightItem"}>
        {props.rightItem}
      </TouchableOpacity>
    );
  }
  else if (props.right) {
    let right = props.right;
    if (typeof props.right === 'function') {
      right = props.right();
    }
    return (
      <TouchableOpacity onPress={() => {props.rightAction();}}  style={[topBarStyle.topBarRightTouch,{paddingRight:10}]} testID={"topBarRightItem"}>
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
          <Text style={[topBarStyle.topBarRight, topBarStyle.text, props.rightStyle]}>{right}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  return <View style={topBarStyle.topBarRightTouch} />;
}
