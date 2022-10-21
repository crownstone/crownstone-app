import {Get} from "../../../util/GetUtil";
import {EnergyUsageUtil} from "../EnergyUsageUtil";
import {NavigationBar} from "../../components/editComponents/NavigationBar";
import {colors, screenWidth} from "../../styles";
import {IconButton} from "../../components/IconButton";
import {Alert, View} from "react-native";
import * as React from "react";
import { DataUtil } from "../../../util/DataUtil";


export function RoomList(props: { sphereId: sphereId, data: EnergyData | null, setLocationId: (locationId: locationId) => void }) {
  let sphere = Get.sphere(props.sphereId);
  let items = [];
  if (sphere && props.data) {
    let locations = [];
    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      locations.push({name: location?.config?.name ?? "Unknown room", id: locationId});
    }
    locations.sort((a,b) => { return a.name > b.name ? 1 : -1});

    for (let locationData of locations) {
      items.push(
        <NavigationBar
          key={locationData.id}
          backgroundColor={"transparent"}
          label={locationData.name}
          labelStyle={{width:null, flex:1}}
          value={EnergyUsageUtil.getEnergyUsage(props.data, locationData.id)}
          valueStyle={{textAlign:'right', paddingRight:15, fontSize:14, color: colors.black.rgba(0.4)}}
          valueRight
          customValueItem
          callback={() => { props.setLocationId(locationData.id); }}
          icon={<IconButton name={sphere.locations[locationData.id].config.icon} size={20} color={colors.white.hex} buttonStyle={{backgroundColor: props.data.colorMap[locationData.id]}} />}
        />
      )
    }
  }

  return <View style={{width: screenWidth, paddingTop:15}}>{items}</View>;
}





export function CrownstoneList(props: { sphereId: sphereId, locationId: locationId, data: EnergyData | null }) {
  let sphere = Get.sphere(props.sphereId);
  let stonesInLocation = DataUtil.getStonesInLocation(props.sphereId, props.locationId);
  let items = [];
  if (sphere && props.data) {
    let stones = [];
    for (let stoneId in sphere.stones) {
      if (stonesInLocation[stoneId]) {
        let stone = sphere.stones[stoneId];
        stones.push({ name: stone?.config?.name ?? "Unknown Crownstone", id: stoneId });
      }
    }
    stones.sort((a,b) => { return a.name > b.name ? 1 : -1});
    for (let stoneData of stones) {
      items.push(
        <NavigationBar
          key={stoneData.id}
          backgroundColor={"transparent"}
          label={stoneData.name}
          labelStyle={{width:null, flex:1}}
          value={EnergyUsageUtil.getEnergyUsage(props.data, stoneData.id)}
          valueStyle={{textAlign:'right', paddingRight:15, fontSize:14, color: colors.black.rgba(0.4)}}
          valueRight
          customValueItem
          callback={() => {}}
          icon={<IconButton name={sphere.stones[stoneData.id].config.icon} size={20} color={colors.white.hex} buttonStyle={{backgroundColor: props.data.colorMap[stoneData.id]}} />}
        />
      )
    }
  }

  return <View style={{width: screenWidth, paddingTop:15}}>{items}</View>;
}



