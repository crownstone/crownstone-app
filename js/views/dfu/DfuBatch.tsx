
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ScanningForDfu", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  ScrollView, Text, TouchableOpacity,
  View} from "react-native";
import { Pagination } from 'react-native-snap-carousel';
import { colors, screenWidth, styles} from "../styles";
import { core } from "../../core";
import { SetupStateHandler } from "../../native/setup/SetupStateHandler";
import { SetupDeviceEntry } from "../components/deviceEntries/SetupDeviceEntry";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { SeparatedItemList } from "../components/SeparatedItemList";
import { Background } from "../components/Background";
import { FadeIn, FadeInView, HiddenFadeInView } from "../components/animated/FadeInView";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Icon } from "../components/Icon";
import { TopbarBackButton, TopbarButton } from "../components/topbar/TopbarButton";
import { SlideFadeInView } from "../components/animated/SlideFadeInView";
import { BleUtil } from "../../util/BleUtil";
import { NavigationEvents } from "react-navigation";
import KeepAwake from 'react-native-keep-awake';
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Scheduler } from "../../logic/Scheduler";
import { DfuUtil } from "../../util/DfuUtil";
import { DfuDeviceEntry } from "../components/deviceEntries/DfuDeviceEntry";
import { DeviceEntryBasic } from "../components/deviceEntries/DeviceEntryBasic";
import { DfuDeviceOverviewEntry } from "../components/deviceEntries/DfuDeviceOverviewEntry";


export class DfuBatch extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: lang("Looking_for_Crownstones"),
      headerLeft: <TopbarBackButton text={ lang("Back")} onPress={() => { params.returnToRoute ? NavigationUtil.backTo(params.returnToRoute) : NavigationUtil.back() }} />,
      headerRight: <TopbarButton text={ lang("Next")} onPress={() => { params.onRight(); }} />
    }
  };

  iconTimeout
  setupEvents = [];
  nativeEvents = [];
  visibleDrawnStones = [];
  stoneUpdateData;
  visibleStones;
  sphereId;
  constructor(props) {
    super(props);

    this.state = {
      icon1Visible:  Math.random() < 0.5,
      icon2Visible:  Math.random() < 0.5,
      icon3Visible:  Math.random() < 0.5,
      headerColor:  0,
    };

    this.visibleStones = {};

    let state = core.store.getState();

    this.sphereId        = props.sphereId || Object.keys(state.spheres)[0];
    this.stoneUpdateData = DfuUtil.getUpdatableStones(this.sphereId);
    this.props.navigation.setParams({onRight: () => { this.next() }});

    this.visibleDrawnStones = [];
  }

  componentDidMount() {
  }

  next() {
    NavigationUtil.navigate("DfuBatch", {sphereId: this.props.sphereId, stoneIdsToUpdates: this.visibleDrawnStones})
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
      if (this.visibleStones[stoneId] === undefined) {
        this.visibleStones[stoneId] = {updatedAt: null, rssi: rssi || -90};
      }
      let factor = 0.1;
      this.visibleStones[stoneId].rssi = factor*(rssi || -90) + (1-factor)*this.visibleStones[stoneId].rssi;
      this.visibleStones[stoneId].updatedAt = new Date().valueOf();
    }
  }

  _cycleIcons() {
    let toggleIndex = Math.ceil(Math.random()*3);
    switch(toggleIndex) {
      case 1:
        this.setState({icon1Visible: !this.state.icon1Visible, headerColor: (this.state.headerColor + 1) % 4}); break;
      case 2:
        this.setState({icon2Visible: !this.state.icon2Visible, headerColor: (this.state.headerColor + 1) % 4}); break;
      case 3:
        this.setState({icon3Visible: !this.state.icon3Visible, headerColor: (this.state.headerColor + 1) % 4}); break;
    }
    this.iconTimeout = setTimeout(() => { this._cycleIcons()}, 600);
  }

  componentWillUnmount() {
    this.setupEvents.forEach( (unsub) => { unsub(); });
    this.nativeEvents.forEach((unsub) => { unsub(); }); this.nativeEvents = [];
    clearTimeout(this.iconTimeout);
  }



  _renderer(item, index, stoneId) {
    let visible = this.visibleStones[stoneId] && (this.visibleStones[stoneId].updatedAt - new Date().valueOf() < 10000) || false || Math.random() < 0.4;
    let backgroundColor = colors.lightGray.rgba(0.6);
    let iconColor = colors.black.rgba(0.4);
    let closeEnough = false;

    if (visible) {
      if (this.visibleStones[stoneId] && this.visibleStones[stoneId].rssi > -90 || Math.random() < 0.4) {
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
            key={stoneId + '_DFU_entry'}
            sphereId={this.sphereId}
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
      let visible = this.visibleStones[id] && (this.visibleStones[id].updatedAt - new Date().valueOf() < 10000) || false;
      if (visible) {
        if (this.visibleStones[id].rssi > -90) {
          stoneArray.push(this.stoneUpdateData.stones[id]);
          idArray.push(id);
          this.visibleDrawnStones.push(id);
        }
      }
    });


    ids.forEach((id) => {
      let visible = this.visibleStones[id] && (this.visibleStones[id].updatedAt - new Date().valueOf() < 10000) || false;
      if (visible) {
        if (this.visibleStones[id].rssi <= -90) {
          stoneArray.push(this.stoneUpdateData.stones[id]);
          idArray.push(id);
        }
      }
    });


    ids.forEach((id) => {
      let visible = this.visibleStones[id] && (this.visibleStones[id].updatedAt - new Date().valueOf() < 10000) || false;
      if (!visible) {
        stoneArray.push(this.stoneUpdateData.stones[id]);
        idArray.push(id);
      }
    });


    return { stoneArray, ids };
  }


  render() {
    const { stoneArray, ids } = this._getStoneList();

    let borderStyle = { borderColor: colors.black.rgba(0.2), borderBottomWidth: 1 };
    return (
      <Background hasNavBar={false} image={core.background.light}>
        <KeepAwake />
        <NavigationEvents
          onWillFocus={() => {  }}
          onWillBlur={ () => {  }}
        />
        <View style={{...styles.centered, width: screenWidth, height: 110, ...borderStyle, overflow:'hidden'}}>
          <FadeInView duration={600} visible={this.state.headerColor < 2}   style={{position:'absolute', top:0, left:0, backgroundColor: colors.darkPurple.rgba(0.25),   width: screenWidth, height: 110}} />
          <FadeInView duration={600} visible={this.state.headerColor >= 2}  style={{position:'absolute', top:0, left:0, backgroundColor: colors.iosBlue.rgba(0.4),  width: screenWidth, height: 110}} />
          <FadeInView duration={600} visible={this.state.icon1Visible} style={{position:'absolute', top:-15, left:125}}><Icon name="c2-pluginFront" size={110} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <FadeInView duration={600} visible={this.state.icon2Visible} style={{position:'absolute', top:35,  left:210}}><Icon name="c2-pluginFront" size={120} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <FadeInView duration={600} visible={this.state.icon3Visible} style={{position:'absolute', top:-32, left:-30}}><Icon name="c2-pluginFront" size={175} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <View style={{...styles.centered, flexDirection:'row', flex:1, height: 110}}>
            <View style={{flex:1}} />
            <Text style={{color: colors.black.hex, fontSize:16, fontWeight: "bold", width:screenWidth - 30, textAlign:'center'}}>{"Collecting nearby Crownstones to update...\n\nTap next to continue!"}</Text>
            <View style={{flex:1}} />
          </View>
        </View>
        <View style={{...styles.centered, width:screenWidth, height:80, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
          <Text style={{color: colors.black.hex, fontSize:14, fontWeight: "bold", width:screenWidth - 30, textAlign:'center'}}>{ "Crownstones turn green once you're near enough. These will be updated in the next step. You can do this multiple times to get all of them!" }</Text>
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

