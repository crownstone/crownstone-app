import {Get} from "../../../util/GetUtil";
import {View} from "react-native";
import {colors, NORMAL_ROW_SIZE, screenWidth} from "../../styles";
import {useEffect, useState} from "react";
import * as React from "react";
import {NavigationBar} from "../../components/editComponents/NavigationBar";
import {IconButton} from "../../components/IconButton";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {Icon} from "../../components/Icon";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {EnergyUsageUtil} from "../EnergyUsageUtil";
import {InfoBar} from "../../components/editComponents/InfoBar";
import {
  useForceUpdate,
  useSpherePresence,
  useSphereSwitching,
  useViewSwitching
} from "../../components/hooks/databaseHooks";

export function LiveRoomList(props: {}) {
  useSphereSwitching();
  useSpherePresence();
  useViewSwitching("EnergyUsage");

  const forceUpdate = useForceUpdate();
  let activeSphere = Get.activeSphere();

  let isOnThisView = NavigationUtil.isOnView("EnergyUsage");
  useEffect(() => {
    if (activeSphere && activeSphere.state.present && NavigationUtil.isOnView("EnergyUsage")) {
      let interval = setInterval(() => {
        forceUpdate();
      }, 2000);

      return () => {
        clearInterval(interval);
      }
    }
  }, [activeSphere.id, isOnThisView]);


  let items = [];
  let locations = [];
  for (let locationId in activeSphere.locations) {
    let location = activeSphere.locations[locationId];
    locations.push({name: location?.config?.name ?? "Unknown room", location, sphereId: activeSphere.id, id: locationId});
  }
  locations.sort((a,b) => { return a.name > b.name ? 1 : -1});

  let colorMap = EnergyUsageUtil.getLocationColorList(activeSphere.id);

  for (let locationData of locations) {
    items.push(
      <LiveRoomElement key={locationData.location.id} locationData={locationData} color={colorMap[locationData.id]} />
    )
  }

  return <View style={{width: screenWidth, paddingTop:15}}>{items}</View>;
}


function LiveRoomElement(props: {locationData: {name: string, location: any, sphereId: sphereId, id: string}, color: string}) {
  let [open, setOpen] = useState(false);
  let locationData = props.locationData;
  return (
    <React.Fragment>
      <NavigationBar
        backgroundColor={"transparent"}
        label={locationData.name}
        labelStyle={{width:null, flex:1}}
        value={EnergyUsageUtil.getLiveLocationEnergyUsage(locationData.sphereId, locationData.id)}
        valueStyle={{textAlign:'right', paddingRight:15, fontSize:14, color: colors.black.rgba(0.4)}}
        valueRight
        customValueItem
        callback={() => {setOpen(!open)}}
        icon={<IconButton name={locationData.location.config.icon} size={20} color={colors.white.hex} buttonStyle={{backgroundColor: props.color}} />}
        arrowDown={open}
      />
      <CrownstoneList open={open} locationId={locationData.location.id} />
    </React.Fragment>
  )
}


function CrownstoneList(props: { open: boolean, locationId: locationId }) {
  let activeSphere = Get.activeSphere();
  let items = [];
  let stones = [];
  for (let stoneId in activeSphere.stones) {
    let stone = activeSphere.stones[stoneId];
    if (stone.config.locationId !== props.locationId) { continue; }
    stones.push({name: stone.config.name, id: stoneId});
  }
  stones.sort((a,b) => { return a.name > b.name ? 1 : -1});
  let height = 0;

  if (props.open) {
    for (let stoneData of stones) {
      let stone = activeSphere.stones[stoneData.id];
      height += NORMAL_ROW_SIZE;
      items.push(
        <NavigationBar
          key={stoneData.id}
          backgroundColor={"transparent"}
          label={stoneData.name}
          labelStyle={{width:null, flex:3}}
          value={EnergyUsageUtil.getLiveStoneEnergyUsage(activeSphere.id, stoneData.id)}
          valueRight
          customValueItem
          callback={() => { NavigationUtil.launchModal("DevicePowerUsage", {sphereId: activeSphere.id, stoneId: stoneData.id})}}
          icon={<Icon name={stone.config.icon} size={20} color={colors.black.hex} />}
        />
      );
    }
  }

  if (items.length === 0) {
    items.push(
      <InfoBar barHeight={0.6*NORMAL_ROW_SIZE} label={"No Crownstones in room"} labelStyle={{fontSize:15, color: colors.black.rgba(0.3), paddingLeft:30, fontStyle:'italic'}} backgroundColor={"transparent"} />
    );
  }

  return (
    <SlideFadeInView visible={props.open} style={{width: screenWidth, paddingLeft:20}} height={Math.max(0.6*NORMAL_ROW_SIZE,height)}>
      {items}
    </SlideFadeInView>
  );

}



