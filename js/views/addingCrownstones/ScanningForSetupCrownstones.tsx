import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform, ScrollView, StatusBar,
  Text, TextStyle, TouchableOpacity,
  View, ViewStyle
} from "react-native";
import { Pagination } from 'react-native-snap-carousel';
import { colors, screenHeight, screenWidth, styles, tabBarHeight, topBarHeight } from "../styles";
import { core } from "../../core";
import { SetupStateHandler } from "../../native/setup/SetupStateHandler";
import { SetupDeviceEntry } from "../components/deviceEntries/SetupDeviceEntry";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { SeparatedItemList } from "../components/SeparatedItemList";
import { Background } from "../components/Background";
import { FadeIn, FadeInView, HiddenFadeInView } from "../components/animated/FadeInView";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Icon } from "../components/Icon";
import { TopbarBackButton } from "../components/topbar/TopbarButton";
import { SlideFadeInView } from "../components/animated/SlideFadeInView";
import { BleUtil } from "../../util/BleUtil";
import { NavigationEvents } from "react-navigation";
import KeepAwake from 'react-native-keep-awake';
import { MapProvider } from "../../backgroundProcesses/MapProvider";

export class ScanningForSetupCrownstones extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: "Add Crownstones",
      headerLeft: <TopbarBackButton text={"Back"} onPress={() => { params.returnToRoute ? NavigationUtil.backTo(params.returnToRoute) : NavigationUtil.back() }} />
    }
  };


  nothingYetTimeout;
  iconTimeout;
  noScansAtAllTimeout;
  extendedNoScansAtAllTimeout;
  nearestUnverifiedData;
  nearUnknownCrownstoneTimeout;
  nearUnknownCrownstoneHandle;

  setupEvents = [];
  nativeEvents = [];
  constructor(props) {
    super(props);

    this.state = {
      icon1Visible:  Math.random() < 0.5,
      icon2Visible:  Math.random() < 0.5,
      icon3Visible:  Math.random() < 0.5,
      headerColor:  0,
      showNothingYet: false,
      showNoScans: false,
      extendedNoScans: false,
      showNearUnverified: false,
      showVerifiedUnowned: false,
    };
  }

  componentDidMount() {
    this.setupEvents.push(core.eventBus.on("setupStoneChange", () => { this.setState({showNothingYet: false}) }));
    this.setupEvents.push(core.eventBus.on("noSetupStonesVisible", () => { this._startNothingYetTimeout() }));
    this._startNothingYetTimeout();
    this._cycleIcons();
  }

  _startActiveScanning() {
    BleUtil.startHighFrequencyScanning("ScanningForSetupCrownstones", true)
    clearTimeout(this.noScansAtAllTimeout);
    clearTimeout(this.nearUnknownCrownstoneTimeout);

    const postponeNoScansTimeout = () => {
      clearTimeout(this.noScansAtAllTimeout);
      clearTimeout(this.extendedNoScansAtAllTimeout);
      if (this.state.showNoScans)     { this.setState({showNoScans: false}); }
      if (this.state.extendedNoScans) { this.setState({extendedNoScans: false}); }

      this.noScansAtAllTimeout         = setTimeout(() => { this.setState({showNoScans: true})}, 12000);
      this.extendedNoScansAtAllTimeout = setTimeout(() => { this.setState({extendedNoScans: true})}, 25000);
    }

    postponeNoScansTimeout();

    // can I scan at all?
    this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.crownstoneAdvertisementReceived, (handle) => { postponeNoScansTimeout(); }))

    this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.unverifiedAdvertisementData, (data) => {
      // near to a Crownstone that does not belong to me?
      postponeNoScansTimeout();

      // if there are setup crownstones, we dont want to see this message.
      if (SetupStateHandler.areSetupStonesAvailable() === false) {
        if (this.state.showNearUnverified) { this.setState({showNearUnverified: false}); }
        clearTimeout(this.nearUnknownCrownstoneTimeout);
        return;
      }

      if (data.rssi > -50) {
        this.nearestUnverifiedData = {handle: data.handle, rssi: data.rssi};
        this.nearUnknownCrownstoneTimeout = setTimeout(() => { this.setState({showNearUnverified: true});}, 10000);
      }

      if (this.nearestUnverifiedData && this.nearestUnverifiedData.handle === data.handle && data.rssi < -50) {
        if (this.state.showNearUnverified) { this.setState({showNearUnverified: false}); }
        clearTimeout(this.nearUnknownCrownstoneTimeout);
      }
    }))


    this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.advertisement, (data : crownstoneAdvertisement) => {
      postponeNoScansTimeout();
      // near to one I own?
      if (data.isInDFUMode === true || data.serviceData.setupMode === true) { return; }

      if (MapProvider.stoneSphereHandleMap[data.handle] === undefined) {
        this.nearUnknownCrownstoneHandle = data.handle;
        this.setState({showVerifiedUnowned: true});
      }
      else {
        if (data.handle === this.nearUnknownCrownstoneHandle) {
          this.setState({showVerifiedUnowned: false})
        }
      }
    }))
  }

  _stopActiveScanning() {
    BleUtil.stopHighFrequencyScanning("ScanningForSetupCrownstones")
    clearTimeout(this.noScansAtAllTimeout);
    clearTimeout(this.extendedNoScansAtAllTimeout);
    clearTimeout(this.nearUnknownCrownstoneTimeout);
    this.nativeEvents.forEach((unsub) => { unsub(); }); this.nativeEvents = [];
  }

  _startNothingYetTimeout() {
    this.nothingYetTimeout = setTimeout(() => { this.setState({showNothingYet: true })}, 6000);
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
    clearTimeout(this.nothingYetTimeout);
    clearTimeout(this.iconTimeout);
    clearTimeout(this.noScansAtAllTimeout);
    clearTimeout(this.extendedNoScansAtAllTimeout);
    clearTimeout(this.nearUnknownCrownstoneTimeout);
  }

  _renderer(item, index, stoneId) {
    return (
      <View key={stoneId + '_setup_entry'}>
        <FadeIn style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
          <SetupDeviceEntry
            key={stoneId + '_setup_element'}
            sphereId={this.props.sphereId}
            handle={item.handle}
            item={item}
            callback={() => {
              NavigationUtil.navigate("SetupCrownstone", {sphereId: this.props.sphereId, setupStone: item});
            }}
          />
        </FadeIn>
      </View>
    );
  }

  _getStoneList() {
    let stoneArray = [];
    let ids = [];
    let shownHandles = {};

    if (SetupStateHandler.areSetupStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
      let setupStones = SetupStateHandler.getSetupStones();
      let setupIds = Object.keys(setupStones);

      setupIds.forEach((setupId) => {
        shownHandles[setupStones[setupId].handle] = true;
        ids.push(setupId);
        setupStones[setupId].setupMode = true;
        stoneArray.push(setupStones[setupId]);
      });
    }

    return { stoneArray, ids };
  }


  render() {
    const { stoneArray, ids } = this._getStoneList();

    let showNearUnverified = ids.length === 0 && this.state.showVerifiedUnowned === false && this.state.showNearUnverified;
    let showNothingYet = ids.length === 0 && this.state.showVerifiedUnowned === false && this.state.showNearUnverified === false && this.state.showNoScans === false && this.state.showNothingYet;

    let borderStyle = { borderColor: colors.black.rgba(0.2), borderBottomWidth: 1 };
    return (
      <Background hasNavBar={false} image={core.background.light}>
        <KeepAwake />
        <NavigationEvents
          onWillFocus={() => { this._startActiveScanning(); }}
          onWillBlur={ () => { this._stopActiveScanning();  }}
        />
        <View style={{...styles.centered, width: screenWidth, height: 100, ...borderStyle, overflow:'hidden'}}>
          <FadeInView duration={600} visible={this.state.headerColor < 2}   style={{position:'absolute', top:0, left:0, backgroundColor: colors.green.rgba(0.7),   width: screenWidth, height: 100}} />
          <FadeInView duration={600} visible={this.state.headerColor >= 2}  style={{position:'absolute', top:0, left:0, backgroundColor: colors.iosBlue.rgba(0.3), width: screenWidth, height: 100}} />
          <FadeInView duration={600} visible={this.state.icon1Visible} style={{position:'absolute', top:-25, left:105}}><Icon name="c2-pluginFront" size={100} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <FadeInView duration={600} visible={this.state.icon2Visible} style={{position:'absolute', top:25,  left:175}}><Icon name="c2-pluginFront" size={100} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <FadeInView duration={600} visible={this.state.icon3Visible} style={{position:'absolute', top:-32, left:-30}}><Icon name="c2-pluginFront" size={160} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <View style={{flex:1, }} />
          <View style={{...styles.centered, flexDirection:'row', flex:1, minHeight:40 }}>
            <View style={{flex:1}} />
            <Text style={{color: colors.csBlueDark.hex, fontSize:16, fontWeight: "bold"}}>{stoneArray.length > 0 ? "Searching for more Crownstones..." : "Searching for new Crownstones..."}</Text>
            <View style={{flex:1}} />
            <ActivityIndicator animating={true} size='large' color={colors.csBlueDark.hex} />
            <View style={{flex:1}} />
          </View>
          <SlideFadeInView visible={stoneArray.length > 0} height={30}><Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>These Crownstones are visible near you:</Text></SlideFadeInView>
          <View style={{flex:1}} />
        </View>
        <ScrollView style={{position:'relative', top:-1}}>
          <SeparatedItemList
            items={stoneArray}
            ids={ids}
            separatorIndent={false}
            renderer={this._renderer.bind(this)}
          />
          <SlideFadeInView duration={300} height={80} visible={showNothingYet} style={{...styles.centered, width:screenWidth, height:80, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
            <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>Nothing yet, but I'm still looking!</Text>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={90} visible={ids.length === 0 && this.state.showNoScans === true && this.state.extendedNoScans === false} style={{...styles.centered, width:screenWidth, height:90, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
            <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold", textAlign:'center'}}>{"I can't find any BLE devices...\n\nMake sure you're in range of the Crownstone!"}</Text>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={90} visible={ids.length === 0 && this.state.showNoScans === true && this.state.extendedNoScans === true} style={{...styles.centered, width:screenWidth, height:90, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
            <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold", textAlign:'center'}}>{"I still can't find any BLE devices...\n\nMaybe reset your phone's Bluetooth?"}</Text>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={120} visible={showNearUnverified} style={{...styles.centered, width:screenWidth, height:120, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
            <TouchableOpacity style={{...styles.centered, width:screenWidth, height:120}} onPress={() => { NavigationUtil.navigate("SettingsFactoryResetStep1"); }}>
              <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>You're really close to a Crownstone that is not in your Sphere, nor in setup mode. Would you like to try to recover it?</Text>
            </TouchableOpacity>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={80} visible={ids.length === 0 && this.state.showVerifiedUnowned === true} style={{...styles.centered, width:screenWidth, height:80, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
            <TouchableOpacity
              style={{...styles.centered, width:screenWidth, height:120}}
              onPress={() => { NavigationUtil.navigate("SetupCrownstone", {sphereId: this.props.sphereId, setupStone: {handle: this.nearUnknownCrownstoneHandle}, unownedVerified: true}); }}
            >
              <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>
                I see a Crownstone that seems to be registered to your Sphere but I don't know which one it is... Shall I add it to your app?
              </Text>
            </TouchableOpacity>
          </SlideFadeInView>
        </ScrollView>
      </Background>
    );
  }
}
