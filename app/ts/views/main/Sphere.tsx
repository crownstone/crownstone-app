
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Sphere", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text, TextStyle, TouchableOpacity,
  View,
  ViewStyle
} from "react-native";

import { RoomLayer }           from './RoomLayer'
import { StatusCommunication } from './StatusCommunication'
import { LOG }       from '../../logging/Log'
import { screenWidth, availableScreenHeight, colors, overviewStyles, styles } from "../styles";
import {DfuStateHandler} from "../../native/firmware/DfuStateHandler";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {Icon} from "../components/Icon";
import { core } from "../../Core";
import { DataUtil } from "../../util/DataUtil";
import { Get } from "../../util/GetUtil";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";


export class Sphere extends Component<any, any> {
  render() {
    LOG.info("RENDERING SPHERE");
    const state = core.store.getState();

    let viewingRemotely = true;
    let sphereId = this.props.sphereId;

    let sphereIsPresent = state.spheres[sphereId].state.present;
    if (sphereIsPresent ||  DfuStateHandler.areDfuStonesAvailable()) {
      viewingRemotely = false;
    }

    let noRoomsCurrentSphere = (sphereId ? Object.keys(state.spheres[sphereId].locations).length : 0) == 0;
    let noStones = (sphereId ? Object.keys(state.spheres[sphereId].stones).length : 0) == 0;
    let floatingStones = Object.keys(DataUtil.getStonesInLocation(state, this.props.sphereId, null)).length;
    let availableStones = (sphereId ? Object.keys(state.spheres[sphereId].stones).length - floatingStones : 0);

    // on screen buttons are 0.11*screenWidth high.
    let viewStyle : ViewStyle = {
      position:'absolute',
      top: 0.11*screenWidth, left:0,
      alignItems: 'center', justifyContent: 'center',
      height: availableScreenHeight - 2*0.11*screenWidth, width: screenWidth, padding:15
    };


    // This is an empty sphere. Tell the user what to expect.
    if (noStones === true && noRoomsCurrentSphere == true) {
      if (Permissions.inSphere(this.props.sphereId).seeSetupCrownstone !== true) {
        // this user cannot see setup Crownstones. Tell him the admin will have to add them.
        return (
          <View style={viewStyle}>
            <Icon name="c2-pluginFront" size={150} color={colors.menuBackground.hex}/>
            <Text style={overviewStyles.mainText}>{ lang("No_Crownstones_added_yet_") }</Text>
            <Text style={overviewStyles.subText}>{ lang("Ask_the_admin_of_this_Sph") }</Text>
          </View>
        )
      }
    }

    if (availableStones === 0 && floatingStones > 0 && noRoomsCurrentSphere) {
      // This dude cant add rooms and floating Crownstones need to be put in rooms. Tell him how to continue.
      return (
        <View style={viewStyle}>
          <Icon name="c2-pluginFront" size={150} color={colors.menuBackground.hex}/>
          <Text style={overviewStyles.mainText}>{ lang("Crownstones_require_rooms") }</Text>
          <Text style={overviewStyles.subText}>{ lang("Ask_the_admin_of_this_SphHandle") }</Text>
        </View>
      )
    }


    let shouldShowStatusCommunication = noStones === false && this.props.arrangingRooms === false
    let sphere = Get.sphere(sphereId);
    return (
      <View style={{flex:1}}>
        { shouldShowStatusCommunication ? <StatusCommunication sphereId={sphereId} viewingRemotely={viewingRemotely} opacity={0.5}  /> : undefined }
        <RoomLayer
          viewId={this.props.viewId}
          sphereId={sphereId}
          viewingRemotely={viewingRemotely}
          zoomOutCallback={this.props.zoomOutCallback}
          setRearrangeRooms={this.props.setRearrangeRooms}
          arrangingRooms={this.props.arrangingRooms}
        />
        { shouldShowStatusCommunication ? <StatusCommunication sphereId={sphereId} viewingRemotely={viewingRemotely} opacity={0.5}  /> : undefined }
        <View style={{position:'absolute', top:0, flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
          { this.props.arrangingRooms ? <ArrangingHeader viewId={this.props.viewId} setRearrangeRooms={this.props.setRearrangeRooms}/> : <SphereHeader sphere={sphere} /> }
        </View>
      </View>
    );
  }
}


function SphereHeader({sphere}) {
  return (
    <React.Fragment>
      <TouchableOpacity onPress={() => { NavigationUtil.openDrawer() }} style={{paddingLeft:19}}>
        <Icon name={'enty-menu'} size={24} color={colors.csBlue.hex} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { NavigationUtil.openDrawer() }}>
        <Text style={styles.viewHeader}>{sphere.config.name}</Text>
      </TouchableOpacity>
    </React.Fragment>
  )
}


function ArrangingHeader({viewId, setRearrangeRooms}) {
  let buttonStyle : TextStyle = {
    fontSize:16, fontWeight: 'bold', color: colors.white.hex,
  }
  return (
    <React.Fragment>
      <TouchableOpacity onPress={() => { core.eventBus.emit("reset_positions" + viewId); setRearrangeRooms(false);  }} style={{paddingHorizontal:20}}>
        <Text style={buttonStyle}>Cancel</Text>
      </TouchableOpacity>
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        <Text style={{fontSize:25, fontWeight: 'bold', color: colors.white.hex}}>{"Move the rooms!"}</Text>
      </View>
      <TouchableOpacity onPress={() => { core.eventBus.emit("save_positions" + viewId); }} style={{paddingHorizontal:20}}>
        <Text style={buttonStyle}>Save</Text>
      </TouchableOpacity>
    </React.Fragment>
  )
}
