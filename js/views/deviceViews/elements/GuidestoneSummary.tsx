import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("GuidestoneSummary", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from 'react-native';


import {colors, screenWidth, availableScreenHeight} from '../../styles'
import {Util} from "../../../util/Util";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { StoneInformation } from "./DeviceSummary";

export class GuidestoneSummary extends LiveComponent<any, any> {
  unsubscribeStoreEvents;
  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        !change.removeStone &&
        (
          change.changeAppSettings ||
          change.stoneLocationUpdated   && change.stoneLocationUpdated.stoneIds[this.props.stoneId] ||
          change.updateStoneConfig      && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        this.forceUpdate();
      }
    });
  }
  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const location = Util.data.getLocationFromStone(sphere, stone);

    let locationLabel =  lang("Tap_here_to_move_me_");
    let locationName =  lang("Not_in_room");
    if (location) {
      locationLabel =  lang("Located_in_");
      locationName = location.config.name;
    }

    return (
      <View style={{flex:1, paddingBottom:35}}>
        { StoneInformation({stoneId: this.props.stoneId, sphereId: this.props.sphereId, canSelectRoom: Permissions.inSphere(this.props.sphereId).moveCrownstone}) }
        <View style={{flex:1}} />
        <View style={{alignItems:'center'}}>
          <Text style={deviceStyles.subText}>{ lang("Device_Type_") }</Text>
          <Text style={deviceStyles.text}>{ lang("Guidestone") }</Text>
        </View>
        <View style={{flex: 0.2}} />
        <View style={{alignItems:'center'}}>
          <Text style={deviceStyles.subText}>{ lang("Connected_to_Mesh_") }</Text>
          <Text style={deviceStyles.text}>{ lang("YesNot_Yet",stone.config.meshId) }</Text>
        </View>
        <View style={{flex: 0.2}} />
        <View style={{alignItems:'center'}}>
          <Text style={deviceStyles.subText}>{locationLabel}</Text>
          <Text style={deviceStyles.text}>{locationName}</Text>
        </View>
        <View style={{flex: 0.2}} />
        <View style={{alignItems:'center', height: 0.2*availableScreenHeight}}>
          <Text style={deviceStyles.subText}>{ lang("Reachable_") }</Text>
          <Text style={deviceStyles.text}>{ lang("YesSearching___",stone.reachability.disabled,false) }</Text>
          {
            stone.reachability.disabled  ?
              <ActivityIndicator animating={true} size='small' color={colors.white.hex} style={{paddingTop:20}} />
            : undefined
          }
        </View>

        <View style={{flex:1}} />
      </View>
    )
  }
}

let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  text: {
    color: textColor.hex,
    fontSize: 18,
    fontWeight:'600'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});