
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuDeviceOverviewEntry", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text, TouchableOpacity,
  View
} from "react-native";

import { Icon } from '../Icon';
import { styles, colors, screenWidth } from "../../styles";
import { core } from "../../../Core";
import { DataUtil } from "../../../util/DataUtil";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";

import {BlurEntry} from "../BlurEntries";


export function DfuDeviceOverviewEntry(props: { sphereId: sphereId, stoneId: stoneId, visible: boolean, closeEnough: boolean, iconColor: string, backgroundColor: string}) {
  let state = core.store.getState();
  let sphere = state.spheres[props.sphereId];
  let stone = sphere.stones[props.stoneId];
  let location = DataUtil.getLocationFromStone(sphere, stone);
  let locationName = null;
  if (location) { locationName = location.config.name; }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={() => {
        if (state.user.developer) {
          Alert.alert(
            lang("_Update_just_this_Crownst_header"),
            lang("_Update_just_this_Crownst_body"),
            [{text:lang("_Update_just_this_Crownst_left")},{
              text:lang("_Update_just_this_Crownst_right"), onPress:() => {
                NavigationUtil.navigate( "DfuBatch", {sphereId: props.sphereId, stoneIdsToUpdate: [props.stoneId]})
              }}])
        }
      }}
      style={{width:screenWidth}}
    >
    <BlurEntry
      title={stone.config.name}
      iconItem={<Icon name={stone.config.icon} size={30} color={props.iconColor} />}
      backgroundColor={props.backgroundColor}
      labelItem={
        <View style={{flexDirection: 'column', paddingLeft:15}}>
          { props.visible && !props.closeEnough ?
            <Text style={{fontSize: 14, fontStyle:'italic'}}>{ lang("In_range_but_not_close_eno") }</Text> :
            undefined }
          { !props.visible && !props.closeEnough ?
            <Text style={{fontSize: 14, fontStyle:'italic'}}>{ lang("Searching___") }</Text> :
            undefined }
          { props.closeEnough ?
            <Text style={{fontSize: 14, fontWeight: 'bold'}}>{ lang("Close_enough_for_update_") }</Text> :
            undefined }
          { locationName ?
            <Text style={{fontSize: 12, fontStyle:'italic'}}>{ lang("Located_in__",locationName) }</Text> :
            undefined }
        </View>
      }
      control={!props.visible && !props.closeEnough && <ActivityIndicator size={'small'} style={{paddingRight:10}}/>}
    />
    </TouchableOpacity>
  );
}

// export class DfuDeviceOverviewEntry2 extends Component<any, any> {
//   baseHeight : number;
//
//   constructor(props) {
//     super(props);
//
//     this.baseHeight = props.height || 80;
//   }
//
//
//   _getIcon(stone) {
//     let color = this.props.iconColor || colors.green.rgba(0.8);
//     return (
//       <Circle size={60} color={color}>
//         <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
//       </Circle>
//     );
//   }
//
//
//   render() {
//     let state = core.store.getState();
//     let sphere = state.spheres[this.props.sphereId];
//     let stone = sphere.stones[this.props.stoneId];
//     let location = DataUtil.getLocationFromStone(sphere, stone);
//     let locationName = null;
//     if (location) { locationName = location.config.name; }
//     return (
//       <TouchableOpacity
//         activeOpacity={1}
//         onLongPress={() => {
//           if (state.user.developer) {
//             Alert.alert(
//               lang("_Update_just_this_Crownst_header"),
//               lang("_Update_just_this_Crownst_body"),
//               [{text:lang("_Update_just_this_Crownst_left")},{
//               text:lang("_Update_just_this_Crownst_right"), onPress:() => {
//               NavigationUtil.navigate( "DfuBatch", {sphereId: this.props.sphereId, stoneIdsToUpdate: [this.props.stoneId]})
//             }}])
//           }
//         }}
//         style={[styles.listView,{flexDirection: 'column', height: this.baseHeight, width: screenWidth, overflow:'hidden', backgroundColor:"transparent"}]}>
//         <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
//           <View style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}}>
//             {this._getIcon(stone) }
//           </View>
//           <View style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}}>
//             <View style={{flexDirection: 'column'}}>
//               <Text style={{fontSize: 17, fontWeight: this.props.closeEnough ? 'bold' : 'normal'}}>{stone.config.name}</Text>
//               { this.props.visible && !this.props.closeEnough ?
//                 <Text style={{fontSize: 14}}>{ lang("In_range_but_not_close_eno") }</Text> :
//                 undefined }
//               { !this.props.visible && !this.props.closeEnough ?
//                 <Text style={{fontSize: 14}}>{ lang("Searching___") }</Text> :
//                 undefined }
//               { this.props.closeEnough ?
//                 <Text style={{fontSize: 15, fontWeight: 'bold'}}>{ lang("Close_enough_for_update_") }</Text> :
//                 undefined }
//               { locationName ?
//                 <Text style={{fontSize: 12}}>{ lang("Located_in__",locationName) }</Text> :
//                 undefined }
//             </View>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   }
// }
