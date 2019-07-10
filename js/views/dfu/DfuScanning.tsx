
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuScanning", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator, Alert,
  ScrollView, Text, TouchableOpacity,
  View
} from "react-native";
import { Pagination } from 'react-native-snap-carousel';
import { colors, screenWidth, styles} from "../styles";
import { core } from "../../core";
import { SeparatedItemList } from "../components/SeparatedItemList";
import { Background } from "../components/Background";
import { FadeIn, FadeInView, HiddenFadeInView } from "../components/animated/FadeInView";
import { NavigationUtil } from "../../util/NavigationUtil";
import KeepAwake from 'react-native-keep-awake';
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Scheduler } from "../../logic/Scheduler";
import { DfuUtil } from "../../util/DfuUtil";
import { DfuDeviceOverviewEntry } from "../components/deviceEntries/DfuDeviceOverviewEntry";
import { ScanningForDFUCrownstonesBanner } from "../components/animated/ScanningForDFUCrownstonesBanner";
import { TopBarUtil } from "../../util/TopBarUtil";
import { ViewStateWatcher } from "../components/ViewStateWatcher";
import { LOGe } from "../../logging/Log";
import { LiveComponent } from "../LiveComponent";

const triggerId = "ScanningForDfu";

const DFU_BATCH_RSSI_THRESHOLD = -85;

export class DfuScanning extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Looking_for_Crownstones"), next: true});
  }

  nativeEvents = [];
  visibleDrawnStones = [];
  stoneUpdateData;
  visibleStones;
  scanningIsActive = false;

  constructor(props) {
    super(props);

    this.visibleStones = {};

    this.stoneUpdateData = DfuUtil.getUpdatableStones(this.props.sphereId);
    this.visibleDrawnStones = [];
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'next') {
      if (this.visibleDrawnStones.length === 0) {
        Alert.alert(
          lang("_No_Crownstones_in_range__header"),
          lang("_No_Crownstones_in_range__body"),
          [{text:lang("_No_Crownstones_in_range__left")}])
      }
      else {
        NavigationUtil.navigate( "DfuBatch", {sphereId: this.props.sphereId, stoneIdsToUpdate: this.visibleDrawnStones})
      }
    }
  }

  componentDidMount() {
    this.startScanning();
  }

  componentWillUnmount() {
    this.stopScanning();
  }

  startScanning() {
    if (this.scanningIsActive === false) {
      this.scanningIsActive = true;

      this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement, (data) => { this._parseIBeacon(data); }));
      this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.dfuAdvertisement, (data) => { this._parseAdvertisement(data); }));
      this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.advertisement, (data) => { this._parseAdvertisement(data); }));
      Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds : 1});
      Scheduler.loadCallback(triggerId, () => { this.forceUpdate(); })
    }
  }

  stopScanning() {
    if (this.scanningIsActive === true) {
      this.scanningIsActive = false;

      this.nativeEvents.forEach((unsub) => { unsub(); });
      this.nativeEvents = [];
      this.visibleDrawnStones = [];
      this.visibleStones = {};

      Scheduler.removeTrigger(triggerId);
    }
  }


  _parseIBeacon(data : ibeaconPackage[]) {
    data.forEach((ibeacon) => {
      let ibeaconString = (ibeacon.uuid + '_' + ibeacon.major + '_' + ibeacon.minor).toLowerCase();
      if (MapProvider.stoneIBeaconMap[ibeaconString] !== undefined) {
        this._updateList(MapProvider.stoneIBeaconMap[ibeaconString], ibeacon.rssi);
      }
    })
  }

  _parseAdvertisement(data : crownstoneAdvertisement | crownstoneBaseAdvertisement) {
    let state = core.store.getState()
    let sphereId = this.props.sphereId || Object.keys(state.spheres)[0];
    if (MapProvider.stoneSphereHandleMap[sphereId][data.handle] !== undefined) {
      this._updateList(MapProvider.stoneSphereHandleMap[sphereId][data.handle], data.rssi);
    }
  }

  _updateList(stoneMap: StoneMap, rssi) {
    let stoneId = stoneMap.id;
    if (this.stoneUpdateData.stones[stoneId] !== undefined) {
      if (rssi >= 0 || rssi < -120) { return };

      if (this.visibleStones[stoneId] === undefined) {
        this.visibleStones[stoneId] = {updatedAt: null, rssi: rssi};
      }
      let factor = 0.1;
      this.visibleStones[stoneId].rssi = factor*(rssi || DFU_BATCH_RSSI_THRESHOLD) + (1-factor)*this.visibleStones[stoneId].rssi;
      this.visibleStones[stoneId].updatedAt = new Date().valueOf();
    }
  }


  _renderer(item, index, stoneId) {
    let visible = this.visibleStones[stoneId] && (new Date().valueOf() - this.visibleStones[stoneId].updatedAt < 10000) || false;
    let backgroundColor = colors.lightGray.rgba(0.5);
    let iconColor = colors.csBlue.rgba(0.2);
    let closeEnough = false;

    if (visible) {
      if (this.visibleStones[stoneId].rssi > DFU_BATCH_RSSI_THRESHOLD) {
        backgroundColor = colors.green.rgba(0.8);
        iconColor = colors.csBlue.hex;
        closeEnough = true;
      }
      else {
        backgroundColor = colors.white.rgba(0.8);
        iconColor = colors.csBlue.hex;
      }
    }

    return (
      <View key={stoneId + '_DFU_entry'}>
        <FadeIn style={[styles.listView, {width: screenWidth, backgroundColor: backgroundColor}]}>
          <DfuDeviceOverviewEntry
            sphereId={this.props.sphereId}
            stoneId={stoneId}
            iconColor={iconColor}
            backgroundColor={backgroundColor}
            handle={item.handle}
            item={item}
            visible={visible}
            closeEnough={closeEnough}
          />
        </FadeIn>
      </View>
    );
  }

  _getStoneList() {
    this.visibleDrawnStones = [];
    let stoneArray = [];
    let idArray = [];

    let ids = Object.keys(this.stoneUpdateData.stones);
    ids.forEach((id) => {
      let visible = this.visibleStones[id] && (new Date().valueOf() - this.visibleStones[id].updatedAt < 1000) || false;
      if (visible) {
        if (this.visibleStones[id].rssi > DFU_BATCH_RSSI_THRESHOLD) {
          stoneArray.push(this.stoneUpdateData.stones[id]);
          idArray.push(id);
          this.visibleDrawnStones.push(id);
        }
      }
    });

    ids.forEach((id) => {
      let visible = this.visibleStones[id] && (new Date().valueOf() - this.visibleStones[id].updatedAt < 1000) || false;
      if (visible) {
        if (this.visibleStones[id].rssi <= DFU_BATCH_RSSI_THRESHOLD) {
          stoneArray.push(this.stoneUpdateData.stones[id]);
          idArray.push(id);
        }
      }
    });

    ids.forEach((id) => {
      let visible = this.visibleStones[id] && (new Date().valueOf() - this.visibleStones[id].updatedAt < 1000) || false;
      if (!visible) {
        stoneArray.push(this.stoneUpdateData.stones[id]);
        idArray.push(id);
      }
    });


    return { stoneArray, ids: idArray };
  }


  render() {
    const { stoneArray, ids } = this._getStoneList();

    let borderStyle = { borderColor: colors.black.rgba(0.2), borderBottomWidth: 1 };
    return (
      <Background hasNavBar={false} image={core.background.light} hideNotification={true}>
        <KeepAwake />
        <ViewStateWatcher componentId={this.props.componentId} onFocus={() => { this.startScanning(); }} onBlur={ () => { this.stopScanning(); }} />
        <View style={{...styles.centered, width: screenWidth, height: 110, ...borderStyle, overflow:'hidden'}}>
          <ScanningForDFUCrownstonesBanner height={110} componentId={this.props.componentId} />
          <View style={{...styles.centered, flexDirection:'row', flex:1, height: 110}}>
            <View style={{flex:1}} />
            <Text style={{color: colors.black.hex, fontSize:16, fontWeight: "bold", width:screenWidth - 30, textAlign:'center'}}>{ lang("Collecting_nearby_Crownsto") }</Text>
            <View style={{flex:1}} />
          </View>
        </View>
        <View style={{...styles.centered, width:screenWidth, height:80, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
          <Text style={{color: colors.black.hex, fontSize:14, fontWeight: "bold", width:screenWidth - 30, textAlign:'center'}}>{ lang("Crownstones_turn_green_onc") }</Text>
        </View>
        <ScrollView style={{position:'relative', top:-1}}>
          <SeparatedItemList
            items={stoneArray}
            ids={ids}
            separatorIndent={false}
            renderer={this._renderer.bind(this)}
          />
        </ScrollView>
      </Background>
    );
  }
}

