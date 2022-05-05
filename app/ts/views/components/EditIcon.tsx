import { Icon } from "./Icon";
import { colors, styles } from "../styles";
import { Text, TouchableOpacity } from "react-native";
import * as React from "react";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";


let color = colors.black.hex;

export function MenuButton(props) {
  return (
    <TouchableOpacity onPress={props.onPress} style={{paddingHorizontal:15}}>
      <Icon name={'enty-menu'} size={25} color={color} />
    </TouchableOpacity>
  );
}

export function EditIcon(props) {
  return (
    <TouchableOpacity style={{paddingHorizontal: 15, justifyContent: 'flex-end'}} onPress={props.onPress}>
      <Icon name={'md-create'} size={25} color={color}/>
    </TouchableOpacity>
  );
}


export function SettingsIcon(props) {
  return (
    <TouchableOpacity style={{paddingHorizontal: 15, justifyContent: 'flex-end'}} onPress={props.onPress}>
      <Icon name={'ios-cog'} size={25} color={color}/>
    </TouchableOpacity>
  );
}

export function EditDone(props) {
  return (
    <TouchableOpacity style={{paddingHorizontal: 15, justifyContent: 'flex-end'}} onPress={props.onPress}>
      <Text style={{...styles.viewButton, color: color}}>Done</Text>
    </TouchableOpacity>
  );
}

export function BackIcon(props) {
  return (
    <TouchableOpacity style={{paddingHorizontal: 15, justifyContent: 'flex-end'}} onPress={() => {
      if (props.modal) {
        NavigationUtil.dismissModal();
      }
      else {
        NavigationUtil.back();
      }
    }}>
      <Icon name={'fa5-arrow-left'} size={23} color={color}/>
    </TouchableOpacity>
  );
}
