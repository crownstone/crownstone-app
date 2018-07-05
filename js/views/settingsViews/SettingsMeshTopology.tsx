import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


import { Background } from './../components/Background'
import { Util } from '../../util/Util'
import {colors, OrangeLine} from './../styles'
import { MeshElement } from "../components/MeshElement";
import {ForceDirectedView} from "../components/interactiveView/ForceDirectedView";
import {topBarHeight} from "../styles";
import {TopbarButton} from "../components/topbar/TopbarButton";
import KeepAwake from 'react-native-keep-awake';
import {Icon} from "../components/Icon";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {MeshUtil} from "../../util/MeshUtil";
const Actions = require('react-native-router-flux').Actions;

let MESH_TIMEOUT = 3*24*3600*1000;

export class SettingsMeshTopology extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "Mesh Topology", headerRight:
      <TopbarButton
        text={"Networks"}
        style={{width:100}}
        onPress={() => { Actions.settingsMeshOverview(); }}
      />
    }
  };

  _baseRadius = 50;
  unsubscribeStoreEvents : any;
  nodeData = {};

  refreshCount = 0
  refreshAmountRequired = 0
  viewId : string

  constructor(props) {
    super(props);
    this.viewId = Util.getUUID();
    this.state = { leftOffset: new Animated.Value() };
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if ( change.meshIdUpdated || change.meshIndicatorUpdated || change.changeStones || change.changeLocations || change.stoneLocationUpdated ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  renderNode(id, nodePosition) {
    return (
      <MeshElement key={"meshElement"+id} id={id} nodeData={this.nodeData[id]} pos={nodePosition} radius={this._baseRadius} viewId={this.viewId} />
    );
  }

  getEdgeSettings(state, edge) {
    let label = undefined;
    if (state.user.developer === true) {
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

    this.props.eventBus.emit('showProgress', {progress: 0, progressText:'Refreshing Mesh Topology\n\nStarting...'});

    let evaluateRefreshProgress = () => {
      this.refreshCount += 1
      if (this.refreshCount >= this.refreshAmountRequired) {
        this.props.eventBus.emit("hideProgress");
        const store = this.props.store;
        const state = store.getState();
        let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
        MeshUtil.clearMeshNetworkIds(store, sphereId);
      }
      else {
        this.props.eventBus.emit('updateProgress', {progress: this.refreshCount / this.refreshAmountRequired, progressText:'Refreshing Mesh Topology\n\n('+this.refreshCount+' out of '+ this.refreshAmountRequired+")"});
      }
    }

    stoneIds.forEach((stoneId) => {
      BatchCommandHandler.loadPriority(stones[stoneId], stoneId, sphereId, {commandName: 'sendMeshNoOp'}, {}, 2, 'meshNoOp_meshRefresh' + stoneId )
        .then(() => { evaluateRefreshProgress() })
        .catch(() => { evaluateRefreshProgress() })
    })
    BatchCommandHandler.executePriority()
  }

  render() {
    const store = this.props.store;
    const state = store.getState();

    let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    if (stoneIds.length === 0) {
      return (
        <Background image={this.props.backgrounds.detailsDark}>
          <OrangeLine/>
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Text style={{color:colors.white.hex, fontWeight:'bold'}}>{'No Crownstones in Sphere "' + sphere.config.name + '" yet.'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => { Actions.settingsMeshTopologyHelp() }}
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
      let locationTitle = 'Floating...';
      let locationIcon = 'c2-pluginFilled';
      if (location) {
        locationIcon = location.config.icon;
        locationTitle = location.config.name;
      }
      let element = Util.data.getElement(this.props.store, sphereId, stoneId, stone);

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
    });

    return (
      <Background image={this.props.backgrounds.menu}>
        <OrangeLine/>
        <ForceDirectedView
          viewId={this.viewId}
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
          onPress={() => { Actions.settingsMeshTopologyHelp() }}
          style={{position:'absolute', bottom:0, right:0, width:40, height:40, borderRadius:20, overflow:'hidden',alignItems:'center', justifyContent:'center'}}>
          <Icon name={'ios-help-circle'} size={40} color={colors.darkGray.rgba(0.75)} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { Alert.alert("Refresh Topology", "While the topology updates automatically, if you move a Crownstone out of range of the others " +
            "it will take a while for the connection to time out. Manually refreshing like this will speed up this process.", [{text:'Cancel',style: 'cancel'}, {text:"OK", onPress: () => { this._refreshMesh(sphereId, stones); }}]) }}
          style={{position:'absolute', bottom:0, right:40, width:40, height:40, borderRadius:20, overflow:'hidden',alignItems:'center', justifyContent:'center'}}>
          <Icon name={'md-refresh-circle'} size={40} color={colors.darkGray.rgba(0.75)} />
        </TouchableOpacity>
      </Background>
    );
  }
}