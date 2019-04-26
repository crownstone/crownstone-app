
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  Text,
  View
} from 'react-native';

import { SetupStateHandler }    from '../../native/setup/SetupStateHandler'
import { DeviceEntry }          from '../components/deviceEntries/DeviceEntry'
import { SeparatedItemList }    from '../components/SeparatedItemList'
import { RoomBanner }           from '../components/RoomBanner'

import {
  getPresentUsersInLocation,
  getCurrentPowerUsageInLocation,
  getStonesAndAppliancesInLocation,
  canUseIndoorLocalizationInSphere,
  enoughCrownstonesInLocationsForIndoorLocalization, DataUtil
} from "../../util/DataUtil";
import { styles, colors, screenHeight, tabBarHeight, topBarHeight, OrangeLine} from '../styles'
import { RoomExplanation }        from '../components/RoomExplanation';
import { SphereDeleted }          from "../static/SphereDeleted";
import { LiveComponent }          from "../LiveComponent";
import { core } from "../../core";
import { Background } from "../components/Background";
import { DeviceEntryBasic } from "../components/deviceEntries/DeviceEntryBasic";
import { RoomList } from "../components/RoomList";


export class PlaceFloatingCrownstonesInRoom extends LiveComponent<any, any> {

  unsubscribeStoreEvents: any;
  unsubscribeSetupEvents: any;
  nearestStoneIdInSphere: any;
  nearestStoneIdInRoom: any;

  constructor(props) {
    super(props);

    let initialState = { pendingRequests: {}, scrollViewHeight: null };
    this.unsubscribeSetupEvents = [];

    initialState.scrollViewHeight = new Animated.Value(screenHeight - tabBarHeight - topBarHeight - 100);

    this.state = initialState;
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        (change.updateApplianceConfig) ||
        (change.updateStoneConfig) ||
        (change.changeFingerprint) ||
        (change.stoneRssiUpdated && change.stoneRssiUpdated.sphereIds[this.props.sphereId]) ||
        (change.stoneUsageUpdated && change.stoneUsageUpdated.sphereIds[this.props.sphereId]) ||
        (change.changeSphereState && change.changeSphereState.sphereIds[this.props.sphereId]) ||
        (change.changeStoneState && change.changeStoneState.sphereIds[this.props.sphereId]) ||
        (change.stoneLocationUpdated && change.stoneLocationUpdated.sphereIds[this.props.sphereId]) ||
        (change.changeStones)
      ) {
        this.forceUpdate();
        return;
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeStoreEvents();
  }

  _renderer(item, index, stoneId) {
    return (
      <View key={stoneId + '_entry'}>
        <DeviceEntryBasic
          stoneId={stoneId}
          sphereId={this.props.sphereId}
          callback={() => {
            core.eventBus.emit('showListOverlay', {
              title: "Select Room",
              getItems: () => {
                const state = core.store.getState();
                const sphere = state.spheres[this.props.sphereId];
                let items = [];
                Object.keys(sphere.locations).forEach((locationId) => {
                  let location = sphere.locations[locationId];
                  items.push( {id: locationId, component: <RoomList
                      icon={location.config.icon}
                      name={location.config.name}
                      hideSubtitle={true}
                      showNavigationIcon={false}
                      small={true}
                    />})
                })

                return items;
              },
              callback: (locationId) => {
                core.store.dispatch({type:"UPDATE_STONE_LOCATION", sphereId: this.props.sphereId, stoneId: stoneId, data:{locationId: locationId}})
              },
              allowMultipleSelections: false,
              selection: null,
              image: require("../../images/overlayCircles/roomsCircle.png")
            });
          }}
        />
      </View>
    );
  }

  _getStoneList(stones) {
    let stoneArray = [];
    let ids = [];
    let stoneIds = Object.keys(stones);
    let shownHandles = {};


    let tempStoneDataArray = [];
    stoneIds.forEach((stoneId) => {
      // do not show the same device twice
      let handle = stones[stoneId].stone.config.handle;
      if (shownHandles[handle] === undefined) {
        tempStoneDataArray.push({ stone: stones[stoneId], id: stoneId });
      }
    });

    // sort the order of things by crownstone Id
    tempStoneDataArray.sort((a, b) => {
      return a.stone.stone.config.crownstoneId - b.stone.stone.config.crownstoneId
    });

    tempStoneDataArray.forEach((stoneData) => {
      ids.push(stoneData.id);
      stoneArray.push(stoneData.stone);
    });

    return { stoneArray, ids };
  }



  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }

    let stones = getStonesAndAppliancesInLocation(state, this.props.sphereId, null);

    // if we're the only crownstone and in the floating crownstones overview, assume we're always present.
    let amountOfStonesInRoom = Object.keys(stones).length;
    let { stoneArray, ids } = this._getStoneList(stones);
    let viewHeight = screenHeight - tabBarHeight - topBarHeight - 100;

    return (
      <Background image={core.background.light}>
        <OrangeLine/>
        <RoomBanner
          noCrownstones={amountOfStonesInRoom === 0}
          amountOfStonesInRoom={amountOfStonesInRoom}
          hideRight={true}
          floatingCrownstones={true}
          viewingRemotely={false}
          overlayText={"Place your Crownstones in a room."}
        />
        <RoomExplanation
          state={state}
          explanation={"Tap a Crownstone and select a room!"}
          sphereId={this.props.sphereId}
          locationId={null}
        />
        <Animated.View style={{ height: this.state.scrollViewHeight }}>
          <ScrollView style={{ position: 'relative', top: -1 }}>
            <View
              style={{ height: Math.max(stoneArray.length * 81 + 0.5 * viewHeight, viewHeight) } /* make sure we fill the screen */}>
              <SeparatedItemList
                items={stoneArray}
                ids={ids}
                separatorIndent={false}
                renderer={this._renderer.bind(this)}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </Background>
    );
  }
}