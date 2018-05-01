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
  View
} from 'react-native';


import { Background } from './../components/Background'
import { Util } from '../../util/Util'
import {colors, OrangeLine} from './../styles'
import { MeshElement } from "../components/MeshElement";
import {ForceDirectedView} from "../components/interactiveView/ForceDirectedView";
import {topBarHeight} from "../styles";
import {TopbarButton} from "../components/topbar/TopbarButton";
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

  constructor(props) {
    super(props);
    this.state = { leftOffset: new Animated.Value() };
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if ( change.meshIdUpdated || change.meshIndicatorUpdated || change.changeStones || change.changeLocations || change.stoneLocationUpdated) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  renderNode(id, nodePosition) {
    return (
      <MeshElement key={"meshElement"+id} id={id} nodeData={this.nodeData[id]} pos={nodePosition} radius={this._baseRadius} />
    );
  }

  getEdgeSettings(edge) {
    let label = edge.rssi + '';
    if (edge.rssi > -60) {
      return [
        {offset: 0, color: colors.white.hex, thickness: 6, coverage: 1, label: label},
        {offset: -15, color: colors.lightGreen.hex, thickness: 4, coverage: 1},
        {offset: 15, color: colors.lightGreen.hex, thickness: 4, coverage: 1},
        {offset: -28, color: colors.green.hex, thickness: 2, coverage: 0.8},
        {offset: 28, color: colors.green.hex, thickness: 2, coverage: 0.8},
      ]
    }
    else if (edge.rssi > -70) {
      return [
        {offset: 0, color: colors.lightGreen.hex, thickness: 4, coverage: 1, label: label},
        {offset: -12, color: colors.green.hex, thickness: 3, coverage: 0.8},
        {offset: 12, color: colors.green.hex, thickness: 3, coverage: 0.8},
      ]
    }
    else if (edge.rssi > -80) {
      return [
        {offset: 0, color: colors.green.hex, thickness: 4, coverage: 1, label: label},
        {offset: -12, color: colors.white.hex, thickness: 3, coverage: 0.7},
        {offset: 12, color: colors.white.hex, thickness: 3, coverage: 0.7},
      ]
    }
    else if (edge.rssi > -85) {
      return [
        {offset: 0, color: colors.lightCsOrange.hex, thickness: 4, coverage: 1, label: label},
        {offset: -12, color: colors.lightCsOrange.hex, thickness: 3, coverage: 0.8},
        {offset: 12, color: colors.lightCsOrange.hex, thickness: 3, coverage: 0.8},
      ]
    }
    else if (edge.rssi > -90) {
      return [
        {offset: 0, color: colors.lightCsOrange.hex, thickness: 4, coverage: 1, label: label},
      ]
    }
    else if (edge.rssi > -95) {
      return [
        {offset: 0, color: colors.darkCsOrange.hex, thickness: 6, coverage: 0.8, dashArray:"10, 5", label: label},
      ]
    }
    else {
      return [
        {offset: 0, color: colors.darkRed.hex, thickness: 6, coverage: 0.8, opacity: 0.3, dashArray:"8, 12", label: label},
      ]
    }

  }

  render() {
    const store = this.props.store;
    const state = store.getState();

    let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    let locationColorArray = [
      colors.green.hex,
      colors.csOrange.hex,
      colors.menuTextSelected.hex,
      colors.blue.hex,
      colors.purple.hex,
      colors.darkPurple.hex,
      colors.menuBackground.hex,
      colors.red.hex,
      colors.darkRed.hex,
    ];

    let colorIndex = 0;
    let locationColorMap = {"null": colors.gray.hex};


    let edges = [];
    let connections = {};
    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];

      if (locationColorMap[stone.config.locationId] === undefined) {
        locationColorMap[stone.config.locationId] = locationColorArray[colorIndex];
        colorIndex++;
        if (colorIndex >= locationColorArray.length) { colorIndex = 0; }
      }

      let location = Util.data.getLocationFromStone(sphere, stone);
      let locationColor = locationColorMap[stone.config.locationId];
      let locationTitle = 'Floating...';
      let locationIcon = 'c2-pluginFilled';
      if (location) {
        locationIcon = location.config.icon;
        locationTitle = location.config.name;
      }
      let element = Util.data.getElement(sphere, stone);

      this.nodeData[stoneId] = {locationIcon: locationIcon, locationTitle:locationTitle, locationColor: locationColor, element: element};

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
    })

    return (
      <Background image={this.props.backgrounds.detailsDark}>
        <OrangeLine/>
        <ForceDirectedView
          nodeIds={stoneIds}
          nodeRadius={this._baseRadius}
          edges={edges}
          renderNode={(id, nodePosition) => { return this.renderNode(id, nodePosition); }}
          edgeRenderSettings={(edge) => { return this.getEdgeSettings(edge); }}
          heightOffset={0}
          options={{
            solver:"forceAtlas2Based",
            barnesHut: {gravitationalConstant: -1000, springLength: 50, springConstant: 0.02},
            forceAtlas2Based: {theta: 0.4, gravitationalConstant: -250, springLength: 30, centralGravity: 0.02, springConstant: 0.06},
            useOverlapAvoidance: false,
            useDynamicEdges: true,
            timestep: 0.4
          }}
        />
      </Background>
    );
  }
}