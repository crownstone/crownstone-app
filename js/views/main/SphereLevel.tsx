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
import {ForceDirectedView}   from "../components/interactiveView/ForceDirectedView";
import {Util} from "../../util/Util";
import {SphereCircle} from "../components/SphereCircle";

export class SphereLevel extends Component<any, any> {
  state:any; // used to avoid warnings for setting state values

  _baseRadius;
  _currentSphere;
  _showingFloatingRoom;
  unsubscribeSetupEvents = [];
  unsubscribeStoreEvents;
  viewId: string;

  constructor(props) {
    super(props);

    this._baseRadius = 0.15 * screenWidth;
    this.viewId = Util.getUUID()
    this._currentSphere = props.sphereId;
    this._showingFloatingRoom = false
  }


  componentDidMount() {
    // to ensure
    let reloadSolverOnDemand = () => {
      this.forceUpdate();
    };

    this.unsubscribeSetupEvents = [];

    this.unsubscribeStoreEvents = this.props.eventBus.on('databaseChange', (data) => {
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
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }


  _renderRoom(sphereId, nodePosition) {
    // variables to pass to the room overview
    return (
      <SphereCircle
        viewId={this.viewId}
        eventBus={this.props.eventBus}
        sphereId={sphereId}
        radius={this._baseRadius}
        store={this.props.store}
        pos={{x: nodePosition.x, y: nodePosition.y}}
        key={sphereId}
        selectSphere={() => { this.props.selectSphere(sphereId) }}
      />
    );
  }

  render() {
    let state = this.props.store.getState()
    return (
      <ForceDirectedView
        viewId={this.viewId}
        topOffset={0.3*this._baseRadius}
        bottomOffset={Permissions.inSphere(this.props.sphereId).addRoom ? 0.3*this._baseRadius : 0}
        drawToken={this.props.sphereId}
        nodeIds={Object.keys(state.spheres)}
        enablePhysics={true}
        nodeRadius={this._baseRadius}
        allowDrag={false}
        zoomInCallback={ this.props.zoomInCallback }
        zoomOutCallback={ this.props.zoomOutCallback }
        renderNode={(id, nodePosition) => { return this._renderRoom(id, nodePosition); }} />
    );
  }
}
