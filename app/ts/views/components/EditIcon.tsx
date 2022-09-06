
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("EditIcon", key)(a,b,c,d,e);
}
import { Icon } from "./Icon";
import { colors, styles } from "../styles";
import { Text, TouchableOpacity, View, ViewStyle } from "react-native";
import * as React from "react";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { HighlightableBlackIcon, HighlightableIcon } from "./animated/HighlightableIcon";


let color = colors.black.hex;

function getRightStyle(style : ViewStyle = {}) : ViewStyle {
  return {paddingHorizontal: 15, height: 35, justifyContent: 'center', alignItems:'flex-end',...style}
}
function getLeftStyle(style : ViewStyle = {}) : ViewStyle {
  return {paddingHorizontal: 15, height: 35, justifyContent: 'center', alignItems:'flex-start', ...style}
}

export function MenuButtonPlaceholder(props) {
  return (
    <View style={getLeftStyle()} testID={props.testID}>
      {/*<HighlightableBlackIcon name={'enty-menu'} size={25} enabled={props.highlight} badge={props.badge} badgeColor={props.badgeColor}/>*/}
    </View>
  );
}
export function MenuButton(props: {onPress: () => void, highlight?: boolean, badge?: BadgeIndicator, badgeColor?: string, testID?: string}) {
  return (
    <TouchableOpacity onPress={props.onPress} style={getLeftStyle()} testID={props.testID}>
      <HighlightableBlackIcon name={'enty-menu'} size={25} enabled={props.highlight} badge={props.badge} badgeColor={props.badgeColor}/>
    </TouchableOpacity>
  );
}

export function EditIcon(props) {
  return (
    <TouchableOpacity style={getRightStyle(props.style)} onPress={props.onPress} testID={props.testID ?? 'editIcon'}>
      <Icon name={'md-create'} size={25} color={color}/>
    </TouchableOpacity>
  );
}


export function SettingsIconLeft(props) {
  return (
    <TouchableOpacity style={getLeftStyle(props.style)} onPress={props.onPress} testID={props.testID ?? 'SettingsIconLeft'}>
      <HighlightableIcon name={'md-create'} size={25} color={color} enabled={props.highlight ?? false}/>
    </TouchableOpacity>
  );
}


export function SettingsIconRight(props) {
  return (
    <TouchableOpacity style={getRightStyle(props.style)} onPress={props.onPress}>
      <Icon name={'md-create'} size={25} color={color}/>
    </TouchableOpacity>
  );
}
export function DevIconRight(props) {
  return (
    <TouchableOpacity style={getRightStyle(props.style)} onPress={props.onPress}>
      <Icon name={'ios-bug'} size={22} color={props.color ?? color}/>
    </TouchableOpacity>
  );
}

export function EditDone(props) {
  return (
    <TouchableOpacity style={getRightStyle(props.style)} onPress={props.onPress} testID={props.testID ?? 'editDone'}>
      <Text style={{...styles.viewButton, color: color, textAlign:'right'}}>{ lang("Done") }</Text>
    </TouchableOpacity>
  );
}

export function BackIcon(props) {
  return (
    <TouchableOpacity style={getLeftStyle(props.style)} onPress={() => {
      if (props.modal) {
        NavigationUtil.dismissModal();
      }
      else {
        NavigationUtil.back();
      }
    }} testID={props.testID ?? 'back'}>
      <Icon name={'fa5-arrow-left'} size={20} color={color}/>
    </TouchableOpacity>
  );
}
