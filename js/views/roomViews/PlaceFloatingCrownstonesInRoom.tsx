
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PlaceFloatingCrownstonesInRoom", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Animated,
  ScrollView,
  View
} from 'react-native';

import { SeparatedItemList }    from '../components/SeparatedItemList'
import { RoomBanner }           from '../components/RoomBanner'

import { background, screenHeight, screenWidth, tabBarHeight, topBarHeight } from "../styles";
import { RoomExplanation }        from '../components/RoomExplanation';
import { SphereDeleted }          from "../static/SphereDeleted";
import { LiveComponent }          from "../LiveComponent";
import { core } from "../../core";
import { Background } from "../components/Background";
import { DeviceEntryBasic } from "../components/deviceEntries/DeviceEntryBasic";
import { RoomList } from "../components/RoomList";
import { OverlayUtil } from "../overlays/OverlayUtil";
import { DataUtil } from "../../util/DataUtil";
import { HubEntryBasic } from "../components/deviceEntries/HubEntryBasic";


export class PlaceFloatingCrownstonesInRoom extends LiveComponent<any, any> {

  unsubscribeStoreEvents: any;
  unsubscribeSetupEvents: any;
  nearestStoneIdInSphere: any;
  nearestStoneIdInRoom: any;

  constructor(props) {
    super(props);
    this.unsubscribeSetupEvents = [];
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        (change.updateHubConfig) ||
        (change.updateStoneConfig) ||
        (change.stoneUsageUpdated && change.stoneUsageUpdated.sphereIds[this.props.sphereId]) ||
        (change.changeSphereState && change.changeSphereState.sphereIds[this.props.sphereId]) ||
        (change.stoneLocationUpdated && change.stoneLocationUpdated.sphereIds[this.props.sphereId]) ||
        (change.changeStones) ||
        (change.changeHubs)
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

  _renderer(item, index, id) {
    if (item.type === 'stone') {
      return (
        <View key={id + '_entry'}>
          <DeviceEntryBasic
            stoneId={id}
            sphereId={this.props.sphereId}
            callback={() => {
              OverlayUtil.callRoomSelectionOverlayForStonePlacement(this.props.sphereId, id);
            }}
          />
        </View>
      );
    }
    else if (item.type === 'hub') {
      return (
        <View key={id + '_entry'}>
          <HubEntryBasic
            hubId={id}
            sphereId={this.props.sphereId}
            callback={() => {
              OverlayUtil.callRoomSelectionOverlayForHubPlacement(this.props.sphereId, id);
            }}
          />
        </View>
      );
    }
  }

  _getItemList(stones, hubs) {
    let items = [];
    let ids = [];

    for (let [stoneId, stone] of Object.entries<StoneData>(stones)) {
      ids.push(stoneId);
      items.push({type: 'stone', data: stone});
    }
    for (let [hubId, hub] of Object.entries<HubData>(hubs)) {
      ids.push(hubId);
      items.push({type: 'hub', data: hub});
    }

    return { items, ids };
  }



  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }

    let stones = DataUtil.getStonesInLocation(state, this.props.sphereId, null);
    let hubs   = DataUtil.getHubsInLocation(  state, this.props.sphereId, null);

    // if we're the only crownstone and in the floating crownstones overview, assume we're always present.
    let { items, ids } = this._getItemList(stones, hubs);
    let viewHeight = screenHeight - tabBarHeight - topBarHeight - 100;

    return (
      <Background image={background.light} hideNotifications={true}>
        <RoomBanner
          noCrownstones={ids.length === 0}
          amountOfStonesInRoom={ids.length}
          hideRight={true}
          floatingCrownstones={true}
          viewingRemotely={false}
          overlayText={ lang("Place_your_Crownstones_in_")}
        />
        <RoomExplanation
          state={state}
          explanation={ lang("Tap_a_Crownstone_and_selec")}
          sphereId={this.props.sphereId}
          locationId={null}
        />
        <ScrollView>
          <View style={{width:screenWidth}}>
            <SeparatedItemList
              items={items}
              ids={ids}
              separatorIndent={false}
              renderer={this._renderer.bind(this)}
            />
          </View>
        </ScrollView>
      </Background>
    );
  }
}