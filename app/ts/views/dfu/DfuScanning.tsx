
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuScanning", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert, Platform,
  ScrollView, Text,
  View
} from "react-native";
import {background, colors, screenWidth, statusBarHeight, styles, topBarHeight} from "../styles";
import { core } from "../../Core";
import { SeparatedItemList } from "../components/SeparatedItemList";
import { Background } from "../components/Background";
import { FadeIn } from "../components/animated/FadeInView";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import KeepAwake from 'react-native-keep-awake';
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Scheduler } from "../../logic/Scheduler";
import { DfuUtil } from "../../util/DfuUtil";
import { DfuDeviceOverviewEntry } from "../components/deviceEntries/DfuDeviceOverviewEntry";
import { ScanningForDFUCrownstonesBanner } from "../components/animated/ScanningForDFUCrownstonesBanner";
import { TopBarUtil } from "../../util/TopBarUtil";
import { ViewStateWatcher } from "../components/ViewStateWatcher";
import { LiveComponent } from "../LiveComponent";
import { SlideFadeInView } from "../components/animated/SlideFadeInView";
import { Button } from "../components/Button";
import {SettingsBackground} from "../components/SettingsBackground";

const triggerId = "ScanningForDfu";

const DFU_BATCH_RSSI_THRESHOLD = Platform.OS === 'android' ? -75 : -78;
const DFU_BATCH_LAST_SEEN_TIME = 10000; // 10 seconds

const AVAILABILITY_STATES = {
  INVISIBLE:    "INVISIBLE",
  NOT_IN_RANGE: "NOT_IN_RANGE",
  IN_RANGE:     "IN_RANGE",
}

export class DfuScanning extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Looking_for_Crownstones"), next: true});
  }

  nativeEvents     = [];
  stoneIdsToUpdate = [];

  stateMap         = {};
  scannedStones    = {};
  scanningIsActive = false;

  stoneUpdateData;
  unsubscribeStoreEvents;

  constructor(props) {
    super(props);

    this.stoneUpdateData = DfuUtil.getUpdatableStones(this.props.sphereId);
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'next') {
      this._goToUpdatePhase();
    }
  }

  _goToUpdatePhase() {
    if (this.stoneIdsToUpdate.length === 0) {
      Alert.alert(
        lang("_No_Crownstones_in_range__header"),
        lang("_No_Crownstones_in_range__body"),
        [{text:lang("_No_Crownstones_in_range__left")}])
    }
    else {
      NavigationUtil.navigate( "DfuBatch", {sphereId: this.props.sphereId, stoneIdsToUpdate: this.stoneIdsToUpdate})
    }
  }

  componentDidMount() {
    this.startScanning();
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        (change.updateStoneConfig && change.updateStoneConfig.sphereIds[this.props.sphereId]) ||
        (change.changeStones      && change.changeStones.sphereIds[this.props.sphereId])
      ) {
        this.stoneUpdateData = DfuUtil.getUpdatableStones(this.props.sphereId);
        this.forceUpdate();
        return;
      }
    });

  }

  componentWillUnmount() {
    this.stopScanning();
    this.unsubscribeStoreEvents();
  }

  startScanning() {
    if (this.scanningIsActive === false) {
      this.scanningIsActive = true;

      this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement, (data) => { this._parseIBeacon(data); }));
      this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.dfuAdvertisement,     (data) => { this._parseAdvertisement(data); }));
      this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.advertisement,        (data) => { this._parseAdvertisement(data); }));
      this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.setupAdvertisement,   (data) => { this._parseAdvertisement(data); }));
      Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds : 1});
      Scheduler.loadCallback(triggerId, () => { this.forceUpdate(); })
    }
  }

  stopScanning() {
    if (this.scanningIsActive === true) {
      this.scanningIsActive = false;

      this.nativeEvents.forEach((unsub) => { unsub(); });
      this.nativeEvents = [];
      this.scannedStones = {};

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
      if (rssi >= 0 || rssi < -100) { return }

      if (this.scannedStones[stoneId] === undefined) {
        this.scannedStones[stoneId] = {updatedAt: null, rssi: rssi};
      }
      let factor = 0.2;
      this.scannedStones[stoneId].rssi = factor*rssi + (1-factor) * this.scannedStones[stoneId].rssi;
      this.scannedStones[stoneId].updatedAt = Date.now();
    }
  }


  _shouldStoneBeVisibleBasedOnLastSeen(stoneId) {
    return this.scannedStones[stoneId] && (Date.now() - this.scannedStones[stoneId].updatedAt < 10000) || false;
  }


  _renderer(item, index, stoneId) {
    let visible = this.stateMap[stoneId] == AVAILABILITY_STATES.IN_RANGE || this.stateMap[stoneId] == AVAILABILITY_STATES.NOT_IN_RANGE;
    let backgroundColor = colors.white.rgba(0.5);
    let iconColor = colors.black.hex;
    let closeEnough = false;
    let maxOpacity = 0.5;

    if (visible) {
      if (this.stateMap[stoneId] == AVAILABILITY_STATES.IN_RANGE) {
        backgroundColor = colors.green.rgba(0.6);
        iconColor = colors.black.hex;
        closeEnough = true;
        maxOpacity = 1;
      }
      else {
        backgroundColor = colors.white.rgba(0.4);
        iconColor = colors.black.hex;
        maxOpacity = 0.75;
      }
    }

    return (
      <FadeIn key={stoneId + '_DFU_entry'} style={{width: screenWidth}} maxOpacity={maxOpacity}>
        <DfuDeviceOverviewEntry
          sphereId={this.props.sphereId}
          stoneId={stoneId}
          iconColor={iconColor}
          backgroundColor={backgroundColor}
          visible={visible}
          closeEnough={closeEnough}
        />
      </FadeIn>
    );
  }

   _getStoneList() {
    let stoneArray = [];
    let idArray = [];

    // there are 3 tiers:
    // - invisible (not seen)
    // - visible, but not in range in the last DFU_BATCH_LAST_SEEN_TIME seconds
    // - visible and in range.

    // all Crownstone ids that require updates.
    let ids = Object.keys(this.stoneUpdateData.stones);
    for (let i = 0; i < ids.length; i++) {
      let stoneId = ids[i];

      // all will be drawn
      let visible = this._shouldStoneBeVisibleBasedOnLastSeen(stoneId);
      if (visible) {
        if (this.scannedStones[stoneId].rssi > DFU_BATCH_RSSI_THRESHOLD) {
          // this crownstone is within range to update!
          this.stateMap[stoneId] = AVAILABILITY_STATES.IN_RANGE;
          this.stoneIdsToUpdate.push(stoneId);
        }
        else {
          // visible but not in range
          this.stateMap[stoneId] = AVAILABILITY_STATES.NOT_IN_RANGE;
        }
      }
      else {
        // not visible yet!
        this.stateMap[stoneId] = AVAILABILITY_STATES.INVISIBLE;
      }
      this.stoneIdsToUpdate.push(stoneId);
    }
    // construct the list in order of availability.
    for (let i = 0; i < ids.length; i++) {
      let stoneId = ids[i];
      if (this.stateMap[stoneId] == AVAILABILITY_STATES.IN_RANGE) {
        stoneArray.push(this.stoneUpdateData.stones[stoneId]);
        idArray.push(stoneId);
      }
    }
    for (let i = 0; i < ids.length; i++) {
      let stoneId = ids[i];
      if (this.stateMap[stoneId] == AVAILABILITY_STATES.NOT_IN_RANGE) {
        stoneArray.push(this.stoneUpdateData.stones[stoneId]);
        idArray.push(stoneId);
      }
    }
    for (let i = 0; i < ids.length; i++) {
      let stoneId = ids[i];
      if (this.stateMap[stoneId] == AVAILABILITY_STATES.INVISIBLE) {
        stoneArray.push(this.stoneUpdateData.stones[stoneId]);
        idArray.push(stoneId);
      }
     }

     return { stoneArray, ids: idArray };
  }



  render() {
    this.stateMap    = {};
    this.stoneIdsToUpdate = [];
    const { stoneArray, ids } = this._getStoneList();
    let borderStyle = { borderColor: colors.black.rgba(0.2), borderBottomWidth: 1 };


    return (
      <Background fullScreen={true} image={background.main}>
        <View style={{height: topBarHeight}} />
        <ViewStateWatcher componentId={this.props.componentId} onFocus={() => {  this.startScanning(); setTimeout(() => { KeepAwake.activate();  },300); }} onBlur={ () => { this.stopScanning();  KeepAwake.deactivate(); }} />
        <View style={{...styles.centered, width:screenWidth, height:80, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
          <Text style={{color: colors.black.hex, fontSize:14, fontWeight: "bold", width:screenWidth - 30, textAlign:'center'}}>{ lang("Crownstones_turn_green_onc") }</Text>
        </View>
        <ScrollView contentContainerStyle={{paddingTop:10}}>
          { stoneArray.map((item, index) => { return this._renderer(item, index, ids[index])}) }
        </ScrollView>
        <SlideFadeInView visible={this.stoneIdsToUpdate.length > 0} height={100} style={{ position: 'absolute', bottom: 0, width: screenWidth, overflow:"hidden", ...styles.centered}}>
          <View style={{shadowColor: colors.black.hex, shadowOpacity:0.9, shadowRadius: 5, shadowOffset:{width:0, height:2} }}>
            <Button
              iconPosition={'right'}
              icon={'ios-play'}
              backgroundColor={colors.blue.hex}
              iconColor={colors.blueDark.hex}
              label={lang("Lets_update_")}
              fontSize={17}
              iconSize={14}
              callback={() => { this._goToUpdatePhase(); }} />
          </View>
          <View style={{height:10}} />
        </SlideFadeInView>
      </Background>
    );
  }
}

