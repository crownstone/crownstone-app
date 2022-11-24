import { useState } from "react";
import * as React from 'react';
import { Get } from "../../util/GetUtil";
import { View, Image, Text, Alert, ScrollView } from "react-native";
import { colors, getRoomStockImage, screenWidth, statusBarHeight, topBarHeight, viewPaddingTop } from "../styles";
import { xUtil } from "../../util/StandAloneUtil";
import { SettingsCustomTopBarBackground } from "../components/SettingsBackground";
import { CustomTopBarWrapper } from "../components/CustomTopBarWrapper";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";

import { Languages } from "../../Languages"
import { BlurEntry } from "../components/BlurEntries";
import { Icon } from "../components/Icon";
import { DeviceEntryBasic } from "../components/deviceEntries/DeviceEntryBasic";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SelectCrownstone", key)(a,b,c,d,e);
}

export function SelectCrownstone(props: {sphereId: sphereId, title: string, isModal?: boolean, leftLabel?: string, rightLabel?: string, rightAction?: (selection: string[]) => void, callback: (stoneId: string) => void}) {
  let [selection, setSelection] = useState([]);
  return (
    <SettingsCustomTopBarBackground>
      <CustomTopBarWrapper
        title={props.title}
        leftAction={() => { props.isModal ? NavigationUtil.dismissModal() : NavigationUtil.back() }}
        leftLabel={ props.leftLabel ?? lang("Back")}
        rightAction={() => {
          if (props.rightAction) {
            props.rightAction(selection);
          }
        }}
        right={props.rightLabel}
      >
        <ScrollView contentContainerStyle={{paddingTop: viewPaddingTop}}>
          <LocationLists
            sphereId={props.sphereId}
            callback={(stoneId) => { props.callback(stoneId); }}
          />
        </ScrollView>
      </CustomTopBarWrapper>
    </SettingsCustomTopBarBackground>
  )
}


SelectCrownstone.options = {topBar: {visible: false, height:0}};


export function LocationLists(props: {sphereId: sphereId, callback: (stoneId: string) => void}) {
  let sphere = Get.sphere(props.sphereId);
  let locations = sphere.locations;
  let locationIds = Object.keys(locations);
  locationIds.sort((a,b) => { return locations[a].config.name > locations[b].config.name ? 1 : -1});
  let components = [];

  locationIds.forEach((locationId) => {
    components.push(
      <LocationList
        key={locationId}
        sphereId={props.sphereId}
        locationId={locationId}
        callback={props.callback}
      />
    )
  })

  return (
    <React.Fragment>
      { components }
    </React.Fragment>
  )
}


function LocationList(props: {sphereId: sphereId, locationId: locationId, callback: (stoneId: string) => void}) {
  let sphere = Get.sphere(props.sphereId);
  let stones = sphere.stones;

  let stoneIdsInLocation = Object.keys(stones)
    .filter((stoneId) => { return stones[stoneId].config.locationId === props.locationId;  })

  if (stoneIdsInLocation.length === 0) {
    return <View />
  }

  return (
    <React.Fragment>
      <LocationRow sphereId={props.sphereId} locationId={props.locationId} />
      <View style={{height:10}} />
      <StoneList   stoneIds={stoneIdsInLocation} sphereId={props.sphereId} callback={props.callback} />
      <View style={{height:50}} />
    </React.Fragment>
  );
}


function StoneList(props: {sphereId: sphereId, stoneIds: stoneId[], callback: (stoneId: string) => void}) {
  let stoneComponents = [];
  props.stoneIds.forEach((stoneId) => {
    stoneComponents.push(
      <DeviceEntryBasic
        key={stoneId}
        sphereId={props.sphereId}
        stoneId={stoneId}
        callback={() => { props.callback(stoneId); }}
      />
    );
  })

  return (
    <React.Fragment>
      { stoneComponents }
    </React.Fragment>
  );
}


export function LocationRow({sphereId, locationId}) {
  let height = 80;
  let textBackgroundColor = "transparent";
  let location = Get.location(sphereId, locationId);
  if (location.config.picture) {
    textBackgroundColor = colors.white.rgba(0.8);
  }
  return (
    <View style={{width: screenWidth, borderColor: colors.black.rgba(0.5), borderBottomWidth: 1, borderTopWidth: 1}}>
      <View style={{opacity: 0.8}}><LocationFlavourImage location={location} height={height}/></View>
      <View style={{position:'absolute', top:0, left:0, width: screenWidth, height: height, justifyContent:'center'}}>
        <View style={{backgroundColor: textBackgroundColor, width: 30 + (location.config.name.length || 0) * 14}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', fontStyle:'italic', padding:10}}>{location.config.name}</Text>
        </View>
      </View>
    </View>
  )
}

function LocationFlavourImage(props : {location: any, height?: number}) {
  let location = props.location;
  let usedHeight = props.height || 120;

  if (location.config.pictureSource === "CUSTOM") {
    if (location.config.picture) {
      return <Image source={{ uri: xUtil.preparePictureURI(location.config.picture) }} style={{width: screenWidth, height: usedHeight}} resizeMode={"cover"} />
    }
    return <View style={{width:screenWidth, height:usedHeight, backgroundColor: colors.csBlue.hex}} />;
  }
  else {
    return <Image source={getRoomStockImage(location.config.picture)} style={{width: screenWidth, height: usedHeight}} resizeMode={"cover"} />
  }
}

