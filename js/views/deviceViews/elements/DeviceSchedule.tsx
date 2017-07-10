import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  DatePickerIOS,
  TouchableOpacity,
  Platform,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TimePickerAndroid,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../styles'
import {IconButton} from "../../components/IconButton";
import {ErrorContent} from "../../content/ErrorContent";
import {eventBus} from "../../../util/EventBus";
import {deviceStyles} from "../DeviceOverview";
import {textStyle} from "./DeviceBehaviour";
import {ListEditableItems} from "../../components/ListEditableItems";
import {Icon} from "../../components/Icon";
import {Permissions} from "../../../backgroundProcesses/Permissions";
import {Util} from "../../../util/Util";


export class DeviceSchedule extends Component<any, any> {
  _getItems(stone, remainingHeight) {
    let items = [];

    let schedules = stone.schedule;
    let scheduleIds = Object.keys(schedules);
    if (scheduleIds.length > 0) {
      items.push({label:'ALL DEVICES', type: 'lightExplanation',  below:false});

      scheduleIds.forEach((scheduleId) => {
        let schedule = schedules[scheduleId];

        items.push({__item:
          <View >
            <View style={[styles.listView,{backgroundColor: colors.white.rgba(0.75)}]}>
              <SchedulerEntry
                name={schedule.name}
                navigation={false}
                size={45}
              />
            </View>
          </View>
        })
      });

      return <ListEditableItems items={items} style={{width:screenWidth}} />;
    }
    else {
      return (
        <View style={{
          flex:1,
          height:remainingHeight,
          width:screenWidth,
          alignItems:'center',
          justifyContent:'center'
        }}>
          <View style={{flex:0.2}} />
          <Text style={{
            color: colors.green.hex,
            textAlign: 'center',
            padding:30,
            fontWeight: 'bold',
            fontStyle:'italic'
          }}>Add your first scheduled action by tapping on "Add" in the top right corner!</Text>
          <View style={{flex:1}} />
        </View>
      );
    }


  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let iconHeight = 0.15*screenHeight;
    let AI = Util.data.getAiData(state, this.props.sphereId);
    return (
      <ScrollView style={{height: availableScreenHeight, width: screenWidth}}>
        <View style={{flex:1, width: screenWidth, alignItems:'center'}}>
          <View style={{height: 30}} />
          <Text style={[deviceStyles.header]}>Schedule</Text>
          <View style={{height: 0.2*iconHeight}} />
          <Text style={textStyle.specification}>{'You can tell the ' + AI.name + ' to switch this Crownstone on or off at a certain time.'}</Text>
          <View style={{height: 0.2*iconHeight}} />
          <IconButton
            name="ios-clock"
            size={0.13*screenHeight}
            color="#fff"
            buttonStyle={{width: iconHeight, height: iconHeight, backgroundColor:colors.menuTextSelected.hex, borderRadius: 0.2*iconHeight}}
          />
          <View style={{height: 0.3*iconHeight}} />
          { this._getItems(stone, availableScreenHeight - 100 - 1.5 * iconHeight - 30 - 45 ) }
        </View>
      </ScrollView>
  )
  }
}


class SchedulerEntry extends Component<any, any> {
  render() {
    return (
      <TouchableOpacity style={{width:screenWidth}}>
        <Text>{this.props.name}</Text>
      </TouchableOpacity>
    );
  }
}