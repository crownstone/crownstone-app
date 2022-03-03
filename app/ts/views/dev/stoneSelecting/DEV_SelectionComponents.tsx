//
// import { Languages } from "../../../Languages"
//
// function lang(key,a?,b?,c?,d?,e?) {
//   return Languages.get("DEV_SelectionComponents", key)(a,b,c,d,e);
// }
import { TouchableOpacity, ViewStyle, Text, View } from "react-native";
import { colors, screenWidth, styles } from "../../styles";
import { Component } from "react";
import React from "react";
import { ScaledImage } from "../../components/ScaledImage";
import { core } from "../../../Core";


export const filterState = {
  plug: true,
  builtin: true,
  guidestone: true,
  builtinOne: true,
  crownstoneUSB: true,
  verified: true,
  unverified: true,
  setup: true,
  dfu: true,
}


export function updateFilterState(state) {
  let keys = Object.keys(filterState);
  for (let i = 0; i < keys.length; i++) {
    filterState[keys[i]] = state[keys[i]];
  }
}


export function FilterButton(props) {
  let unselectedFilter : ViewStyle = { backgroundColor: colors.white.hex, borderColor: colors.csBlue.hex, borderWidth:1, borderRadius: 18, height: 36, ...styles.centered }
  let selectedFilter : ViewStyle = { ...unselectedFilter,  backgroundColor: colors.blue.rgba(0.75),  }

  return (
    <TouchableOpacity onPress={() => { props.callback() }} style={ props.selected ? selectedFilter : unselectedFilter}>
      <Text style={{fontSize:13, paddingLeft:10, paddingRight:10, fontWeight:'bold', color: props.selected ? colors.white.hex : colors.black.rgba(0.5) }}>{props.label}</Text>
    </TouchableOpacity>
  )
}


export function BigFilterButton(props) {
  let unselectedFilter : ViewStyle = { backgroundColor: colors.white.hex, borderColor: colors.csBlue.hex, borderWidth:1, borderRadius: 20, height: 40, marginVertical:5, width: 0.45*screenWidth-20, ...styles.centered, ...props.style }
  let selectedFilter : ViewStyle = { ...unselectedFilter,  backgroundColor: colors.blue.rgba(0.75),  }

  return (
    <TouchableOpacity onPress={() => { props.callback() }} style={ props.selected ? selectedFilter : unselectedFilter}>
      <Text style={{fontSize:14, fontWeight:'bold', color: props.selected ? colors.white.hex : colors.black.rgba(0.5) }}>{props.label}</Text>
    </TouchableOpacity>
  )
}

export class CrownstoneEntry extends Component<any, any> {

  cachedCid=null;

  render() {
    let backgroundColor = colors.white.hex;
    let opacity = 0.65;
    let height = 55;
    let sphere = null

    switch (this.props.item.type) {
      case 'setup':
        backgroundColor = colors.blue.rgba(opacity);
        break;
      case 'verified':
        backgroundColor = colors.green.rgba(opacity);
        let state = core.store.getState();
        sphere = state.spheres[this.props.item.data.referenceId] || null;
        break;
      case 'unverified':
        backgroundColor = colors.white.hex;
        break;
      case 'dfu':
        backgroundColor = colors.purple.rgba(opacity);
        break;
    }

    let hasType = this.props.item.data && this.props.item.data.serviceData && this.props.item.data.serviceData.deviceType !== 'undefined' || false;
    let hasCid  = this.props.item.data && this.props.item.data.serviceData && this.props.item.data.serviceData.crownstoneId || false;

    let str = "";
    if (sphere !== null) {
      str = " (in " + sphere.config.name;
    } else {
      this.cachedCid = null;
    }
    if (hasCid !== false && this.props.item.data && this.props.item.data.serviceData.stateOfExternalCrownstone === false) {
      this.cachedCid = hasCid;
    }
    if (this.cachedCid !== null) {
      str += ":" + this.cachedCid;
    }

    if (sphere !== null) {
      str = str + ")";
    }


    return (
      <View style={{
        backgroundColor: backgroundColor,
        width: screenWidth,
        height: height,
        paddingLeft: 10,
        borderBottomColor: this.props.tracking ? colors.black.rgba(1) : colors.black.rgba(0.2),
        borderBottomWidth: this.props.tracking ? 2 : 1,
        justifyContent: 'center',
      }}>
        { this.props.tracking ? <ScaledImage source={require('../../../../assets/images/selectionArrow.png')} sourceWidth={150} sourceHeight={150} targetHeight={53}  style={{position:'absolute', top:0, left:0}}/> : null }
        <View style={{ flex: 1 }}/>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', width:screenWidth - 10}} onPress={() => {this.props.callback();}}>
          { this.props.tracking ? <View style={{width: 40}}/> : null }
          <View style={{ height: height }} >
            <View style={{ flex: 1 }}/>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: 60 }}>{this.props.item.data.name}</Text>
              {!hasType || <Text>{ " - " }</Text>}
              {!hasType || <Text>{this.props.item.data.serviceData.deviceType}</Text>}
              {sphere !== null ? <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{str}</Text> : undefined}
              <View style={{ flex: 1 }}/>
            </View>
            <View style={{ flex: 1 }}/>
            <Text style={{ color: colors.black.rgba(0.5), fontSize: 10 }}>{this.props.item.handle}</Text>
            <View style={{ flex: 1 }}/>
          </View>
          <View style={{ flex: 1 }}/>
          <TouchableOpacity style={{ height: height, width: 40, justifyContent: 'center', paddingRight:10}} onPress={() => {
            this.props.track()
          }}>
            <Text style={{ fontWeight: 'bold', textAlign: 'right' }}>{this.props.item.rssi}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
        <View style={{ flex: 1 }}/>
      </View>
    );
  }
}