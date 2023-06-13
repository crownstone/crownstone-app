import * as React from 'react';

import EvilIcons from 'react-native-vector-icons/dist/EvilIcons';
import ZocialIcons from 'react-native-vector-icons/dist/Zocial';
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import Entypo from 'react-native-vector-icons/dist/Entypo';
import FontAwesome5 from 'react-native-vector-icons/dist/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import Ionicons  from 'react-native-vector-icons/dist/Ionicons';
import {CustomIcon, CustomIcon2, CustomIcon3, RoomNumberIconSet} from '../../fonts/customIcons'

import { iconCorrections } from '../../fonts/iconCorrections'
import { Ionicons3 } from "../../fonts/ionicons3";
import { FlatIconCustom1, FlatIconEssentials, FlatIconHousehold } from "../../fonts/customIcons_flaticon";

export function Icon(props) {
  let offsetStyle = {};
  let style = props.style;
  let correctedName = props.name;

  // guard against missing icon names
  if (!props.name || typeof props.name !== 'string') {
    return <Ionicons3 {...props} {...getProps("ios-leaf", offsetStyle, style)} />;
  }

  let prefix3 = props.name.substr(0,3);
  let prefix4 = props.name.substr(0,4);
  let prefix5 = props.name.substr(0,5);

  if (prefix3 == 'rn-') {
    offsetStyle = offset(props,'c1');
    return <RoomNumberIconSet  {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix3 == 'c1-') {
    offsetStyle = offset(props,'c1');
    return <CustomIcon  {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix3 == 'c2-') {
    offsetStyle = offset(props,'c2');
    return <CustomIcon2 {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix3 == 'c3-') {
    offsetStyle = offset(props,'c3');
    return <CustomIcon3  {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix3 == 'ei-') {
    offsetStyle = offset(props,'evilIcons');
    correctedName = props.name.substr(3);
    return <EvilIcons  {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix5 == 'fiCS1') {
    offsetStyle = offset(props,'fiCS1');
    return <FlatIconCustom1  {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix4 == 'fiHS') {
    offsetStyle = offset(props,'fiHS');
    return <FlatIconHousehold {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix3 == 'fiE') {
    offsetStyle = offset(props,'fiE');
    return <FlatIconEssentials {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix5 == 'ion5-') {
    offsetStyle = offset(props,'ionicons5');
    correctedName = props.name.substr(5);
    return <Ionicons {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix5 == 'enty-') {
    offsetStyle = offset(props,'entypo');
    correctedName = props.name.substr(5);
    return <Entypo {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix4 == 'fa5-') {
    offsetStyle = offset(props,'fontAwesome5');
    correctedName = props.name.substr(4);
    return <FontAwesome5 {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix3 == 'fa-') {
    offsetStyle = offset(props,'fontAwesome');
    correctedName = props.name.substr(3);
    return <FontAwesome {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix3 == 'ma-') {
    offsetStyle = offset(props,'materialIcons');
    correctedName = props.name.substr(3);
    return <MaterialIcons {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else if (prefix3 == 'zo-') {
    offsetStyle = offset(props,'zocial');
    correctedName = props.name.substr(3);
    return <ZocialIcons {...props} {...getProps(correctedName, offsetStyle, style)} />
  }
  else {
    offsetStyle = offset(props,'ionicons');
    return <Ionicons3 {...props}  {...getProps(correctedName, offsetStyle, style)} />
  }
}


function offset(props, set) {
  let offsetStyle = {};
  let correction = iconCorrections[set]?.[props.name] ?? null;
  if (correction && correction.change === true && props.ignoreCorrection !== true) {
    offsetStyle = {position:'relative', top: props.size*correction.top, left: props.size*correction.left}
  }
  return offsetStyle;
}

function getProps(name, offsetStyle, propsStyle) {
  return {name, style: [{backgroundColor:'transparent'}, offsetStyle, propsStyle]}
}
