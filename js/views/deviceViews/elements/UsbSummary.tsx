import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("UsbSummary", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  View
} from 'react-native';


import { screenWidth} from '../../styles'
import { Util }                from "../../../util/Util";
import { Permissions}          from "../../../backgroundProcesses/PermissionManager";
import {DeviceButton, DeviceInformation} from "./DeviceSummary";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { OverlayUtil } from "../../overlays/OverlayUtil";

export class UsbSummary extends LiveComponent<any, any> {
  storedSwitchState = 0;
  unsubscribeStoreEvents;

  constructor(props) {
    super(props);
    this.state = {pendingCommand: false};

    const state = core.store.getState();
    const sphere = state.spheres[props.sphereId];
    const stone = sphere.stones[props.stoneId];
    this.storedSwitchState = stone.state.state;
  }

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

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    let locationLabel =  lang("Tap_here_to_move_me_");
    let locationName =  lang("Not_in_room");
    if (location) {
      locationLabel =  lang("Located_in_");
      locationName = location.config.name;
    }


    return (
      <View style={{flex:1, paddingBottom: 35}}>
        <DeviceInformation
          right={locationLabel}
          rightValue={locationName}
          rightTapAction={spherePermissions.moveCrownstone ? () => {
            OverlayUtil.callRoomSelectionOverlayForStonePlacement(this.props.sphereId, this.props.stoneId)
          } : null }
        />
        <View style={{flex:1}} />
        <View style={{width:screenWidth, alignItems: 'center' }}>
          <DeviceButton
            stoneId={this.props.stoneId}
            sphereId={this.props.sphereId}
          />
        </View>
        <View style={{flex:1.5}} />
      </View>
    )
  }
}
