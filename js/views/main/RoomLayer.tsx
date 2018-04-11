import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  PanResponder,
  Platform,
  ScrollView,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

let Actions = require('react-native-router-flux').Actions;
import { SetupStateHandler } from '../../native/setup/SetupStateHandler'
import { RoomCircle }        from '../components/RoomCircle'
import { getFloatingStones} from '../../util/DataUtil'
import { screenWidth} from '../styles'
import { UserLayer }         from './UserLayer';
import {Permissions}         from "../../backgroundProcesses/PermissionManager";
import {ForceDirectedView}   from "../components/InteractiveView/ForceDirectedView";

export class RoomLayer extends Component<any, any> {
  state:any; // used to avoid warnings for setting state values

  _baseRadius;
  _currentSphere;
  _showingFloatingRoom;
  unsubscribeSetupEvents = [];
  unsubscribeStoreEvents;

  constructor(props) {
    super(props);

    this._baseRadius = 0.15 * screenWidth;

    this._currentSphere = props.sphereId;
    this._showingFloatingRoom = false
  }


  componentDidMount() {
    // to ensure
    let reloadSolverOnDemand = () => {
      this.forceUpdate();
    };

    this.unsubscribeSetupEvents = [];
    this.unsubscribeSetupEvents.push(this.props.eventBus.on('setupStarting',  reloadSolverOnDemand));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on('setupCleanedUp', reloadSolverOnDemand));

    this.unsubscribeSetupEvents.push(this.props.eventBus.on('setupStonesDetected',  () => {
      reloadSolverOnDemand();
    }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on('noSetupStonesVisible', () => {
      reloadSolverOnDemand();
    }));

    this.unsubscribeStoreEvents = this.props.eventBus.on('databaseChange', (data) => {
      let change = data.change;

      if (change.changeLocations) {
        this.forceUpdate();
      }

      if (
        change.changeStones ||      // in case a stone that was floating was removed (and it was the last one floating) or added (and its floating)
        change.stoneLocationUpdated // in case a stone was moved from floating to room and it was the last one floating.)
      ) {
        reloadSolverOnDemand();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }

  _renderRoom(locationId, nodePosition) {
    // variables to pass to the room overview
    return (
      <RoomCircle
        eventBus={this.props.eventBus}
        locationId={locationId}
        sphereId={this.props.sphereId}
        radius={this._baseRadius}
        store={this.props.store}
        pos={{x: nodePosition.x, y: nodePosition.y}}
        seeStonesInSetupMode={SetupStateHandler.areSetupStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).seeSetupCrownstone}
        viewingRemotely={this.props.viewingRemotely}
        key={locationId || 'floating'}
      />
    );
  }

  _isFloatingRoomRequired(state) {
    let floatingStones = getFloatingStones(state, this.props.sphereId);
    return floatingStones.length > 0 || (SetupStateHandler.areSetupStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).seeSetupCrownstone);
  }

  getRooms() {
    const state = this.props.store.getState();
    let rooms = state.spheres[this.props.sphereId].locations;

    let showFloatingCrownstones = this._isFloatingRoomRequired(state);

    let roomIdArray = Object.keys(rooms).sort();
    if (showFloatingCrownstones) {
      roomIdArray.push(null);
    }

    return roomIdArray;
  }


  render() {
    if (this.props.sphereId === null) {
      return <View style={{position: 'absolute', top: 0, left: 0, width: screenWidth, flex: 1}} />;
    }
    else {
      let roomIdArray = this.getRooms();

      return (
        <ForceDirectedView
          heightOffset={0.3*this._baseRadius}
          drawToken={this.props.sphereId}
          nodeIds={roomIdArray}
          nodeRadius={this._baseRadius}
          renderNode={(id, nodePosition) => { return this._renderRoom(id, nodePosition); }}>
          <UserLayer
            store={this.props.store}
            eventBus={this.props.eventBus}
            sphereId={this.props.sphereId}
            nodeRadius={this._baseRadius}
          />
        </ForceDirectedView>
      );
    }
  }
}
