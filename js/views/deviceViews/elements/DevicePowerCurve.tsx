import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../styles'
import { LOG } from '../../../logging/Log'
import {deviceStyles} from "../DeviceOverview";
import {Graph} from "../../components/Graph/Graph";
import {Util} from "../../../util/Util";
import {eventBus} from "../../../util/EventBus";
import {textStyle} from "./DeviceBehaviour";


export class DevicePowerCurve extends Component<any, any> {
  unsubscribeStoreEvents;
  // debugInterval;


  componentDidMount() {
    this.unsubscribeStoreEvents = eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.powerUsageUpdated && change.powerUsageUpdated.stoneIds[this.props.stoneId]
      ) {
        this.forceUpdate();
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];

    let dateId = Util.getDateHourId(new Date().valueOf());

    let dataStream = [];
    if (stone.powerUsage[dateId]) {
      dataStream = stone.powerUsage[dateId].data;
    }

    return (
      <View style={{flex:1, flexDirection: 'column', alignItems:'center', paddingTop:30}}>
        <Text style={deviceStyles.header}>Power Usage</Text>
        <View style={{flex:1}} />
        <Graph width={screenWidth} height={availableScreenHeight/2} data={dataStream} xField="timestamp" yField="power"/>
        <View style={{flex:5}}>
          <ScrollView style={{flex:1}}>
            <Text style={[textStyle.explanation, {fontWeight:'bold'}]}>{
              'Sneak preview of the dynamic power usage overview for this Crownstone!'
            }</Text>
            <Text style={textStyle.explanation}>{
              'Stand near the Crownstone to see the measurements flowing in! It will only measure if the app is in the foreground. ' +
              'Future versions of the app will allow you to freely scroll and zoom in and out. Scroll down on the text for more upcoming features! ' +
              '\n\nIn the future, the power usage overview will be sorted by the Devices you use, as well as an extra view to summarize the entire usage in your Sphere, categorized by room, devices and much more!\n\n\n\n'
            }</Text>
          </ScrollView>
        </View>
      </View>
    )
  }
}