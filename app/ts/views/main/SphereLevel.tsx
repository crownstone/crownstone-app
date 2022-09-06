import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereLevel", key)(a,b,c,d,e);
}
import * as React from 'react';

import { availableScreenHeight, colors, screenWidth, styles } from "../styles";
import {Permissions}         from "../../backgroundProcesses/PermissionManager";
import {ForceDirectedView}   from "../components/interactiveView/ForceDirectedView";
import {SphereCircle} from "../components/SphereCircle";
import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../Core";
import { Text, TouchableOpacity, View } from "react-native";
import {TopBarBlur} from "../components/NavBarBlur";

export class SphereLevel extends LiveComponent<any, any> {
  state:any; // used to avoid warnings for setting state values

  _baseRadius;
  _currentSphere;
  _showingFloatingRoom;
  _forceViewRef;

  unsubscribeEvents = [];
  unsubscribeStoreEvents;
  viewId: string;

  constructor(props) {
    super(props);

    this._baseRadius = 0.15 * screenWidth;
    this.viewId = xUtil.getUUID();
    this._currentSphere = props.sphereId;
    this._showingFloatingRoom = false
  }


  componentDidMount() {
    // to ensure
    let reloadSolverOnDemand = () => {
      this.forceUpdate();
    };

    this.unsubscribeEvents = [];
    this.unsubscribeEvents.push(core.eventBus.on("onScreenNotificationsUpdated", () => { this.forceUpdate(); }));
    this.unsubscribeStoreEvents = core.eventBus.on('databaseChange', (data) => {
      let change = data.change;

      if (change.changeLocations) {
        this.forceUpdate();
      }

      if (
        change.changeStones            || // in case a stone that was floating was removed (and it was the last one floating) or added (and its floating)
        change.stoneLocationUpdated // in case a stone was moved from floating to room and it was the last one floating.)
      ) {
        reloadSolverOnDemand();
      }
      if (change.changeLocationPositions) {
        reloadSolverOnDemand();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }


  _renderRoom(sphereId, nodePosition) {
    // variables to pass to the room overview
    return (
      <SphereCircle
        viewId={this.viewId}
        sphereId={sphereId}
        radius={this._baseRadius}
        pos={{x: nodePosition.x, y: nodePosition.y}}
        key={sphereId}
        selectSphere={() => { this.props.selectSphere(sphereId) }}
        touch={() => { this._forceViewRef.nodeTouch(sphereId); }}
      />
    );
  }

  render() {
    let state = core.store.getState();
    return (
      <View style={{flex:1}}>
        <ForceDirectedView
          ref={(r) => { this._forceViewRef = r }}
          viewId={this.viewId}
          topOffset={0.3*this._baseRadius}
          bottomOffset={0.3*this._baseRadius}
          drawToken={this.props.sphereId}
          nodeIds={Object.keys(state.spheres)}
          enablePhysics={true}
          nodeRadius={this._baseRadius}
          allowDrag={false}
          height={availableScreenHeight}
          renderNode={(id, nodePosition) => { return this._renderRoom(id, nodePosition); }}
          testID={"SphereOverview_SphereLevel"}
        />
        <TopBarBlur disabledBlur>
          <View style={{paddingHorizontal:15}}>
            <Text style={styles.viewHeaderLight}>{ lang("Where_to_go_") }</Text>
          </View>
        </TopBarBlur>
      </View>
    );
  }
}
