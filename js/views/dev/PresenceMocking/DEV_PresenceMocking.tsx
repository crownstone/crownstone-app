import React from "react";
import { Background } from "../../components/Background";
import { core } from "../../../core";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import { View, Text, ScrollView } from "react-native";
import { BroadcastStateManager } from "../../../backgroundProcesses/BroadcastStateManager";
import { RoomEntry, SphereEntry } from "../user/DEV_UserDataSpheres";
import { availableScreenHeight, screenWidth } from "../../styles";

export class DEV_PresenceMocking extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:"Presence Mocking"})
  }

  constructor(props) {
    super(props);

    this.state = {sphereId: null, locationId: null};
  }


  getSpheres() {
    let state = core.store.getState();
    let spheres = state.spheres;
    let sphereIds = Object.keys(spheres);

    let sortedSphereIds = [];

    sphereIds.forEach((sphereId) => {
      sortedSphereIds.push({name: spheres[sphereId].config.name, id: sphereId, uid: spheres[sphereId].config.uid})
    })

    sortedSphereIds.sort((a,b) => { return a.name < b.name ? -1 : 1 })

    let result = []
    sortedSphereIds.forEach((sphereData) => {
      let sphereId = sphereData.id;
      result.push(
        <SphereEntry
          key={sphereId}
          sphere={spheres[sphereId]}
          sphereId={sphereId}
          callback={() => {
            this.setState({sphereId: sphereId})
            BroadcastStateManager._updateLocationState(sphereId, null);
            BroadcastStateManager._reloadDevicePreferences();
          }}
        />
      );
    })

    return result;
  }

  getRooms() {
    let state = core.store.getState();
    let sphere = state.spheres[this.state.sphereId];
    let locations = sphere.locations;
    let locationIds = [];
    Object.keys(locations).forEach((locationId) => {
      locationIds.push({name: locations[locationId].config.name, id: locationId})
    })

    locationIds.sort((a,b) => { return a.name < b.name ? -1 : 1 })

    let result = []
    locationIds.forEach((locationData) => {
      let locationId = locationData.id;
      result.push(
        <RoomEntry
          key={locationId}
          location={locations[locationId]}
          locationId={locationId}
          callback={() => {
            this.setState({locationId: locationId})
            BroadcastStateManager._updateLocationState(this.state.sphereId, locationId);
            BroadcastStateManager._reloadDevicePreferences();
          }}
        />
      );
    })

    return result;
  }

  render() {
    return (
      <Background image={core.background.light}>
        <ScrollView keyboardShouldPersistTaps="never" style={{width: screenWidth, height:availableScreenHeight}}>
          <View style={{flexDirection:'column', alignItems:'center', justifyContent: 'center', minHeight: availableScreenHeight, width: screenWidth}}>
            <View style={{height:30, width:screenWidth}} />
            <Text style={{fontSize:30, fontWeight:"bold"}}>{this.state.sphereId ? "Mock which room?" : "Select Sphere to mock."}</Text>
            <View style={{height:20, width:screenWidth}} />
            { this.state.sphereId === null ? this.getSpheres() : this.getRooms() }
          </View>
        </ScrollView>
      </Background>
    );
  }
}


