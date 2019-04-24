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
import { StoneInformation } from "./DeviceSummary";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";

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

    return (
      <View style={{flex:1, paddingBottom: 35}}>
        { StoneInformation({stoneId: this.props.stoneId, sphereId: this.props.sphereId, canSelectRoom: Permissions.inSphere(this.props.sphereId).moveCrownstone}) }
        <View style={{flex:1.5}} />
      </View>
    )
  }
}
