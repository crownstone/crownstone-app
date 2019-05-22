import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomLayer", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  View
} from 'react-native';


import { RoomCircle }        from '../components/RoomCircle'
import { availableScreenHeight, screenWidth } from "../styles";
import { UserLayer }         from './UserLayer';
import {Permissions}         from "../../backgroundProcesses/PermissionManager";
import {ForceDirectedView}   from "../components/interactiveView/ForceDirectedView";
import {Util} from "../../util/Util";
import { core } from "../../core";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";

export class RoomLayer extends LiveComponent<any, any> {
  state:any; // used to avoid warnings for setting state values

  _baseRadius;
  _currentSphere;
  _forceViewRef;
  unsubscribeStoreEvents;
  unsubscribeViewEvents = [];

  constructor(props) {
    super(props);

    this._baseRadius = 0.15 * screenWidth;

    this._currentSphere = props.sphereId;
  }


  componentDidMount() {
    let reloadSolverOnDemand = () => { this.forceUpdate(); };
    this.unsubscribeViewEvents.push(core.eventBus.on("save_positions"  + this.props.viewId, () => { this._storePositions(); }));
    this.unsubscribeViewEvents.push(core.eventBus.on("reset_positions" + this.props.viewId, () => { this._resetPositions(); }));

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
    this.unsubscribeStoreEvents();
    this.unsubscribeViewEvents.forEach((unsub) => { unsub() });
  }


  _renderRoom(locationId, nodePosition) {
    // variables to pass to the room overview
    return (
      <RoomCircle
        viewId={this.props.viewId}
        locationId={locationId}
        sphereId={this.props.sphereId}
        radius={this._baseRadius}
        pos={{x: nodePosition.x, y: nodePosition.y}}
        viewingRemotely={this.props.viewingRemotely}
        key={locationId || 'floating'}
        onHold={() => { this.props.setRearrangeRooms(true); }}
      />
    );
  }

  _storePositions() {
    let nodes = this._forceViewRef.nodes;
    let nodeIds = Object.keys(nodes);
    let actions = [];
    nodeIds.forEach((nodeId) => {
      let node = nodes[nodeId];
      if (node.support === false && node.id !== null) {
        actions.push({type:"SET_LOCATION_POSITIONS", sphereId: this.props.sphereId, locationId: nodeId, data:{ x: node.x, y: node.y, setOnThisDevice: true}})
      }
      else if (node.id === null) {
        actions.push({type:"SET_FLOATING_LAYOUT_LOCATION", sphereId: this.props.sphereId, data:{ x: node.x, y: node.y, setOnThisDevice: true}})
      }
    });
    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
    this.props.setRearrangeRooms(false);
  }

  _resetPositions() {
    this._forceViewRef.initLayout();
    this.props.setRearrangeRooms(false);
  }

  render() {
    let height = availableScreenHeight;
    if (OnScreenNotifications.hasNotifications(this.props.sphereId)) {
      height -= 64;
    }

    if (this.props.sphereId === null) {
      return <View style={{position: 'absolute', top: 0, left: 0, width: screenWidth, flex: 1}} />;
    }
    else {
      let roomData = Util.data.getLayoutDataRooms(core.store.getState(), this.props.sphereId);
      return (
        <ForceDirectedView
          ref={(r) => { this._forceViewRef = r }}
          viewId={this.props.viewId}
          topOffset={0.3*this._baseRadius}
          bottomOffset={Permissions.inSphere(this.props.sphereId).addRoom ? 0.3*this._baseRadius : 0}
          drawToken={this.props.sphereId}
          nodeIds={roomData.roomIdArray}
          initialPositions={roomData.initialPositions}
          enablePhysics={roomData.usePhysics}
          nodeRadius={this._baseRadius}
          allowDrag={this.props.arrangingRooms}
          zoomOutCallback={this.props.zoomOutCallback}
          zoomInCallback={this.props.zoomInCallback}
          height={height}
          renderNode={(id, nodePosition) => { return this._renderRoom(id, nodePosition); }}>
          {
            this.props.arrangingRooms === false ?
              <UserLayer sphereId={this.props.sphereId} nodeRadius={this._baseRadius} /> : undefined
          }
        </ForceDirectedView>
      );
    }
  }
}
