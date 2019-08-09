import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsMeshTopology", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  Animated,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { Util } from '../../util/Util'
import { availableScreenHeight, colors } from "./../styles";
import { MeshElement } from "../components/MeshElement";
import { ForceDirectedView } from "../components/interactiveView/ForceDirectedView";
import { Icon } from "../components/Icon";
import { BatchCommandHandler } from "../../logic/BatchCommandHandler";
import { MeshUtil } from "../../util/MeshUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";

let MESH_TIMEOUT = 3*24*3600*1000;

export class SettingsMeshTopology extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({
      title: lang("Mesh_Topology"),
      nav: {id: 'networks', text: lang('Networks')}
    })
  }

  _baseRadius = 50;
  unsubscribeEvents : any;
  nodeData = {};

  refreshCount = 0;
  refreshAmountRequired = 0;
  viewId : string;

  constructor(props) {
    super(props);
    this.viewId = xUtil.getUUID();
    this.state = { leftOffset: new Animated.Value(0) };
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'networks') {
      NavigationUtil.navigate("SettingsMeshOverview");
    }
  }

  componentDidMount() {
    this.unsubscribeEvents = []
    this.unsubscribeEvents.push(core.eventBus.on("onScreenNotificationsUpdated", () => { this.forceUpdate(); }));
    this.unsubscribeEvents.push(core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if ( change.meshIdUpdated || change.meshIndicatorUpdated || change.changeStones || change.changeLocations || change.stoneLocationUpdated ) {
        this.forceUpdate();
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribeEvents.forEach((unsub) => { unsub() });
  }

  renderNode(id, nodePosition) {
    return (
      <MeshElement key={"meshElement"+id} id={id} nodeData={this.nodeData[id]} pos={nodePosition} radius={this._baseRadius} viewId={this.viewId} />
    );
  }

  getEdgeSettings(state, edge) {
    let label = undefined;
    if (state.user.developer === true && state.development.show_rssi_values_in_mesh === true) {
      label = edge.rssi + '';
    }

    // item list for the 6 different phases. They fade to each other.
    let bounds = [-70, -76, -83, -92];

    if (edge.rssi > bounds[0]) {
      // 0 .. -59
      return [
        {offset: 0, color: colors.green.hex, thickness: 25, coverage: 1, label: label},
      ]
    }
    else if (edge.rssi > bounds[1]) {
      // -60 .. -69
      let factor = 1-Math.abs((edge.rssi - bounds[0])/(bounds[0]-bounds[1]));
      return [
        {offset: 0, color: colors.green.blend(colors.blue2, 1-factor).hex, thickness: 10 + 15*factor, coverage: 1, label: label},
      ]
    }
    else if (edge.rssi > bounds[2]) {
      // -70 .. -79
      let factor = 1-Math.abs((edge.rssi - bounds[1])/(bounds[1]-bounds[2]));
      return [
        {offset: 0, color: colors.blue2.blend(colors.purple, 1-factor).hex, thickness: 4 + 6*factor, coverage: 1, label: label},
      ];
    }
    else if (edge.rssi > bounds[3]) {
      let factor = 1-Math.abs((edge.rssi - bounds[2])/(bounds[2]-bounds[3]));
      // -81 .. -85
      return [
        {offset: 0, color: colors.purple.blend(colors.red, 1-factor).hex, thickness: 4, coverage: 1, label: label},
      ];
    }
    else {
      // -95 .. -120
      return [
        {offset: 0, color: colors.darkRed.hex, thickness: 5, coverage: 1, opacity: 0.6, dashArray:"8, 12", label: label},
      ]
    }
  }

  _refreshMesh(sphereId, stones) {
    let stoneIds = Object.keys(stones);
    this.refreshAmountRequired = stoneIds.length;
    this.refreshCount = 0;

    core.eventBus.emit('showProgress', {progress: 0, progressText: lang("Refreshing_Mesh_Topology_Start")});

    let evaluateRefreshProgress = () => {
      this.refreshCount += 1;
      if (this.refreshCount >= this.refreshAmountRequired) {
        core.eventBus.emit("hideProgress");
        const store = core.store;
        const state = store.getState();
        let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
        MeshUtil.clearMeshNetworkIds(store, sphereId);
      }
      else {
        core.eventBus.emit('updateProgress', {progress: this.refreshCount / this.refreshAmountRequired, progressText: lang("Refreshing_Mesh_Topology_",this.refreshCount,this.refreshAmountRequired)});
      }
    };

    stoneIds.forEach((stoneId) => {
      BatchCommandHandler.loadPriority(stones[stoneId], stoneId, sphereId, {commandName: 'sendMeshNoOp'}, {}, 2, 'meshNoOp_meshRefresh' + stoneId )
        .then(() => { evaluateRefreshProgress() })
        .catch(() => { evaluateRefreshProgress() })
    });
    BatchCommandHandler.executePriority()
  }

  // _debugPrints(sphereId, connections, edgeId, stones) {
  //   let element1 = Util.data.getElement(core.store, sphereId, connections[edgeId].from, stones[connections[edgeId].from]);
  //   let element2 = Util.data.getElement(core.store, sphereId, connections[edgeId].to,   stones[connections[edgeId].to]);
  //
  //   let stoneName0 = stones[connections[edgeId].from].config.name;
  //   let stoneName1 = stones[connections[edgeId].to].config.name;
  //
  //   let names = [stoneName0, stoneName1].sort();
  //
  //   let n0 = stoneName0.split(":");
  //   let n1 = stoneName1.split(":");
  //
  //   if (n0[1] !== n1[1]) {
  //     console.log("meshDebug: '"+names[0], '-', names[1], ';', connections[edgeId].rssi+"',")
  //   }
  // }

  render() {
    const store = core.store;
    const state = store.getState();

    let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    if (stoneIds.length === 0) {
      return (
        <Background image={core.background.menu}>
                    <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Text style={{color:colors.menuBackground.hex, fontWeight:'bold'}}>{ lang("No_Crownstones_in_Sphere_",sphere.config.name) }</Text>
          </View>
          <TouchableOpacity
            onPress={() => { NavigationUtil.navigate( "SettingsMeshTopologyHelp"); }}
            style={{position:'absolute', bottom:0, right:0, width:40, height:40, borderRadius:20, overflow:'hidden',alignItems:'center', justifyContent:'center'}}>
            <Icon name={'ios-help-circle'} size={40} color={colors.darkGray.rgba(0.75)} />
          </TouchableOpacity>
        </Background>
      );
    }

    let edges = [];
    let connections = {};
    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];


      let location = Util.data.getLocationFromStone(sphere, stone);
      let locationTitle =  lang("Floating___");
      let locationIcon = 'c2-pluginFilled';
      if (location) {
        locationIcon = location.config.icon;
        locationTitle = location.config.name;
      }
      let element = Util.data.getElement(core.store, sphereId, stoneId, stone);

      this.nodeData[stoneId] = {locationIcon: locationIcon, deviceIcon: element.config.icon, locationTitle:locationTitle, element: element, stone:stone};

      //  if a stone is not in a mesh, do not show any stored connections
      if (!stone.config.meshNetworkId) { return; }
      let connectedNodes = Object.keys(stone.mesh);
      connectedNodes.forEach((nodeId) => {
        // dont show dead nodes
        if (!stones[nodeId]) { return }
        // dont show nodes that are no longer is mesh
        if (!stones[nodeId].config.meshNetworkId) { return }

        let edgeId = stoneId > nodeId ? stoneId + nodeId : nodeId + stoneId;
        let existing = connections[edgeId];
        if (
            existing === undefined ||
            existing.timestamp < MESH_TIMEOUT ||
            existing.timestamp < stone.mesh[nodeId].timestamp ||
            existing.rssi > stone.mesh[nodeId].rssi
           ) {
          connections[edgeId] = {
            id: edgeId,
            from: stoneId,
            to: nodeId,
            rssi: stone.mesh[nodeId].rssi,
            timestamp: stone.mesh[nodeId].timestamp
          };
        }
      });
    });

    let edgeIds = Object.keys(connections);
    edgeIds.forEach((edgeId) => {
      edges.push(connections[edgeId]);

      // used for comparative measurements.
      // this._debugPrints(sphereId, connections, edgeId, stones);
    });
    let height = availableScreenHeight - 1; // 1 is for the bottom light line above the navbar
    let offset = 2;
    if (OnScreenNotifications.hasNotifications(this.props.sphereId)) {
      offset += 64;
    }
    height -= offset;

    return (
      <Background image={core.background.menu}>
        <ForceDirectedView
          viewId={this.viewId}
          height={height}
          heightOffset={offset}
          nodeIds={stoneIds}
          nodeRadius={this._baseRadius}
          edges={edges}
          renderNode={(id, nodePosition) => { return this.renderNode(id, nodePosition); }}
          edgeRenderSettings={(edge) => { return this.getEdgeSettings(state, edge); }}
          options={{
            solver:"forceAtlas2Based",
            barnesHut: {gravitationalConstant: -1000, springLength: 50, springConstant: 0.02},
            forceAtlas2Based: {theta: 0.4, gravitationalConstant: -250, springLength: 30, centralGravity: 0.02, springConstant: 0.06},
            useOverlapAvoidance: false,
            useDynamicEdges: true,
            timestep: 0.4
          }}
        />
        <TouchableOpacity
          onPress={() => { NavigationUtil.navigate( "SettingsMeshTopologyHelp"); }}
          style={{position:'absolute', bottom:0, right:0, width:40, height:40, borderRadius:20, overflow:'hidden',alignItems:'center', justifyContent:'center'}}>
          <Icon name={'ios-help-circle'} size={40} color={colors.darkGray.rgba(0.75)} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { Alert.alert(
            lang("_Refresh_Topology__While__header"),
            lang("_Refresh_Topology__While__body"),
            [{text:lang("_Refresh_Topology__While__left"),style: "cancel"}, {
            text:lang("_Refresh_Topology__While__right"), onPress: () => { this._refreshMesh(sphereId, stones); }}]) }}
          style={{position:'absolute', bottom:0, right:40, width:40, height:40, borderRadius:20, overflow:'hidden',alignItems:'center', justifyContent:'center'}}>
          <Icon name={'md-refresh-circle'} size={40} color={colors.darkGray.rgba(0.75)} />
        </TouchableOpacity>
      </Background>
    );
  }
}