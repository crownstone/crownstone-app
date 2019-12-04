import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DevicePowerCurve", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';


import { screenWidth, availableScreenHeight, deviceStyles, availableModalHeight } from "../styles";
import { Graph } from "../components/graph/Graph";
import { core } from "../../core";
import { NativeBus } from "../../native/libInterface/NativeBus";
import { Background } from "../components/Background";
import { TopBarUtil } from "../../util/TopBarUtil";
import { SphereDeleted } from "../static/SphereDeleted";
import { StoneDeleted } from "../static/StoneDeleted";
import { PowerUsageCacher } from "../../backgroundProcesses/PowerUsageCacher";


export class DevicePowerUsage extends LiveComponent<any, any> {
  static options(props) {
    // let state = core.store.getState();
    // const stone = state.spheres[props.sphereId].stones[props.stoneId];
    return TopBarUtil.getOptions({ title: "Power Usage", closeModal: true});
  }

  unsubscribeNativeBusEvent;

  data : GraphData[] = [];
  hash : number = 0;
  uniqueElement = 0;
  debugInterval;

  constructor(props) {
    super(props);

    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    this.data          = PowerUsageCacher.getData(this.props.sphereId, stone.config.handle);
    this.uniqueElement = PowerUsageCacher.getUniqueElement(this.props.sphereId, stone.config.handle);

    this.hash = Math.random();
  }

  componentDidMount() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];

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

    // this.debugInterval = setInterval(() => {
    //   processData({serviceData:{
    //     uniqueElement: Math.random(),
    //     powerUsageReal: Math.random()*100
    //   }})
    // }, 500)
  }

  // __loadInitialDebugData() {
  //   let now = new Date().valueOf();
  //   for (let i = 50; i > 0; i--) {
  //     this.data.push({ x: now-i*1000, y: Math.max(0, Math.random() * 100) })
  //   }
  // }


  componentWillUnmount() {
    this.data = [];
    this.unsubscribeNativeBusEvent();
    clearInterval(this.debugInterval);
  }

  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];

    let header = "Power usage";
    if (this.data.length > 0) {
      header = "Power usage: " + Math.round(this.data[this.data.length-1].y) + " W"
    }
    else {
      header = "Power usage: " + stone.state.currentUsage + " W"
    }

    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView>
          <View style={{alignItems:'center', paddingTop:30, minHeight: availableModalHeight}}>
            <Text style={deviceStyles.header}>{header}</Text>
            <View style={{height:30}} />
            <Graph width={screenWidth*0.95} height={availableScreenHeight/2} data={this.data} dataHash={this.hash}/>
            <View style={{height:30}} />
            <Text style={[deviceStyles.explanation, {fontWeight:'bold'}]}>{ lang("Real_time_power_usage") }</Text>
            <Text style={deviceStyles.explanation}>{ lang("Stand_near_the_Crownstone") }</Text>
          </View>
        </ScrollView>
      </Background>
    )
  }
}