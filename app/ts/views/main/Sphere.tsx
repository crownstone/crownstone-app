
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Sphere", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text, TouchableOpacity,
  View,
  ViewStyle
} from "react-native";

import { RoomLayer }           from './RoomLayer'
import { StatusCommunication } from './StatusCommunication'
import { screenWidth, availableScreenHeight, colors, overviewStyles, styles } from "../styles";
import {DfuStateHandler} from "../../native/firmware/DfuStateHandler";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {Icon} from "../components/Icon";
import { core } from "../../Core";
import {
  DataUtil,
  enoughCrownstonesInLocationsForIndoorLocalization, requireMoreFingerprints
} from "../../util/DataUtil";
import { Get } from "../../util/GetUtil";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";
import { EditIcon, MenuButton } from "../components/EditIcon";
import { TopBarBlur } from "../components/NavBarBlur";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderTitle } from "../components/HeaderTitle";
import {useSidebarState} from "../components/hooks/eventHooks";
import {SIDEBAR_STATE} from "../components/animated/SideBarView";


export function Sphere({sphereId, viewId, arrangingRooms, setRearrangeRooms, zoomOutCallback, openSideMenu }) {
  useSidebarState();
  const state = core.store.getState();

  let viewingRemotely = true;

  let sphereIsPresent = state.spheres[sphereId].state.present;
  if (sphereIsPresent ||  DfuStateHandler.areDfuStonesAvailable()) {
    viewingRemotely = false;
  }

  let noRoomsCurrentSphere = (sphereId ? Object.keys(state.spheres[sphereId].locations).length : 0) == 0;
  let noStones = (sphereId ? Object.keys(state.spheres[sphereId].stones).length : 0) == 0;
  let floatingStones = Object.keys(DataUtil.getStonesInLocation(sphereId, null)).length;
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
    if (Permissions.inSphere(sphereId).seeSetupCrownstone !== true) {
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

  let shouldShowStatusCommunication = noStones === false && arrangingRooms === false
  let sphere = Get.sphere(sphereId);

  let enoughForLocalizationInLocations = enoughCrownstonesInLocationsForIndoorLocalization(sphereId);
  let requiresFingerprints = requireMoreFingerprints(sphereId);
  let blinkMenuIconForLocalization = !arrangingRooms && enoughForLocalizationInLocations && requiresFingerprints && state.app.indoorLocalizationEnabled;

  console.log("HEREE", SIDEBAR_STATE)
  let blinkMenuIcon = SIDEBAR_STATE.open === false && blinkMenuIconForLocalization;


  return (
    <React.Fragment>
      <SafeAreaView style={{flexGrow:1}}>
        { shouldShowStatusCommunication ? <StatusCommunication sphereId={sphereId} viewingRemotely={viewingRemotely} opacity={0.5}  /> : undefined }
        <RoomLayer
          viewId={viewId}
          sphereId={sphereId}
          viewingRemotely={viewingRemotely}
          zoomOutCallback={zoomOutCallback}
          setRearrangeRooms={setRearrangeRooms}
          arrangingRooms={arrangingRooms}
        />
        { shouldShowStatusCommunication ? <StatusCommunication sphereId={sphereId} viewingRemotely={viewingRemotely} opacity={0.5}  /> : undefined }
      </SafeAreaView>
      <TopBarBlur disabledBlur={arrangingRooms} showNotifications={!arrangingRooms} blink={{left: blinkMenuIcon}}>
        { arrangingRooms ?
          <ArrangingHeader viewId={viewId} setRearrangeRooms={setRearrangeRooms}/> :
          <SphereHeader sphere={sphere} openSideMenu={openSideMenu} blinkMenuIcon={blinkMenuIcon}/>
        }
      </TopBarBlur>
    </React.Fragment>
  );
}


function SphereHeader({sphere, openSideMenu, blinkMenuIcon}) {
  return (
    <View style={{flexDirection: 'row', alignItems:'center'}}>
      <MenuButton onPress={openSideMenu} highlight={blinkMenuIcon} />
      <TouchableOpacity onPress={() => { openSideMenu() }} style={{alignItems:'center', justifyContent:'center'}}>
        <HeaderTitle title={sphere.config.name} />
      </TouchableOpacity>
      <View style={{flex:1}} />
      <EditIcon onPress={() => { NavigationUtil.launchModal('SphereEdit',{sphereId: sphere.id})}} />
    </View>
  );
}



function ArrangingHeader({viewId, setRearrangeRooms}) {
  return (
    <View style={{flexDirection: 'row', alignItems:'center'}}>
      <TouchableOpacity onPress={() => { core.eventBus.emit("reset_positions" + viewId); setRearrangeRooms(false);  }} style={{paddingHorizontal:15}}>
        <Text style={styles.viewButton}>Cancel</Text>
      </TouchableOpacity>
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        <Text style={{fontSize:25, fontWeight: 'bold', color: colors.white.hex}}>{"Move the rooms!"}</Text>
      </View>
      <TouchableOpacity onPress={() => { core.eventBus.emit("save_positions" + viewId); }} style={{paddingHorizontal:15}}>
        <Text style={styles.viewButton}>Save</Text>
      </TouchableOpacity>
    </View>
  )
}
