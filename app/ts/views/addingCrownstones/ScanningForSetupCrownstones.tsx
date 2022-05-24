
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ScanningForSetupCrownstones", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ActivityIndicator,
  ScrollView, Text, TouchableOpacity,
  View} from "react-native";
import { background, colors, screenWidth, styles } from "../styles";
import { core } from "../../Core";
import { SetupStateHandler } from "../../native/setup/SetupStateHandler";
import { SetupDeviceEntry } from "../components/deviceEntries/SetupDeviceEntry";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { SeparatedItemList } from "../components/SeparatedItemList";
import { Background } from "../components/Background";
import { FadeIn} from "../components/animated/FadeInView";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { SlideFadeInView } from "../components/animated/SlideFadeInView";
import { BleUtil } from "../../util/BleUtil";
import KeepAwake from 'react-native-keep-awake';
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { ScanningForSetupCrownstonesBanner } from "../components/animated/ScanningForSetupCrownstonesBanner";
import { TopBarUtil } from "../../util/TopBarUtil";
import { ViewStateWatcher } from "../components/ViewStateWatcher";
import { LiveComponent } from "../LiveComponent";
import { STONE_TYPES } from "../../Enums";
import { BackButtonHandler } from "../../backgroundProcesses/BackButtonHandler";

export class ScanningForSetupCrownstones extends LiveComponent<{
  sphereId: string,
  componentId: string,
  hub: boolean
}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  props.hub ? lang("Add_a_hub") : lang("Add_Crownstones"), closeModal: true});
  }

  nothingYetTimeout;
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
      showNothingYet: false,
      showNoScans: false,
      extendedNoScans: false,
      showNearUnverified: false,
      showVerifiedUnowned: false,
      verifiedUnownedSphereId: null,
      hubVisible: false,
      showHubsRegardless: false,
    };
  }

  componentDidMount() {
    this.setupEvents.push(core.eventBus.on("setupStoneChange",     () => { this.setState({showNothingYet: false}) }));
    this.setupEvents.push(core.eventBus.on("noSetupStonesVisible", () => { this._startNothingYetTimeout() }));
    this._startNothingYetTimeout();

    BackButtonHandler.override(this.props.componentId, () => { NavigationUtil.dismissModal(); })
  }

  _startActiveScanning() {
    BleUtil.startHighFrequencyScanning("ScanningForSetupCrownstones", true);
    clearTimeout(this.noScansAtAllTimeout);
    clearTimeout(this.nearUnknownCrownstoneTimeout);

    const postponeNoScansTimeout = () => {
      clearTimeout(this.noScansAtAllTimeout);
      clearTimeout(this.extendedNoScansAtAllTimeout);
      if (this.state.showNoScans)     { this.setState({showNoScans: false}); }
      if (this.state.extendedNoScans) { this.setState({extendedNoScans: false}); }

      this.noScansAtAllTimeout         = setTimeout(() => { this.setState({showNoScans: true})}, 12000);
      this.extendedNoScansAtAllTimeout = setTimeout(() => { this.setState({extendedNoScans: true})}, 25000);
    };

    postponeNoScansTimeout();

    // can I scan at all?
    this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.crownstoneAdvertisementReceived, (handle) => { postponeNoScansTimeout(); }));

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
    }));


    this.nativeEvents.push(core.nativeBus.on(core.nativeBus.topics.advertisement, (data : crownstoneAdvertisement) => {
      postponeNoScansTimeout();
      // near to one I own?
      if (data.isInDFUMode === true || data.serviceData.setupMode === true) { return; }

      if (MapProvider.stoneHandleMap[data.handle] === undefined) {
        this.nearUnknownCrownstoneHandle = data.handle;
        if (this.state.showVerifiedUnowned === false) {
          this.setState({ showVerifiedUnowned: true, verifiedUnownedSphereId: data.referenceId });
        }
      }
      else {
        if (data.handle === this.nearUnknownCrownstoneHandle) {
          if (this.state.showVerifiedUnowned === true) {
            this.setState({ showVerifiedUnowned: false })
          }
        }
      }
    }))
  }

  _stopActiveScanning() {
    BleUtil.stopHighFrequencyScanning("ScanningForSetupCrownstones");
    clearTimeout(this.noScansAtAllTimeout);
    clearTimeout(this.extendedNoScansAtAllTimeout);
    clearTimeout(this.nearUnknownCrownstoneTimeout);
    this.nativeEvents.forEach((unsub) => { unsub(); }); this.nativeEvents = [];
  }

  _startNothingYetTimeout() {
    this.nothingYetTimeout = setTimeout(() => { this.setState({showNothingYet: true })}, 6000);
  }

  componentWillUnmount() {
    this.setupEvents.forEach( (unsub) => { unsub(); });
    this.nativeEvents.forEach((unsub) => { unsub(); }); this.nativeEvents = [];
    clearTimeout(this.nothingYetTimeout);
    clearTimeout(this.noScansAtAllTimeout);
    clearTimeout(this.extendedNoScansAtAllTimeout);
    clearTimeout(this.nearUnknownCrownstoneTimeout);
    BackButtonHandler.clearOverride(this.props.componentId);
  }

  _renderer(item, index, stoneId) {
    return (
      <View key={stoneId + '_setup_entry'}>
        <FadeIn style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
          <SetupDeviceEntry
            testID={`SetupDeviceEntry${item.handle}`}
            key={stoneId + '_setup_element'}
            sphereId={this.props.sphereId}
            handle={item.handle}
            item={item}
            callback={() => {
              if (item.type === STONE_TYPES.hub) {
                NavigationUtil.navigate( "SetupHub", {sphereId: this.props.sphereId, setupItem: item});
              }
              else {
                NavigationUtil.navigate( "SetupCrownstone", {sphereId: this.props.sphereId, setupItem: item});
              }
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
        if (setupStones[setupId].type !== STONE_TYPES.hub &&  this.props.hub) { return; }
        if (setupStones[setupId].type === STONE_TYPES.hub && !this.props.hub && this.state.showHubsRegardless === false) {
          if (this.state.hubVisible === false) {
            this.setState({hubVisible: true})
          }
          return;
        }

        shownHandles[setupStones[setupId].handle] = true;
        ids.push(setupId);
        stoneArray.push({...setupStones[setupId], setupMode: true});
      });
    }

    return { stoneArray, ids };
  }


  render() {
    const { stoneArray, ids } = this._getStoneList();

    let showNearUnverified = ids.length === 0 && this.state.showVerifiedUnowned === false && this.state.showNearUnverified;
    let showNothingYet     = ids.length === 0 && this.state.showVerifiedUnowned === false && this.state.showNearUnverified === false && this.state.showNoScans === false && this.state.showNothingYet;

    let borderStyle = { borderColor: colors.black.rgba(0.2), borderBottomWidth: 1 };
    let informationStyle = {...styles.centered, width:screenWidth, height:80, backgroundColor: colors.white.rgba(0.3),...borderStyle};
    return (
      <Background hasNavBar={false} image={background.main} hideNotifications={true} testID={"ScanningForSetupCrownstones"}>
        <KeepAwake />
        <ViewStateWatcher
          componentId={this.props.componentId}
          onFocus={() => { this._startActiveScanning(); }}
          onBlur={ () => { this._stopActiveScanning();  }}
        />
        <View style={{...styles.centered, width: screenWidth, height: 100, ...borderStyle, overflow:'hidden'}}>
          <ScanningForSetupCrownstonesBanner componentId={this.props.componentId} height={100}/>
          <View style={{flex:1, }} />
          <View style={{...styles.centered, flexDirection:'row', flex:1, minHeight:40 }}>
            <View style={{flex:1}} />
            <Text style={{color: colors.csBlueDark.hex, fontSize:16, fontWeight: "bold"}}>{
              this.props.hub ? lang("Searching_for_a_hub___") : lang("Searching_for_more_Crownst",stoneArray.length > 0) }</Text>
            <View style={{width:10}} />
            <ActivityIndicator animating={true} size='large' color={colors.csBlueDark.hex} />
            <View style={{flex:1}} />
          </View>
          <SlideFadeInView visible={stoneArray.length > 0} height={30}><Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>{ lang("These_Crownstones_are_visi") }</Text></SlideFadeInView>
          <View style={{flex:1}} />
        </View>
        <ScrollView style={{position:'relative', top:-1}}>
          <SeparatedItemList
            items={stoneArray}
            ids={ids}
            separatorIndent={false}
            renderer={this._renderer.bind(this)}
          />
          <SlideFadeInView duration={300} height={80} visible={showNothingYet} style={informationStyle}>
            <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>{ lang("Nothing_yet__but_Im_still_") }</Text>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={90} visible={ids.length === 0 && this.state.showNoScans === true && this.state.extendedNoScans === false} style={{...informationStyle, height:90}}>
            <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold", textAlign:'center'}}>{ lang("I_cant_find_any_BLE_device") }</Text>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={90} visible={ids.length === 0 && this.state.showNoScans === true && this.state.extendedNoScans === true} style={{...informationStyle, height:90}}>
            <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold", textAlign:'center'}}>{ lang("I_still_cant_find_any_BLE_") }</Text>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={120} visible={showNearUnverified} style={{...styles.centered, width:screenWidth, height:120, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
            <TouchableOpacity style={{...styles.centered, width:screenWidth, height:120}} onPress={() => { NavigationUtil.launchModal( "SettingsFactoryResetStep1"); }}>
              <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>{ lang("Youre_really_close_to_a_Cr") }</Text>
            </TouchableOpacity>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={80} visible={this.state.hubVisible && !this.state.showHubsRegardless} style={informationStyle}>
            <TouchableOpacity style={informationStyle} onPress={() => { this.setState({showHubsRegardless:true}); }}>
              <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold", textAlign:'center', paddingHorizontal: 20}}>{ lang("I_see_a_hub_in_setup_mode") }</Text>
            </TouchableOpacity>
          </SlideFadeInView>
          <SlideFadeInView duration={300} height={80} visible={ids.length === 0 && this.state.showVerifiedUnowned === true} style={informationStyle}>
            <TouchableOpacity
              style={{...styles.centered, width:screenWidth, height:120, padding:10}}
              onPress={() => { NavigationUtil.navigate( "SetupCrownstone", {
                sphereId: this.props.sphereId,
                setupItem: {handle: this.nearUnknownCrownstoneHandle},
                unownedVerfiedSphereId: this.state.verifiedUnownedSphereId,
                unownedVerified: true});
              }}
            >
              <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold", textAlign:'center'}}>{ lang("_________________I_see_a_C") }</Text>
            </TouchableOpacity>
          </SlideFadeInView>
        </ScrollView>
      </Background>
    );
  }
}
