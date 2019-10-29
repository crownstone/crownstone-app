import React, { Component } from "react";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { ConnectionManager } from "../../../backgroundProcesses/dev/ConnectionManager";
import { BleUtil } from "../../../util/BleUtil";
import { xUtil } from "../../../util/StandAloneUtil";
import { SlideInView } from "../../components/animated/SlideInView";
import { availableScreenHeight, colors, screenWidth, styles } from "../../styles";
import { ScrollView, TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { BigFilterButton } from "./DEV_SelectionComponents";
import { core } from "../../../core";


export class DEV_BatchOps extends Component<{selectedStones: any[], visible: boolean, close: () => void}, any>{

  constructor(props) {
    super(props);

    this.state = {
      operation: 'resetCounter',
      values: {},
      interrogatingHandle: null,
      pending: {},
      finished: {},
      failed: {},
    };
  }

  getSelectedStones() {
    let items = [];

    this.props.selectedStones.forEach((stoneData) => {
      items.push(<CrownstoneBatchEntry
        key={"batchH" + stoneData.handle}
        item={stoneData}
        value={this.state.values[stoneData.handle] || "..."}
        pending={this.state.pending[stoneData.handle] || false}
        failed={this.state.failed[stoneData.handle] || false}
      />)
    })

    return items;
  }

  bleAction(selectedStone, attempt = 0) {
    let action = null
    switch (this.state.operation) {
      case "resetCounter":
        action = BluenetPromiseWrapper.getResetCounter;
        break;
      case "firmwareVersion":
        action = BluenetPromiseWrapper.getFirmwareVersion;
        break;
    }

    ConnectionManager.connectWillStart()
    let proxy = BleUtil.getProxy(selectedStone.handle, selectedStone.sphereId);
    let promise = proxy.performPriority(action, [])

    // perform.
    return promise
      .then((result) => {
        this.setState({
          values:   {...this.state.values, [selectedStone.handle]: result.data},
          pending:  {...this.state.pending, [selectedStone.handle]: false},
          finished: {...this.state.finished, [selectedStone.handle]: true},
        })
        return ConnectionManager.disconnect()
      })
      .catch((err) => {
        ConnectionManager.disconnect()
        if (attempt < 3) {
          return this.bleAction(selectedStone, attempt +1)
        }
        else {
          this.setState({
            failed: {...this.state.failed, [selectedStone.handle]: true},
            pending:  {...this.state.pending, [selectedStone.handle]: false},
          })
        }
      })
  }




  // { handle: handle, rssi: rssi, type: advertisementType, data: data, sphereId: data.referenceId || null }
  performBatchOperation() {
    let pending = {}
    this.props.selectedStones.forEach((stoneData) => {
      pending[stoneData.handle] = true;
    })

    this.setState({pending: pending, failed: {}, values: {}})

    return xUtil.promiseBatchPerformer(this.props.selectedStones, this.bleAction.bind(this))
  }

  render() {
    return (
      <SlideInView
        hidden={true}
        visible={this.props.visible}
        height={availableScreenHeight}
        style={{width:screenWidth, height: availableScreenHeight,...styles.centered}}>
        <ScrollView>
          <View style={{minHeight: availableScreenHeight}}>
            <View style={{flex:1, maxHeight:15}}/>
            <Text style={{fontSize:20, fontWeight: 'bold', padding:15}}>Crownstones:</Text>
            <View style={{flex:1, maxHeight:30}}/>
            { this.getSelectedStones() }
            <View style={{flex:1, maxHeight:30}}/>
            <Text style={{fontSize:20, fontWeight: 'bold', padding:15}}>Select operation:</Text>
            <View style={{flex:1, maxHeight:30}}/>
            <View style={{flex:1, width:0.8*screenWidth, alignSelf:'center'}}>
              <BigFilterButton label={"Get Reset Counter"}    selected={this.state.operation === 'resetCounter'}    callback={() => { this.setState({operation:'resetCounter'}) }} style={{width:0.8*screenWidth}}/>
              <BigFilterButton label={"Get Firmware Version"} selected={this.state.operation === 'firmwareVersion'} callback={() => { this.setState({operation:'firmwareVersion'}) }} style={{width:0.8*screenWidth}}/>
            </View>
            <View style={{flex:1}}/>
            <View style={{width: screenWidth, flexDirection:'row', marginBottom:15}}>
            <View style={{flex:1}}/>
            <TouchableOpacity
              onPress={() => { this.props.close()}}
              style={{padding:15, width: 0.4*screenWidth, ...styles.centered, borderRadius: 30, backgroundColor: colors.gray.rgba(0.7), borderWidth: 2, borderColor: "#fff"}}
            >
              <Text style={{fontSize:20, fontWeight: 'bold'}}>Close</Text>
            </TouchableOpacity>
            <View style={{flex:1}}/>
            <TouchableOpacity
              onPress={() => { this.performBatchOperation() }}
              style={{padding:15, width: 0.4*screenWidth, ...styles.centered, borderRadius: 30, backgroundColor: colors.green.rgba(0.7), borderWidth: 2, borderColor: "#fff"}}
            >
              <Text style={{fontSize:20, fontWeight: 'bold'}}>Run</Text>
            </TouchableOpacity>
            <View style={{flex:1}}/>
            </View>
          </View>
        </ScrollView>
      </SlideInView>
    );
  }
}

export class CrownstoneBatchEntry extends Component<{item: any, value: string, pending: false, failed: false}, any> {

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
      <View style={{
        backgroundColor: this.props.failed ? colors.csOrange.hex : colors.white.hex,
        width: screenWidth,
        height: height,
        padding: 10,
        justifyContent: 'center',
      }}>
        <View style={{ flexDirection:'row'}}>
          <View style={{height: height}}>
            <View style={{ flex: 1 }}/>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: 60 }}>{this.props.item.data.name}</Text>
              {!hasType || <Text>{" - "}</Text>}
              {!hasType || <Text>{this.props.item.data.serviceData.deviceType}</Text>}
              {sphere !== null ? <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{str}</Text> : undefined}
              <View style={{ flex: 1 }}/>
            </View>
            <View style={{ flex: 1 }}/>
            <Text style={{ color: colors.black.rgba(0.5), fontSize: 10 }}>{this.props.item.handle}</Text>
            <View style={{ flex: 1 }}/>
          </View>
          <View style={{ height: height, flex: 1, justifyContent: 'center' }}>
            {this.props.pending ? <ActivityIndicator size={"small"}  style={{alignSelf:'flex-end'}} /> : <Text style={{ fontWeight: 'bold', textAlign: 'right' }}>{this.props.value}</Text>}
          </View>
        </View>
      </View>
    );
  }
}