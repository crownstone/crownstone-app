import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereRoomArranger", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';
import { availableScreenHeight, colors, screenWidth, tabBarHeight, tabBarMargin, topBarHeight } from "../../styles";
import {RoomCircle} from "../../components/RoomCircle";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {CancelButton} from "../../components/topbar/CancelButton";
import {TopbarButton} from "../../components/topbar/TopbarButton";
import { xUtil } from "../../../util/StandAloneUtil";
import { core } from "../../../core";
import { ForceDirectedView } from "../../components/interactiveView/ForceDirectedView";
import { Background } from "../../components/Background";
import { Util } from "../../../util/Util";
import { Icon } from "../../components/Icon";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { OnScreenNotifications } from "../../../notifications/OnScreenNotifications";



export class SphereRoomArranger extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: lang("Drag_it_around_"),
      headerLeft: <CancelButton onPress={ () => {navigation.goBack();}} />,
      headerRight: <TopbarButton
        text={ lang("Save")}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />
    }
  };

  _baseRadius;
  unsubscribeSetupEvents = [];
  unsubscribeStoreEvents;
  viewId = null;
  refName : string;
  viewingRemotely = false;

  constructor(props) {
    super(props);

    this._baseRadius = 0.15 * screenWidth;

    this.viewId = xUtil.getUUID();
    this.refName = (Math.random() * 1e9).toString(36);

    this.props.navigation.setParams({rightAction: () => { this._storePositions();}})
  }


  componentDidMount() {
    // to ensure
    let reloadSolverOnDemand = () => {
      this.forceUpdate();
    };

    this.unsubscribeSetupEvents = [];
    this.unsubscribeStoreEvents = core.eventBus.on('databaseChange', (data) => {
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
        viewId={this.viewId}
        locationId={locationId}
        sphereId={this.props.sphereId}
        radius={this._baseRadius}
        pos={{x: nodePosition.x, y: nodePosition.y}}
        seeStonesInSetupMode={false}
        viewingRemotely={this.viewingRemotely}
        key={locationId || 'floating'}
      />
    );
  }


  _storePositions() {
    let nodes = (this.refs[this.refName] as any).nodes;
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
    NavigationUtil.back();
  }

  getButtons() {
    return (
      <View style={{position:'absolute', bottom:0, left:0, width:screenWidth, height: tabBarHeight || topBarHeight, alignItems:'center', justifyContent:'center'}}>
        <View style={{position:'absolute', bottom: tabBarHeight, left:0, width:screenWidth, height: 1, backgroundColor: colors.csBlue.hex}} />
        <TouchableOpacity style={{flexDirection:'row', alignItems:'center', justifyContent:'center', width: screenWidth, height: 40}} onPress={() => { core.eventBus.emit('physicsRun'+this.viewId, 150)}}>
          <Icon name={'md-radio-button-on'} size={35} color={colors.csBlue.hex} />
          <Text style={{color: colors.csBlue.hex, fontWeight:'bold', paddingLeft:15, paddingRight:15, fontSize:16, textAlign:'center'}}>{ lang("Solve_Positions") }</Text>
        </TouchableOpacity>
        <View style={{height: 0.5*tabBarMargin, width: screenWidth}} />
      </View>
    )
  }


  render() {
    let height = availableScreenHeight;
    if (OnScreenNotifications.hasNotifications()) {
      height -= 64;
    }
    if (this.props.sphereId === null) {
      return <View style={{position: 'absolute', top: 0, left: 0, width: screenWidth, flex: 1}} />;
    }
    else {
      let activeSphere = core.store.getState().spheres[this.props.sphereId];
      this.viewingRemotely = !activeSphere.state.present;

      let roomData = Util.data.getLayoutDataRooms(core.store.getState(), this.props.sphereId);
      return (
        <Background image={require('../../../images/blueprintBackgroundGray.png')} hasNavBar={false} safeView={true}>
          <ForceDirectedView
            ref={this.refName}
            viewId={this.viewId}
            topOffset={0.3*this._baseRadius}
            bottomOffset={Permissions.inSphere(this.props.sphereId).addRoom ? 0.3*this._baseRadius : 0}
            drawToken={this.props.sphereId}
            nodeIds={roomData.roomIdArray}
            initialPositions={roomData.initialPositions}
            enablePhysics={roomData.usePhysics}
            nodeRadius={this._baseRadius}
            height={height}
            allowDrag={true}
            renderNode={(id, nodePosition) => { return this._renderRoom(id, nodePosition); }}
          />
          {this.getButtons()}
        </Background>
      );
    }
  }
}
