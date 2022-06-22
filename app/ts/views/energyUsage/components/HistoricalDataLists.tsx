import {Get} from "../../../util/GetUtil";
import {EnergyUsageUtil} from "../EnergyUsageUtil";
import {NavigationBar} from "../../components/editComponents/NavigationBar";
import {colors, screenWidth} from "../../styles";
import {IconButton} from "../../components/IconButton";
import {Alert, View} from "react-native";
import * as React from "react";
import {showDemoAlert} from "../EnergyUsage";


export function RoomList(props: { data: EnergyData, mode: GRAPH_TYPE }) {
  let activeSphere = Get.activeSphere();
  let items = [];
  let locations = [];
  for (let locationId in activeSphere.locations) {
    let location = activeSphere.locations[locationId];
    locations.push({name: location?.config?.name ?? "Unknown room", id: locationId});
  }
  locations.sort((a,b) => { return a.name > b.name ? 1 : -1});

  let colorMap = EnergyUsageUtil.getLocationColorList(activeSphere.id);


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
        callback={showDemoAlert}
        icon={<IconButton name={activeSphere.locations[locationData.id].config.icon} size={20} color={colors.white.hex} buttonStyle={{backgroundColor: colorMap[locationData.id]}} />}
      />
    )
  }

  return <View style={{width: screenWidth, paddingTop:15}}>{items}</View>;
}



