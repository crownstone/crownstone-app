//
// import { Languages } from "../../../Languages"
//
// function lang(key,a?,b?,c?,d?,e?) {
//   return Languages.get("DEV_Batching", key)(a,b,c,d,e);
// }
import React, { Component } from "react";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { ConnectionManager } from "../../../backgroundProcesses/dev/ConnectionManager";
import { BleUtil } from "../../../util/BleUtil";
import { xUtil } from "../../../util/StandAloneUtil";
import { availableScreenHeight, background, colors, screenWidth, styles } from "../../styles";
import { ScrollView, TouchableOpacity, View, Text, ActivityIndicator, Alert, Animated } from "react-native";
import { core } from "../../../Core";
import { FileUtil } from "../../../util/FileUtil";
import { ListEditableItems } from "../../components/ListEditableItems";
import { DfuHelper } from "../../../native/firmware/DfuHelper";
import { LOG, LOGd, LOGv } from "../../../logging/Log";
import { Scheduler } from "../../../logic/Scheduler";
import { BigFilterButton } from "../stoneSelecting/DEV_SelectionComponents";
import { Background } from "../../components/Background";
import { LiveComponent } from "../../LiveComponent";
import { TopBarUtil } from "../../../util/TopBarUtil";
import KeepAwake from 'react-native-keep-awake';
import { NavigationUtil } from "../../../util/NavigationUtil";
import { CommandAPI } from "../../../logic/constellation/Commander";
import { tell } from "../../../logic/constellation/Tellers";

const RNFS = require('react-native-fs');


export class DEV_Batching extends LiveComponent<{selectedStones: any[], visible: boolean, close: () => void}, {operation: any
  values: any
  pending: any
  finished: any
  failed: any
  availableFirmwares: any
  dfuProgress: any
  dfuActiveHandle: any
  selectedDFUFile: any
  dfuMode: any
  dfuStarted: any}>{

  sessionUUID = "DEV_BATCHOPS"
  processSubscriptions = []

  static options(props) {
    return TopBarUtil.getOptions({title: "Batch Operations", closeModal: true})
  }

  constructor(props) {
    super(props);

    this.state = {
      operation: 'resetCounter',
      values: {},
      pending: {},
      finished: {},
      failed: {},
      availableFirmwares: [],
      dfuProgress: 0,
      dfuActiveHandle: null,
      selectedDFUFile: null,
      dfuMode: false,
      dfuStarted: false
    };
    this.getZips();
  }

  getSelectedStones() {
    let items = [];

    this.props.selectedStones.forEach((stoneData) => {
      let handle = stoneData.handle;
      items.push(
        <CrownstoneBatchEntry
          key={"batchH" + handle}
          item={stoneData}
          value={    this.state.values[handle]  || "..." }
          pending={  this.state.pending[handle] || false }
          failed={   this.state.failed[handle]  || false }
          progress={ this.state.dfuActiveHandle == handle && this.state.dfuProgress || 0}
        />
      );
    })

    return items;
  }

  getZips() {
    let localPath = FileUtil.getPath()
    RNFS.readDir(localPath)
      .then((data) => {
        let zippies = [];
        data.forEach((d) => {
          let name = d.name;
          if (name.substr(name.length-4) === '.zip') {
            zippies.push(name);
          }
        })
        this.setState({availableFirmwares: zippies});
      })
  }



  // { handle: handle, rssi: rssi, type: advertisementType, data: data, sphereId: data.referenceId || null }
  async performBatchOperation() {
    let pending = {}
    for (let stone of this.props.selectedStones) {
      pending[stone.handle] = true;
    }

    this.setState({pending: pending, failed: {}, values: {}})

    for (let stone of this.props.selectedStones) {
      let value = null;
      try {
        switch (this.state.operation) {
          case "resetCounter":
            value = await tell(stone.handle).getResetCounter();
            break;
          case "firmwareVersion":
            value = await tell(stone.handle).getFirmwareVersion()
            break;
        }
        this.setState({
          values: { ...this.state.values, [stone.handle]: value },
          pending: { ...this.state.pending, [stone.handle]: false },
          finished: { ...this.state.finished, [stone.handle]: true },
        })
      }
      catch (e) {
        console.log("ERROR", e)
        this.setState({
          failed: {...this.state.failed, [stone.handle]: true},
          pending:  {...this.state.pending, [stone.handle]: false},
        })
      }

    }
  }


  _getDfuItems() {
    let items = [];
    items.push({label: "AVAILABLE DFU ZIPS", type: 'explanation', color: colors.black.hex});
    let hasFirmwares = false;
    this.state.availableFirmwares.forEach((fw) => {
      let textColor = colors.blue.hex;
      let buttonBackground = colors.white.rgba(0.9)
      hasFirmwares = true;
      if (this.state.selectedDFUFile === fw) {
        textColor = colors.black.hex;
        buttonBackground = colors.green.rgba(0.9)
      }
      items.push({
        label: fw,
        type: 'button',
        buttonBackground: buttonBackground,
        style: {color: textColor},
        callback: () => {
          this.setState({selectedDFUFile: fw})
        }
      });
    })

    if (!hasFirmwares) {
      items.push({label: "No firmwares on phone.", type: 'info'});
    }

    return items;
  }

  _searchCleanup() {
    BleUtil.stopHighFrequencyScanning(this.sessionUUID);
    this.processSubscriptions.forEach((callback) => {callback()});
    this.processSubscriptions = [];
  }

  _searchForCrownstone(handle) : Promise<crownstoneModes> {
    // we need high frequency scanning to get duplicates of the DFU crownstone.
    LOG.dfu("DfuOverlay: Start HF Scanning for all Crownstones");
    BleUtil.startHighFrequencyScanning(this.sessionUUID, true);

    return new Promise((resolve, reject) => {
      let clearSearchTimeout = Scheduler.scheduleCallback(() => {
        BleUtil.stopHighFrequencyScanning(this.sessionUUID);
        this._searchCleanup();
        reject(new Error("CANT_FIND_CROWNSTONE"));
      }, 15000, "DFU Timeout")



      // this will show the user that he has to move closer to the crownstone or resolve if the user is close enough.
      let rssiResolver = (data, setupMode, dfuMode) => {
        clearSearchTimeout();

        LOGd.dfu("DfuOverlay: Found match:", data);
        // if ((setupMode && data.rssi < -99) || (data.rssi < -80)) {
        //   core.eventBus.emit("updateDfuStep", STEP_TYPES.SEARCHING_MOVE_CLOSER);
        // }

        // no need to HF scan any more
        LOG.dfu("DfuOverlay: Stop HF Scanning for all Crownstones");
        BleUtil.stopHighFrequencyScanning(this.sessionUUID);

        this._searchCleanup();
        resolve({setupMode, dfuMode});
      };

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.advertisement, (advertisement) => {
        if (advertisement.handle === handle) {
          rssiResolver(advertisement, false, false);
        }
        else {
          LOGv.dfu("DFUExecutor: Other advertisment received while looking for", handle, advertisement);
        }
      }));

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
        if (setupAdvertisement.handle === handle) {
          rssiResolver(setupAdvertisement, true, false);
        }
        else {
          LOGv.dfu("DFUExecutor: Other setupAdvertisement received while looking for", handle, setupAdvertisement);
        }
      }));

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.dfuAdvertisement, (dfuAdvertisement) => {
        if (dfuAdvertisement.handle === handle) {
          rssiResolver(dfuAdvertisement, false, true);
        }
        else {
          LOGv.dfu("DFUExecutor: Other dfuAdvertisement received while looking for", handle, dfuAdvertisement);
        }
      }))
    });
  }

  runDfuOnCrownstone(selectedStone) {
    this.setState({dfuActiveHandle: selectedStone.handle, dfuProgress:0})
    let helper = new DfuHelper(
      selectedStone.sphereId,
      200,
      { config: { handle: selectedStone.handle }})

    return this._searchForCrownstone(selectedStone.handle)
      .then((crownstoneMode) => {
        return helper.performUpdate(
          crownstoneMode,
          FileUtil.getPath(this.state.selectedDFUFile),
          (progress) => { this.setState({dfuActiveHandle: selectedStone.handle, dfuProgress: progress}) }
          );
      })
      .then(() => {
        this.setState({
          values:   {...this.state.values, [selectedStone.handle]: "OK"},
          pending:  {...this.state.pending, [selectedStone.handle]: false},
          finished: {...this.state.finished, [selectedStone.handle]: true},
        })

        this.setState({dfuActiveHandle: null, dfuProgress:0})
      })
      .catch((err) => {
        this.setState({
          values:   {...this.state.values, [selectedStone.handle]: "FAILED"},
          pending:  {...this.state.pending, [selectedStone.handle]: false},
          finished: {...this.state.finished, [selectedStone.handle]: true},
        })
        this.setState({dfuActiveHandle: null, dfuProgress:0})
        Alert.alert("FAILED", err)
      })
  }

  runDFU() {
    let pending = {}
    this.props.selectedStones.forEach((stoneData) => {
      pending[stoneData.handle] = true;
    })

    this.setState({pending: pending, failed: {}, values: {}, dfuStarted: true})

    return xUtil.promiseBatchPerformer(this.props.selectedStones, this.runDfuOnCrownstone.bind(this))
  }

  render() {
    if (this.state.dfuMode && this.state.dfuStarted === false) {
      return (
        <Background image={background.light} hideNotifications={true} hasNavBar={false}>
          <ScrollView contentContainerStyle={{flexGrow:1}}>
            <View style={{flexGrow: 1, paddingVertical: 30, width: screenWidth}}>
              <ListEditableItems items={this._getDfuItems()} separatorIndent={true} />
              <View style={{minHeight:20, flex:1}} />
              <View style={{width: screenWidth, alignItems:"center"}}>
                <TouchableOpacity
                  onPress={() => { this.runDFU() }}
                  style={{padding:15, width: 0.4*screenWidth, ...styles.centered, borderRadius: 30, backgroundColor: colors.green.rgba(0.7), borderWidth: 2, borderColor: "#fff"}}
                >
                  <Text style={{fontSize:20, fontWeight: 'bold'}}>{ "Execute" }</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Background>
      );
    }

    return (
      <Background image={background.light} hideNotifications={true} hasNavBar={false}>
        <ScrollView contentContainerStyle={{flexGrow:1}}>
          <View style={{flexGrow: 1, alignItems:'center', paddingTop:30}}>
            <View style={{flex:1, maxHeight:15}}/>
            <Text style={{fontSize:20, fontWeight: 'bold', padding:15}}>{ "Crownstones:" }</Text>
            <View style={{flex:1, maxHeight:30}}/>
            { this.getSelectedStones() }
            <View style={{flex:1, maxHeight:30}}/>
            <Text style={{fontSize:20, fontWeight: 'bold', padding:15}}>{ "Select operation:" }</Text>
            <View style={{flex:1, maxHeight:30}}/>
            <View style={{flex:1, width:0.8*screenWidth, alignSelf:'center'}}>
              <BigFilterButton label={ "Get Reset Counter"}    selected={this.state.operation === 'resetCounter'}    callback={() => { this.setState({operation:'resetCounter'}) }}    style={{width:0.8*screenWidth}}/>
              <BigFilterButton label={ "Get Firmware Version"} selected={this.state.operation === 'firmwareVersion'} callback={() => { this.setState({operation:'firmwareVersion'}) }} style={{width:0.8*screenWidth}}/>
              <BigFilterButton label={ "DFU"}                  selected={this.state.operation === 'DFU'}             callback={() => { this.setState({operation:'DFU'}) }}             style={{width:0.8*screenWidth}}/>
            </View>
            <View style={{flex:1}}/>
            <View style={{width: screenWidth, flexDirection:'row', marginBottom:15}}>
              <View style={{flex:1}}/>
              <TouchableOpacity
                onPress={() => { NavigationUtil.dismissModal() }}
                style={{padding:15, width: 0.4*screenWidth, ...styles.centered, borderRadius: 30, backgroundColor: colors.gray.rgba(0.7), borderWidth: 2, borderColor: "#fff"}}
              >
                <Text style={{fontSize:20, fontWeight: 'bold'}}>{ "Close" }</Text>
              </TouchableOpacity>
              <View style={{flex:1}}/>
              <TouchableOpacity
                onPress={() => {
                  if (this.state.operation === "DFU") {
                    return this.setState({dfuMode: true});
                  }
                  this.performBatchOperation() }}
                style={{padding:15, width: 0.4*screenWidth, ...styles.centered, borderRadius: 30, backgroundColor: colors.green.rgba(0.7), borderWidth: 2, borderColor: "#fff"}}
              >
                <Text style={{fontSize:20, fontWeight: 'bold'}}>{ "Run" }</Text>
              </TouchableOpacity>
              <View style={{flex:1}}/>
            </View>
          </View>
        </ScrollView>
      </Background>
    );
  }
}

export class CrownstoneBatchEntry extends Component<{item: any, value: string, pending: false, failed: false, progress: number}, any> {
  cachedCid=null;

  render() {
    let height = 55;
    let sphere = null;

    switch (this.props.item.type) {
      case 'verified':
        let state = core.store.getState();
        sphere = state.spheres[this.props.item.data.referenceId] || null;
        break;
    }

    let hasType = this.props.item.data && this.props.item.data.serviceData && this.props.item.data.serviceData.deviceType !== 'undefined' || false;
    let hasCid = this.props.item.data && this.props.item.data.serviceData && this.props.item.data.serviceData.crownstoneId || false;

    let str = "";
    if (sphere !== null) {
      str = " (in " + sphere.config.name;
    } else {
      this.cachedCid = null;
    }
    if (hasCid !== false && this.props.item.data && this.props.item.data.serviceData.stateOfExternalCrownstone === false) {
      this.cachedCid = hasCid;
    }
    if (this.cachedCid !== null) {
      str += ":" + this.cachedCid;
    }

    if (sphere !== null) {
      str = str + ")";
    }


    return (
      <View>
        <View style={{
          backgroundColor: this.props.failed ? colors.csOrange.hex : colors.white.hex,
          width: screenWidth,
          height: height,
          padding: 10,
          justifyContent: 'center',
        }}>
          <KeepAwake />
          <View style={{ flexDirection:'row'}}>
            <View style={{height: height}}>
              <View style={{ flex: 1 }}/>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ width: 60 }}>{this.props.item.data.name}</Text>
                {!hasType || <Text>{ " - " }</Text>}
                {!hasType || <Text>{this.props.item.data.serviceData.deviceType}</Text>}
                {sphere !== null ? <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{str}</Text> : undefined}
                <View style={{ flex: 1 }}/>
              </View>
              <View style={{ flex: 1 }}/>
              <Text style={{ color: colors.black.rgba(0.5), fontSize: 10 }}>{this.props.item.handle}</Text>
              <View style={{ flex: 1 }}/>
            </View>
            <View style={{ height: height, flex: 1, justifyContent: 'center' }}>
              {this.props.pending ? <ActivityIndicator size={ "small" }  style={{alignSelf:'flex-end'}} /> : <Text style={{ fontWeight: 'bold', textAlign: 'right' }}>{this.props.value}</Text>}
            </View>
          </View>
        </View>
        <View style={{position:'absolute', bottom:0, height:5, width: this.props.progress * screenWidth, backgroundColor: colors.green.hex}} />
      </View>
    );
  }
}


// export class DfuDeviceUpdaterEntry extends Component<any, any> {
//   baseHeight : number;
//
//   DFU: DfuExecutor;
//   constructor(props) {
//     super(props);
//
//     this.baseHeight = props.height || 80;
//
//     this.state = {
//       updateSuccessful: false,
//       updateFailed: false,
//       progress1Width: new Animated.Value(0),
//       successIndicatorWidth: new Animated.Value(0),
//       attempts:0,
//     };
//   }
//
//   _updateState(stateData) {
//     let totalProgress = (stateData.currentStep + stateData.progress - 1) / stateData.totalSteps;
//     let animations = [];
//     this.state.progress1Width.stopAnimation()
//     this.state.successIndicatorWidth.setValue(0);
//     animations.push(Animated.timing(this.state.progress1Width, {toValue: totalProgress * screenWidth, useNativeDriver: false, duration: 100}));
//     Animated.parallel(animations).start();
//   }
//
//
//   render() {
//     let shouldStillUpdate = !this.state.isUpdating && !this.state.updateSuccessful && !this.state.updateFailed;
//     return (
//       <View style={[{height: this.baseHeight, width: screenWidth, overflow:'hidden', backgroundColor: colors.white.rgba(0.5)}]}>
//         <Animated.View style={{position:'absolute', top:0, left:0, height: this.baseHeight,   width: this.state.progress1Width, backgroundColor: colors.iosBlue.rgba(0.25)}} />
//         <Animated.View style={{position:'absolute', top:0, left:0, height: this.baseHeight,   width: this.state.successIndicatorWidth, backgroundColor: colors.green.rgba(0.5)}} />
//         <View style={{ height: this.baseHeight, width: screenWidth, alignItems: 'center', paddingLeft:15, paddingRight:15,}}>
//           <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
//             <View style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}}>
//               <View style={{flexDirection: 'column'}}>
//                 <Text style={{fontSize: 17, fontWeight: this.props.closeEnough ? 'bold' : '300'}}>{this.props.name}</Text>
//                 { shouldStillUpdate ? <Text style={{fontSize: 14, fontWeight: '100'}}>{ "Waiting to update..." }</Text>: undefined }
//                 { this.state.updateSuccessful ? <Text style={{fontSize: 14, fontWeight: 'bold'}}>{ "Update finished" }</Text> : undefined }
//                 { this.state.updateFailed ?     <Text style={{fontSize: 14, fontWeight: 'bold'}}>{ "Update failed" }</Text> : undefined }
//               </View>
//             </View>
//             { this.props.isUpdating ? <ActivityIndicator animating={true} size='large' color={colors.csBlueDark.hex} /> : null}
//           </View>
//         </View>
//       </View>
//     );
//   }
// }