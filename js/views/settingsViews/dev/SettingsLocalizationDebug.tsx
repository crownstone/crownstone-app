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
import {colors, OrangeLine, screenWidth, styles} from "../../styles";
import {Util} from "../../../util/Util";
import {Background} from "../../components/Background";
import {ForceDirectedView} from "../../components/interactiveView/ForceDirectedView";
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {LocalizationDebugCircle} from "./LocalizationDebugCircle";
import {getPresentUsersInLocation} from "../../../util/DataUtil";
import {AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION} from "../../../ExternalConfig";


export class SettingsLocalizationDebug extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: 'Localization Debug',
    }
  };

  _baseRadius;
  unsubscribeNativeEvents = [];
  unsubscribeStoreEvents;
  viewId = null;
  refName : string;

  roomData = {};
  sphereId = null;
  validMeasurement = false;
  currentLocation = null;
  appLocation = null;
  _amountOfStones = 0

  constructor(props) {
    super(props);

    this._baseRadius = 0.15 * screenWidth;

    this.viewId = Util.getUUID();
    this.refName = (Math.random() * 1e9).toString(36);
  }


  componentDidMount() {
    this.unsubscribeNativeEvents.push(NativeBus.on(NativeBus.topics.classifierProbabilities, (data) => {
      this.roomData = data;
    }))
    this.unsubscribeNativeEvents.push(NativeBus.on(NativeBus.topics.classifierResult, (data) => {
      this.currentLocation = data.highestPredictionLabel;
      this.validMeasurement = data.valid;
    }))
    this.unsubscribeNativeEvents.push(NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data) => {
      this._amountOfStones = data.length
    }))
    this.unsubscribeNativeEvents.push(NativeBus.on(NativeBus.topics.currentRoom, (data) => {
      this.forceUpdate();
    }))
    this.unsubscribeNativeEvents.push(NativeBus.on(NativeBus.topics.enterRoom, (data) => {
      this.appLocation = data.location;
    }))

    this.unsubscribeStoreEvents = this.props.eventBus.on('databaseChange', (data) => {
      let change = data.change;

      if (change.changeLocations || change.changeSpheres || change.updateActiveSphere) {
        this.forceUpdate();
      }
    });

    // get initial location
    const store = this.props.store;
    let state = store.getState();
    let sphereId = Util.data.getPresentSphereId(state);
    if (sphereId) {
      const sphere = state.spheres[sphereId];
      const locationIds = Object.keys(sphere.locations);

      // for each location, get the users in there.
      locationIds.forEach((locationId) => {
        let presentUsers = getPresentUsersInLocation(state, sphereId, locationId);
        if (presentUsers.length > 0) {
          presentUsers.forEach((user) => {
            if (user.id === state.user.userId) {
              this.appLocation = locationId;
            }
          });
        }
      });
    }
  }

  componentWillUnmount() {
    this.unsubscribeNativeEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }



  _calculateColor(locationId) {
    if (!(this.roomData && this.roomData[locationId])) {
      return colors.menuBackground.hex;
    }
    let value = Math.log10(this.roomData[locationId].probability);
    let stepCount = 15;

    let roomIds = Object.keys(this.roomData);
    let min = 1e9;
    let max = -1e9;
    for (let i = 0; i < roomIds.length; i++) {
      if (this.roomData[roomIds[i]].probability != 0) {
        min = Math.min(Math.log10(this.roomData[roomIds[i]].probability), min);
        max = Math.max(Math.log10(this.roomData[roomIds[i]].probability), max);
      }
    }


    let valueRange = (max - min)
    if (valueRange == 0) {
      return 'rgb(0,30,60)'
    }

    let factor = (value - min) / valueRange;

    if (factor > 1)
      factor = 1
    else if (factor < 0)
      factor = 0

    let fraction = (factor%(1/stepCount))
    if (fraction < 0.5/stepCount)
      factor = factor - (factor % (1 / stepCount))
    else
      factor = factor - (factor % (1 / stepCount)) + 1/stepCount



    return 'rgb(' + Math.round(255 * factor) + ',' + Math.round(30 * (1 - factor)) + ',' + Math.round(60 * (1 - factor)) + ')';
  }


  _renderRoom(locationId, nodePosition) {
    if (locationId !== null) {
      // variables to pass to the room overview
      return (
        <LocalizationDebugCircle
          viewId={this.viewId}
          eventBus={this.props.eventBus}
          locationId={locationId}
          sphereId={this.sphereId}
          radius={this._baseRadius}
          store={this.props.store}
          pos={{x: nodePosition.x, y: nodePosition.y}}
          viewingRemotely={true}
          key={locationId}
          inLocation={locationId === this.currentLocation}
          isAppLocation={locationId === this.appLocation}
          probabilityData={this.roomData[locationId] || {}}
          backgroundColor={this._calculateColor(locationId)}
          validMeasurement={this.validMeasurement}
        />
      );
    }
  }



  render() {
    const store = this.props.store;
    let state = store.getState();
    let sphereId = Util.data.getPresentSphereId(state);
    this.sphereId = sphereId;

    if (sphereId === null) {
      return <View style={{flex: 1}} ><Text>You have to be in a Sphere</Text></View>;
    }
    else {
      let roomData = Util.data.getLayoutDataRooms(this.props.store.getState(), sphereId);
      return (
        <Background image={require('../../../images/blueprintBackgroundDesaturated_noLine.png')}>
          <OrangeLine/>
          <View style={{
            position:'absolute', top:5, left:5, padding:5, borderRadius:5,
            backgroundColor:this._amountOfStones < AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION ? colors.csOrange.hex : 'transparent',
          }}>
            <Text style={{
              color: colors.white.hex,
              fontSize:17, fontWeight:'bold'}}
            >
            {this._amountOfStones + " Crownstone" + (this._amountOfStones !== 1 ? "s" : '') + " in vector"}
            </Text>
          </View>
          <ForceDirectedView
            ref={this.refName}
            viewId={this.viewId}
            topOffset={0.3*this._baseRadius}
            bottomOffset={0}
            drawToken={this.props.sphereId}
            nodeIds={roomData.roomIdArray}
            initialPositions={roomData.initialPositions}
            enablePhysics={roomData.usePhysics}
            nodeRadius={this._baseRadius}
            allowDrag={false}
            renderNode={(id, nodePosition) => { return this._renderRoom(id, nodePosition); }}
          />
        </Background>
      );
    }
  }
}