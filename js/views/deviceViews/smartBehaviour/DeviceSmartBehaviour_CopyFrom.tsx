
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { DeviceSmartBehaviour_TypeSelector } from "./DeviceSmartBehaviour_TypeSelector";
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Util } from "../../../util/Util";
import { LiveComponent } from "../../LiveComponent";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenHeight,
  screenWidth
} from "../../styles";
import { LocationFlavourImage } from "../../roomViews/RoomOverview";
import { Icon } from "../../components/Icon";
import { Circle } from "../../components/Circle";

let dayArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export class DeviceSmartBehaviour_CopyFrom extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:"Copy from whom?", closeModal:true});
  }


  unsubscribeStoreEvents;

  constructor(props) {
    super(props);

    let weekday = new Date().getDay();
    this.state = { editMode: false, activeDay: dayArray[weekday] }
  }

  componentDidMount(): void {}

  componentWillUnmount(): void {}


  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stones = sphere.stones;
    let locations = sphere.locations;
    let locationIds = Object.keys(locations);
    locationIds.sort((a,b) => { return locations[a].config.name > locations[b].config.name ? 1 : -1})

    let locationObjects = locationIds.map((locationId) => {
      return <LocationStoneList key={locationId} locationId={locationId} location={locations[locationId]} stones={stones} callback={(stoneId) => { this.props.callback(stoneId); }} />
    })


    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
            <Text style={[deviceStyles.header, {width: 0.85*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ "Who shall I copy behaviour(s) from?"}</Text>
            <View style={{height:30}} />
            {locationObjects}
          </View>
        </ScrollView>
      </Background>
    )
  }
}

function LocationStoneList({locationId, location, stones, callback}) {
  let stoneIds = Object.keys(stones);
  stoneIds.sort((a,b) => { return stones[a].config.name > stones[b].config.name ? 1 : -1})
  let stoneObjects = stoneIds
    .filter((stoneId) => { return stones[stoneId].config.locationId === locationId;  })
    .map((stoneId) => { return stones[stoneId] })

  if (Object.keys(stoneObjects).length === 0) {
    return <View></View>
  }
  return (
    <View>
      <LocationRow location={location} />
      <StoneList stones={stoneObjects} callback={callback} selection={{}}/>
      <View style={{height:50}} />
    </View>
  );
}


function StoneList({stones, selection, callback}) {
  let stoneObjects = Object.keys(stones)
    .map((stoneId) => { return <StoneRow key={stoneId} stone={stones[stoneId]} callback={() => { callback(stoneId); }} selected={selection[stoneId]}/>; })

  return (
    <View>
      { stoneObjects }
    </View>
  )
}

function StoneRow({stone, selected, callback}) {
  let height = 80;
  let padding = 10;
  return (
    <TouchableOpacity
      style={{width:screenWidth, height: height, padding:padding, paddingLeft:30, flexDirection:'row', alignItems:'center', backgroundColor: colors.white.rgba(0.8), borderColor: colors.black.rgba(0.3), borderBottomWidth: 1}}
      onPress={callback}
    >
      <Circle size={height-2*padding} color={colors.green.hex}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15}}>
        <Text style={{fontSize: 15}}>{stone.config.name}</Text>
      </View>
      { selected ? <Icon name={'ios-checkmark'} size={30} color={colors.black.rgba(0.1)} /> : undefined }
    </TouchableOpacity>
  )

}

function LocationRow({location}) {
  let height = 80;
  let textBackgroundColor = "transparent";
  if (location.config.picture) {
    textBackgroundColor = colors.white.rgba(0.6);
  }
  return (
    <View style={{width: screenWidth, borderColor: colors.black.rgba(0.5), borderBottomWidth: 1, borderTopWidth: 1}}>
      <View style={{opacity: 0.8}}><LocationFlavourImage location={location} height={height}/></View>
      <View style={{position:'absolute', top:0, left:0, width: screenWidth, height: height, justifyContent:'center'}}>
        <View style={{backgroundColor: textBackgroundColor, width: 30 + (location.config.name.length || 0) * 14}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', fontStyle:'italic', padding:15}}>{location.config.name}</Text>
        </View>
      </View>
    </View>
  )
}