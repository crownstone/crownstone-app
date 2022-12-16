import {colors, statusBarHeight, topBarHeight} from "../styles";
import {Text, TouchableOpacity, View} from "react-native";
import {topBarStyle} from "./topbar/TopbarStyles";
import {Icon} from "./Icon";
import * as React from "react";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";

export function TopBarLeftAndroid(props) {
  let barHeight = topBarHeight - statusBarHeight;
  if (props.notBack) { return <View style={topBarStyle.topBarLeftTouch} />; }

  if (props.left) {
    // draw custom element
    let left = props.left;
    if (typeof props.left === 'function') {
      left = props.left();
    }    return (
      <TouchableOpacity onPress={() => { props.leftAction(); }}  style={topBarStyle.topBarLeftTouch} testID={"topBarLeftItem"}>
        <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
          <Text style={[topBarStyle.topBarLeft, topBarStyle.text, props.leftStyle]}>{left}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  else {
    // back
    let backCallback = () => { NavigationUtil.back(); };
    if (typeof props.leftAction === 'function') {
      backCallback = props.leftAction;
    }
    return (
      <TouchableOpacity onPress={() => { backCallback(); }} style={[topBarStyle.topBarLeftTouch, {paddingLeft:20}]} testID={"topBarLeftItem"}>
        <View style={{flexDirection:'row', alignItems:'center', flex:0, height: barHeight}}>
          <Icon name="md-arrow-round-back" size={23} color={props.leftStyle && props.leftStyle.color || colors.black.hex} style={{paddingRight:6, marginTop:2}} />
        </View>
      </TouchableOpacity>
    );
  }
}


export function TopBarCenterAndroid(props) {
  let barHeight = topBarHeight - statusBarHeight;
  return (
    <View style={[topBarStyle.topBarCenterView, {height: barHeight}]}>
      { props.titleObject || <Text style={[topBarStyle.topBarCenter, topBarStyle.titleText, props.titleStyle]}>{props.title}</Text> }
    </View>
  )
}


export function TopBarRightAndroid(props) {
  let barHeight = topBarHeight - statusBarHeight;
  if ( props.rightItem ) {
    return (
      <TouchableOpacity onPress={() => {props.rightAction();}} style={topBarStyle.topBarRightTouch} testID={"topBarRightItem"}>
        {props.rightItem}
      </TouchableOpacity>
    );
  }
  else if ( props.right ) {
    let right = props.right;
    if (typeof props.right === 'function') {
      right = props.right();
    }
    return (
      <TouchableOpacity onPress={() => {props.rightAction();}}  style={[topBarStyle.topBarRightTouch, {paddingRight:10}]} testID={"topBarRightItem"}>
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
          <Text style={[topBarStyle.topBarRight, topBarStyle.text, props.rightStyle]}>{right}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  return <View style={topBarStyle.topBarRightTouch} />;
}
