import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DevicePowerCurve", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';


import { screenWidth, availableScreenHeight, deviceStyles } from "../../styles";
import { Graph } from "../../components/graph/Graph";
import { core } from "../../../core";
import { NativeBus } from "../../../native/libInterface/NativeBus";


export class DevicePowerCurve extends LiveComponent<any, any> {
  unsubscribeNativeBusEvent;

  data : GraphData[] = [];
  hash : number = 0;
  uniqueElement = 0;
  // debugInterval;


  componentDidMount() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    this.data = [];

    this.unsubscribeNativeBusEvent = core.nativeBus.on(NativeBus.topics.advertisement, (data: crownstoneAdvertisement) => {
      if (data.handle === stone.config.handle && data.serviceData.stateOfExternalCrownstone === false && data.serviceData.errorMode === false) {
        let now = new Date().valueOf();
        // throttling
        if (data.serviceData.uniqueElement === this.uniqueElement) {
          return;
        }

        this.uniqueElement = data.serviceData.uniqueElement
        this.data.push({x: now, y: Math.max(0,data.serviceData.powerUsageReal)})

        if (this.data.length > 50) {
          this.data.shift()
        }

        this.hash = Math.random();
        this.forceUpdate();
      }
    });
  }


  componentWillUnmount() {
    this.data = [];
    this.unsubscribeNativeBusEvent();
  }

  render() {
    return (
      <View style={{flex:1, flexDirection: 'column', alignItems:'center', paddingTop:30}}>
        <Text style={deviceStyles.header}>{ lang("Power_Usage") }</Text>
        <View style={{flex:0.75}} />
        <Graph width={screenWidth} height={availableScreenHeight/2} data={this.data} dataHash={this.hash}/>
        <View style={{flex:5}}>
          <ScrollView style={{flex:1}}>
            <Text style={[deviceStyles.explanation, {fontWeight:'bold'}]}>{ lang("Sneak_preview_of_the_dyna") }</Text>
            <Text style={deviceStyles.explanation}>{ lang("Stand_near_the_Crownstone") }</Text>
          </ScrollView>
        </View>
      </View>
    )
  }
}