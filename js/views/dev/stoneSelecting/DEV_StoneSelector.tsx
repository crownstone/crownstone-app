import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import {
  RefreshControl,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  Text,
  Platform,
  TextInput, Alert
} from "react-native";
import { NativeBus } from "../../../native/libInterface/NativeBus";
import { Bluenet } from "../../../native/libInterface/Bluenet";
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { FocusManager } from "../../../backgroundProcesses/dev/FocusManager";
import { BroadcastStateManager } from "../../../backgroundProcesses/BroadcastStateManager";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Stacks } from "../../../router/Stacks";
import { SlideInView } from "../../components/animated/SlideInView";
import { availableScreenHeight, colors, screenWidth, styles } from "../../styles";
import React from "react";
import { StoneSelectorDataContainer } from "./DEV_StoneSelectorData";
import { CrownstoneEntry, FilterButton, filterState } from "./DEV_SelectionComponents";
import { DEV_SelectionFilter } from "./DEV_SelectionFilter";
import Slider from "@react-native-community/slider";
import { BackButtonHandler } from "../../../backgroundProcesses/BackButtonHandler";
import { BleUtil } from "../../../util/BleUtil";
import { AppUtil } from "../../../util/AppUtil";

let smallText : TextStyle = { fontSize:12, paddingLeft:10, paddingRight:10};


export class DEV_StoneSelector extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:"Select Crownstone", nav: {id: 'stop', text:'Pause'}, leftNav: {id:'sort', text:'Sorted'}})
  }

  unsubscribe = [];
  refreshTimeout = null;
  doUpdate = false;
  
  scanning = false;
  HFTimeout;
  trackingItems = [];
  lastRedraw = 0


  constructor(props) {
    super(props);

    this.state = {
      rssiFilter: -100,
      filterSelectorOnScreen: false,
      trackingHandles: [],
      sorting: true,
      handleFilter: "",
      showHandleFilter: false,
      HFscanning: false
    };

  }

  navigationButtonPressed({ buttonId }) {
    switch (buttonId) {
      case 'stop':
        this.stopScanning();
        break;
      case 'scan':
        this.refresh();
        this.startScanning();
        break;
      case 'sort':
        this.refresh;
        this.startScanning();
        TopBarUtil.updateOptions(this.props.componentId,{leftNav: {id: 'sort', text: this.state.sorting ? 'Unsorted' : 'Sorted'}});
        this.setState({sorting: !this.state.sorting});
        break;
    }
  }


  componentDidMount() {
    if (StoneSelectorDataContainer.started === false) {
      StoneSelectorDataContainer.started = true;
      this.startScanning();
      this.refresh();
    }
    BackButtonHandler.override('DEV_APP_MAIN', () => {
      Alert.alert(
        "You MUST kill the app, not just go back.",
        "Everything will be effed-up if you don't kill the app.",
        [{
          text: "OK. FINE!", onPress: () => {
            AppUtil.quit()
          }
        }],
        { cancelable: false });
    });
  }

  startScanning() {
    if (this.scanning === false) {
      TopBarUtil.updateOptions(this.props.componentId,{nav: {id: 'stop', text:'Pause'}});
      this.scanning = true;
      this.refresh();
      this.setRefreshTimeout();
      this.unsubscribe.push(NativeBus.on(NativeBus.topics.advertisement, (data: crownstoneAdvertisement) => {
        this.update(data, 'verified');
      }))
      this.unsubscribe.push(NativeBus.on(NativeBus.topics.unverifiedAdvertisementData, (data: crownstoneAdvertisement) => {
        this.update(data, 'unverified');
      }))
      this.unsubscribe.push(NativeBus.on(NativeBus.topics.setupAdvertisement, (data: crownstoneAdvertisement) => {
        this.update(data, 'setup');
      }))
      this.unsubscribe.push(NativeBus.on(NativeBus.topics.dfuAdvertisement, (data : crownstoneAdvertisement) => {
        this.startHFScanning();
        this.update(data, 'dfu');
      }))
    }
  }




  startHFScanning(timeoutMs = 0) {
    if (this.state.HFscanning === false) {
      this.setState({HFscanning: true});
      Bluenet.startScanningForCrownstones();
      if (timeoutMs != 0) {
        this.HFTimeout = setTimeout(() => {
          this.stopHFScanning();
        }, timeoutMs)
      }
    }
    if (timeoutMs === 0) {
      clearTimeout(this.HFTimeout);
    }
  }

  stopHFScanning() {
    if (this.state.HFscanning === true) {
      clearTimeout(this.HFTimeout);
      this.setState({HFscanning: false});
      Bluenet.startScanningForCrownstonesUniqueOnly();
    }
  }

  stopScanning() {
    TopBarUtil.updateOptions(this.props.componentId,{nav: {id: 'scan', text:'Scan'}});
    this.stopHFScanning();
    this.scanning = false;
    this.unsubscribe.forEach((unsub) => { unsub(); });
    this.unsubscribe = [];
    clearTimeout(this.refreshTimeout);
  }

  setRefreshTimeout() {
    let state = core.store.getState();

    clearTimeout(this.refreshTimeout);
    this.refreshTimeout = setTimeout(() => {
      if (this.doUpdate) {
        this.doUpdate = false;
        this.forceUpdate(() => { this.doUpdate = false; this.setRefreshTimeout() });
        return;
      }
      this.setRefreshTimeout()
    }, state.devApp.fastPhone ? 300 : 1000);
  }

  componentWillUnmount(): void {
    this.stopScanning();
    BackButtonHandler.clearOverride('DEV_APP_MAIN');
  }

  update(data : crownstoneAdvertisement, type) {
    if (type === "verified" && data.serviceData.setupMode === true) { return; }

    let newStone = false;
    if (StoneSelectorDataContainer.data[type][data.handle] === undefined) {
      newStone = true;
      StoneSelectorDataContainer.data[type][data.handle] = data;
    }


    let previousRssi = StoneSelectorDataContainer.data[type][data.handle].rssi;
    let newRssi = data.rssi;

    StoneSelectorDataContainer.data[type][data.handle] = data;

    if (previousRssi >= 0) {
      if (newRssi >= 0) {
        StoneSelectorDataContainer.data[type][data.handle].rssi = null;
      }
      else {
        StoneSelectorDataContainer.data[type][data.handle].rssi = newRssi;
      }
    }
    else {
      if (newRssi >= 0) {
        StoneSelectorDataContainer.data[type][data.handle].rssi = previousRssi;
      }
      else {
        StoneSelectorDataContainer.data[type][data.handle].rssi = Math.round(0.5*newRssi + 0.5*previousRssi);
      }
    }


    Object.keys(StoneSelectorDataContainer.data).forEach((otherType) => {
      if (otherType === type) { return; }

      if (StoneSelectorDataContainer.data[otherType][data.handle]) {
        delete StoneSelectorDataContainer.data[otherType][data.handle];
      }
    })

    if (newStone) {
      let now = new Date().valueOf();

      let minRedrawTime = 1000;

      if (this.state.filterSelectorOnScreen === false || now - this.lastRedraw > minRedrawTime) {
        this.lastRedraw = now;
        this.forceUpdate();
      }
    }
    else {
      this.doUpdate = true;
    }
  }


  refresh() {
    this.stopHFScanning();
    this.startScanning();
    this.startHFScanning(500);
    this.setState({trackingHandles:[]})
    StoneSelectorDataContainer.data = {
      verified: {},
      unverified: {},
      setup: {},
      dfu: {},
    };
  }

  getCrownstones() {
    let result = [];
    let stack = [];

    if (this.state.filterSelectorOnScreen === true) {
      return;
    }

    this.trackingItems = [];

    let showAll = filterState.plug && filterState.builtin && filterState.builtinOne && filterState.guidestone && filterState.crownstoneUSB;

    let collect = (advertisementType) => {
      if (filterState[advertisementType]) {
        Object.keys(StoneSelectorDataContainer.data[advertisementType]).forEach((handle) => {
          if (!showAll) {
            let deviceType = StoneSelectorDataContainer.data[advertisementType] && StoneSelectorDataContainer.data[advertisementType][handle] && StoneSelectorDataContainer.data[advertisementType][handle].serviceData && StoneSelectorDataContainer.data[advertisementType][handle].serviceData.deviceType || null;

            if (!filterState[deviceType]) {
              return
            }
          }
          if (this.state.showHandleFilter && this.state.handleFilter.length > 0) {
            if (handle.toUpperCase().indexOf(this.state.handleFilter) !== 0) {
              return;
            }
          }

          let data = StoneSelectorDataContainer.data[advertisementType][handle];
          let rssi = data.rssi;

          if (this.state.trackingHandles.indexOf(handle) !== -1) {
            this.trackingItems.push({ handle: handle, rssi: rssi, type: advertisementType, data: data, sphereId: data.referenceId || null })
            return;
          }
          if (rssi < 0 && rssi >= this.state.rssiFilter || this.state.showHandleFilter) {
            stack.push({ handle: handle, rssi: rssi, type: advertisementType, data: data, sphereId: data.referenceId || null });
          }
        })
      }
    }

    Object.keys(StoneSelectorDataContainer.data).forEach((advertisementType) => {
      collect(advertisementType);
    })


    if (this.state.sorting) {
      stack.sort((a, b) => { return b.rssi - a.rssi; });
    }

    if (this.trackingItems.length > 0) {
      this.trackingItems.forEach((data) => {
        stack.unshift(data);
      })
    }

    stack.forEach((item) => {
      let trackingIndex = this.state.trackingHandles.indexOf(item.handle);
      result.push(
        <CrownstoneEntry
          key={item.handle}
          item={item}
          tracking={trackingIndex !== -1}
          track={() => {
            if (trackingIndex !== -1) {
              let handles = [...this.state.trackingHandles];
              handles.splice(trackingIndex,1);
              this.setState({trackingHandles: handles});
            }
            else {
              this.setState({trackingHandles: [item.handle, ...this.state.trackingHandles] })}}
            }
          callback={() => {
            FocusManager.setHandleToFocusOn(item.handle, item.type, item.data.name);
            if (item.sphereId) {
              BroadcastStateManager._updateLocationState(item.sphereId);
              BroadcastStateManager._reloadDevicePreferences();
            }
            NavigationUtil.setRoot( Stacks.DEV_firmwareTesting({ handle: item.handle, item: item.data, mode: item.type, name: item.data.name }));
          }}
        />
      );
    })
    return result;
  }

  getHandleFilter() {
    return (
      <SlideInView
        hidden={true}
        visible={this.state.showHandleFilter}
        height={50}
        style={{
          flexDirection:'row',
          width:screenWidth,
          height:50,
          ...styles.centered,
          borderBottomColor: colors.black.rgba(0.2),
          borderBottomWidth:1,
          paddingLeft:10,
          paddingRight:10
        }}>
        <Text style={{...smallText}}>Filter:</Text>
        <TextInput
          autoFocus={this.state.showHandleFilter}
          value={this.state.handleFilter}
          placeholder={"Handle (MAC) address filter"}
          style={{flex:1, fontSize:16}}
          onChangeText={(newText) => {
            let validString = "";
            let re = /[0-9A-Fa-f]/g;
            for (let i = 0; i < newText.length; i++) {
              if(re.test(newText[i])) {
                validString += newText[i]
              }
              re.lastIndex = 0; // be sure to reset the index after using .test()
            }
            if (Platform.OS === 'android') {
              if (validString.length > 2 && validString[2] !== ':') {
                validString = validString.substr(0, 2) + ":" + validString.substr(2)
              }
              if (validString.length > 5 && validString[4] !== ':') {
                validString = validString.substr(0, 5) + ":" + validString.substr(5)
              }
            }
            validString = validString.toUpperCase();

            this.setState({handleFilter: validString})
          }}
        />
      </SlideInView>
    );
  }

  getBatchButton() {
    if (this.state.trackingHandles.length > 1 && this.state.filterSelectorOnScreen === false) {
      return (
        <TouchableOpacity
          onPress={() => {
            NavigationUtil.launchModal("DEV_Batching", {selectedStones: this.trackingItems})
          }}
          style={{
            position: 'absolute',
            bottom: 20,
            left: 0.125 * screenWidth,
            padding: 15,
            width: 0.75 * screenWidth, ...styles.centered,
            borderRadius: 30,
            backgroundColor: colors.menuTextSelected.hex,
            borderWidth: 4,
            borderColor: "#fff"
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Perform Batch!</Text>
        </TouchableOpacity>
      )
    }
  }

  render() {
    this.lastRedraw = new Date().valueOf();

    return (
      <Background image={core.background.light} hideNotifications={true}>
        <DEV_SelectionFilter submit={() => { this.setState({filterSelectorOnScreen: false}); this.startScanning() }} visible={this.state.filterSelectorOnScreen} update={() => { this.forceUpdate(); }}></DEV_SelectionFilter>
        <View style={{flexDirection:'row', width:screenWidth, height:60, backgroundColor: colors.white.rgba(0.7), ...styles.centered, borderBottomColor: colors.black.rgba(0.2), borderBottomWidth:1}}>
          <View style={{flex:1, maxWidth:15}}/>
          <FilterButton label={"Filters"} selected={false} callback={() => {this.setState({filterSelectorOnScreen: true})}}/>
          <View style={{flex:1}}/>
          <FilterButton label={"HF Scanning"} selected={this.state.HFscanning} callback={() => {
            if (this.state.HFscanning === false) {
              this.startHFScanning(2000);
            }
            else {
              this.stopHFScanning()
            }
          }}/>
          <View style={{flex:1}}/>
          <FilterButton label={"MAC"} selected={this.state.showHandleFilter} callback={() => {
            this.setState({showHandleFilter: !this.state.showHandleFilter})
          }}/>
          <View style={{flex:1, maxWidth:15}}/>
        </View>
        <View style={{width: screenWidth, height:50, backgroundColor: colors.white.rgba(0.7), overflow:"hidden"}}>
          { this.getHandleFilter() }
          <SlideInView
            hidden={true}
            visible={!this.state.showHandleFilter}
            height={50}
            style={{flexDirection:'row', width:screenWidth, height: 50,...styles.centered, borderBottomColor: colors.black.rgba(0.2), borderBottomWidth:1}}>
            <Text style={{...smallText, width: 50}}>Rssi:</Text>
            <Slider
              style={{ width: screenWidth - 120, height: 40 }}
              minimumValue={-100}
              maximumValue={-30}
              step={1}
              value={this.state.rssiFilter}
              minimumTrackTintColor={colors.gray.hex}
              maximumTrackTintColor={colors.gray.hex}
              onValueChange={(value) => {
                this.setState({rssiFilter: value});
              }}
            />
            <Text style={{...smallText, width:70}}>{this.state.rssiFilter + " dB"}</Text>
          </SlideInView>
        </View>

        <ScrollView>
          <RefreshControl
            refreshing={false}
            onRefresh={() => { this.refresh() }}
            title={ "Refresh!" }
            titleColor={colors.darkGray.hex}
            colors={[colors.csBlue.hex]}
            tintColor={colors.csBlue.hex}
          />
          <View style={{minHeight: availableScreenHeight - 110}}>
            { this.getCrownstones() }
          </View>
        </ScrollView>
        { this.getBatchButton() }
      </Background>
    );
  }
}


