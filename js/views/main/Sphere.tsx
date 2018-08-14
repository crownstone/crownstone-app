import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
let Actions = require('react-native-router-flux').Actions;

import { RoomLayer }           from './RoomLayer'
import { StatusCommunication } from './StatusCommunication'
import { LOG }       from '../../logging/Log'
import {screenWidth, availableScreenHeight, colors} from '../styles'
import {SetupStateHandler} from "../../native/setup/SetupStateHandler";
import {DfuStateHandler} from "../../native/firmware/DfuStateHandler";
import {overviewStyles} from "./SphereOverview";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {Icon} from "../components/Icon";


export class Sphere extends Component<any, any> {
  render() {
    LOG.info("RENDERING SPHERE");
    const store = this.props.store;
    const state = store.getState();
    let viewingRemotely = true;
    let currentSphere = this.props.sphereId;

    let sphereIsPresent = state.spheres[currentSphere].state.present;
    if (sphereIsPresent || SetupStateHandler.areSetupStonesAvailable() || DfuStateHandler.areDfuStonesAvailable()) {
      viewingRemotely = false;
    }

    let noRoomsCurrentSphere = (currentSphere ? Object.keys(state.spheres[currentSphere].locations).length : 0) == 0;
    let noStones = (currentSphere ? Object.keys(state.spheres[currentSphere].stones).length : 0) == 0;


    // This is an empty sphere. Tell the user what to expect.
    if (noStones === true && noRoomsCurrentSphere == true) {
      // on screen buttons are 0.11*screenWidth high.
      let viewStyle = {
        position:'absolute',
        top: 0.11*screenWidth, left:0,
        alignItems: 'center', justifyContent: 'center',
        height: availableScreenHeight - 2*0.11*screenWidth, width: screenWidth, padding:15
      };
      if (Permissions.inSphere(this.props.sphereId).seeSetupCrownstone !== true) {
        // this user cannot see setup Crownstones. Tell him the admin will have to add them.
        return (
          <View style={viewStyle}>
            <Icon name="c2-pluginFront" size={150} color={colors.menuBackground.hex}/>
            <Text style={overviewStyles.mainText}>{"No Crownstones added yet!"}</Text>
            <Text style={overviewStyles.subText}>{"Ask the admin of this Sphere to add some!"}</Text>
          </View>
        )
      }
      else if (!SetupStateHandler.areSetupStonesAvailable() === true) {
        // This dude can add stones. Tell him how.
        return (
          <View style={viewStyle}>
            <Icon name="c2-pluginFront" size={150} color={colors.menuBackground.hex}/>
            <Text style={overviewStyles.mainText}>{"No Crownstones added yet!"}</Text>
            <Text style={overviewStyles.subText}>{"Get close to a new Crownstone and it will appear here automatically!"}</Text>
            <Text style={overviewStyles.subTextSmall}>{"If nothing happens, ensure the Crownstone is powered on and not paired with another user.\n\n" +
            (Platform.OS === 'android' ? "More help is available under 'help' in the side menu." : "More help is available in the help menu in the settings.")
            }</Text>
          </View>
        )
      }
    }


    return (
      <View style={{width: screenWidth, height: availableScreenHeight}}>
        <StatusCommunication store={store} sphereId={currentSphere} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} opacity={0.5}  />
        <RoomLayer store={store} sphereId={currentSphere} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} multipleSpheres={this.props.multipleSpheres} />
        <StatusCommunication store={store} sphereId={currentSphere} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} opacity={0.5} />
      </View>
    );
  }

}
