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
import {deviceStyles} from "../DeviceOverview";
import {textStyle} from "./DeviceBehaviour";
import {ListEditableItems} from "../../components/ListEditableItems";
import {Util} from "../../../util/Util";
import {Permissions} from "../../../backgroundProcesses/Permissions";
import {Icon} from "../../components/Icon";
import {BatchCommandHandler} from "../../../logic/BatchCommandHandler";
import {LOG} from "../../../logging/Log";
import {eventBus} from "../../../util/EventBus";
import {StoneUtil} from "../../../util/StoneUtil";


export class DeviceSchedule extends Component<any, any> {
  _getItems(schedules) {
    let items = [];

    let scheduleIds = Object.keys(schedules);
    if (scheduleIds.length > 0) {
      items.push({label:'SCHEDULED ACTIONS', type: 'lightExplanation',  below:false});

      scheduleIds.forEach((scheduleId) => {
        let schedule = schedules[scheduleId];

        items.push({__item:
          <View >
            <View style={[styles.listView,{backgroundColor: colors.white.rgba(0.75), paddingRight:0}]}>
              <SchedulerEntry
                schedule={schedule}
                scheduleId={scheduleId}
                stoneId={this.props.stoneId}
                sphereId={this.props.sphereId}
                navigation={false}
                size={45}
              />
            </View>
          </View>
        })
      });

    }

    return items;
  }

  _getSyncOption(stone) {
    if (Permissions.canClearAllSchedules) {
      return (
        <TouchableOpacity
          style={{
            marginBottom:45,
            height:30,
            backgroundColor:colors.white.rgba(0.3),
            borderRadius: 0.5*30,
            padding:5,
            paddingLeft:15,
            paddingRight:15,
            justifyContent:'center',
            alignItems:'center',
            flexDirection:'row'}}
          onPress={() => {
          if (stone.config.disabled === true) {
            Alert.alert(
              "Can't see Crownstone!",
              "You cannot sync schedules from Crownstone if I can't see it...",
              [{text:"OK"}]
            );
          }
          else {
            this._syncSchedules(stone);
          }
        }}>
          <Icon name="md-sync" size={20} color={colors.darkBackground.hex} style={{padding:5, paddingLeft:0}} />
          <Text style={{color: colors.darkBackground.hex}}>Sync schedules from Crownstone</Text>
        </TouchableOpacity>
      )
    }
  }

  _syncSchedules(stone) {
    let generateReduxData = (scheduleBridgeFormat : bridgeScheduleEntry) => {
      return {
        time: scheduleBridgeFormat.nextTime,
        scheduleEntryIndex: scheduleBridgeFormat.scheduleEntryIndex,
        switchState: scheduleBridgeFormat.switchState,
        fadeDuration: scheduleBridgeFormat.fadeDuration,
        intervalInMinutes: scheduleBridgeFormat.intervalInMinutes,
        ignoreLocationTriggers: scheduleBridgeFormat.ignoreLocationTriggers,
        active: scheduleBridgeFormat.active,
        repeatMode: scheduleBridgeFormat.repeatMode,
        activeDays: {
          Mon: scheduleBridgeFormat.activeMonday,
          Tue: scheduleBridgeFormat.activeTuesday,
          Wed: scheduleBridgeFormat.activeWednesday,
          Thu: scheduleBridgeFormat.activeThursday,
          Fri: scheduleBridgeFormat.activeFriday,
          Sat: scheduleBridgeFormat.activeSaturday,
          Sun: scheduleBridgeFormat.activeSunday,
        },
      }
    };
    eventBus.emit("showLoading", "Downloading schedules from Crownstone...");
    BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getSchedules'}, {},1, 'sync schedules from DeviceSchedule')
      .then((stoneSchedules : [bridgeScheduleEntry]) => {
        let dbSchedules = stone.schedules;
        let syncActions = [];
        let activeIds = {};
        stoneSchedules.forEach((schedule) => {
          let matchingId = this._findMatchingScheduleId(schedule, dbSchedules);
          if (matchingId === null) {
            syncActions.push({
              type: 'ADD_STONE_SCHEDULE', stoneId: this.props.stoneId, sphereId: this.props.sphereId, scheduleId: Util.getUUID(),
              data: generateReduxData(schedule)
            })
          }
          else {
            activeIds[matchingId] = true;
            syncActions.push({
              type: 'UPDATE_STONE_SCHEDULE', stoneId: this.props.stoneId, sphereId: this.props.sphereId, scheduleId: matchingId,
              data: generateReduxData(schedule)
            })
          }
        });

        let dbScheduleIds = Object.keys(dbSchedules);
        for (let i = 0; i < dbScheduleIds.length; i++) {
          if (activeIds[dbScheduleIds[i]] !== true) {
            syncActions.push({
              type: 'UPDATE_STONE_SCHEDULE', stoneId: this.props.stoneId, sphereId: this.props.sphereId, scheduleId: dbScheduleIds[i],
              data: {active: false}
            })
          }
        }

        this.props.store.batchDispatch(syncActions);
        eventBus.emit("hideLoading");
      })
      .catch((err) => {
        eventBus.emit("hideLoading");
        LOG.error("DeviceSchedule: Could not get the schedules from the Crownstone.", err);
        Alert.alert(
          "Could not Sync",
          "Move closer to the Crownstone and try again!",
          [{text:"OK"}]
        );
      });

    BatchCommandHandler.executePriority();
  }

  _findMatchingScheduleId(schedule, dbSchedules) {
    let dbScheduleIds = Object.keys(dbSchedules);
    
    // matching will be done on days, time and state
    for (let i = 0; i < dbScheduleIds.length; i++) {
      let dbSchedule = dbSchedules[dbScheduleIds[i]];
      if (
        schedule.activeMonday    === dbSchedule.activeDays.Mon &&
        schedule.activeTuesday   === dbSchedule.activeDays.Tue &&
        schedule.activeWednesday === dbSchedule.activeDays.Wed &&
        schedule.activeThursday  === dbSchedule.activeDays.Thu &&
        schedule.activeFriday    === dbSchedule.activeDays.Fri &&
        schedule.activeSaturday  === dbSchedule.activeDays.Sat &&
        schedule.activeSunday    === dbSchedule.activeDays.Sun &&
        schedule.switchState     === dbSchedule.switchState
      ) {
        // we dont care about the time particularly, only about the hours:minutes of it. Regardless of the date.
        let dbHours = new Date(StoneUtil.crownstoneTimeToTimestamp(dbSchedule.time)).getHours();
        let dbMinutes = new Date(StoneUtil.crownstoneTimeToTimestamp(dbSchedule.time)).getMinutes();

        let hours = new Date(StoneUtil.crownstoneTimeToTimestamp(schedule.nextTime)).getHours();
        let minutes = new Date(StoneUtil.crownstoneTimeToTimestamp(schedule.nextTime)).getMinutes();
        
        if (dbHours === hours && dbMinutes === minutes) {
          return dbScheduleIds[i];
        }
      }
    }
    return null;
  }

  _getHeader(state, iconSize) {
    let AI = Util.data.getAiData(state, this.props.sphereId);
    return (
      <View style={{ width: screenWidth, alignItems:'center' }}>
        <View style={{height: 30}} />
        <Text style={[deviceStyles.header]}>Schedule</Text>
        <View style={{height: 0.2*iconSize}} />
        <Text style={textStyle.specification}>{'You can tell ' + AI.name + ' to switch this Crownstone on or off at a certain time.'}</Text>
      </View>
    );
  }

  _getButton(stone, iconSize) {
    let button = (
      <IconButton
        name="ios-clock"
        size={0.8*iconSize}
        color="#fff"
        addIcon={Permissions.canAddSchedule}
        buttonSize={iconSize}
        buttonStyle={{backgroundColor:colors.csBlue.hex, borderRadius: 0.2*iconSize}}
      />
    );

    if (Permissions.canAddSchedule === true) {
      return (
        <TouchableOpacity onPress={() => {
            if (stone.config.disabled === true) {
              Alert.alert(
                "Can't see Crownstone!",
                "You cannot add schedules without being near to the Crownstone.",
                [{text:"OK"}]
              );
            }
            else {
              Actions.deviceScheduleEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: null});
            }
        }}>
          { button }
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View>
          { button }
        </View>
      );
    }
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const schedules = stone.schedules;

    let iconSize = 0.15*screenHeight;
    let items = this._getItems(schedules);

    /**
     * there is duplicate code here because the flex does not work if just the changed content is passed as array
     */
    let innerView;
    if (items.length > 0) {
      innerView = (
          <View style={{flex:1, width: screenWidth, alignItems:'center'}}>
            { this._getHeader(state, iconSize) }
            <View style={{height: 0.2*iconSize}} />
            { this._getButton(stone, iconSize) }
            <View key="subScheduleSpacer" style={{height: 0.2*iconSize}} />
            <ListEditableItems key="empty" items={items} style={{width:screenWidth}} />
            <View style={{height:40, width:screenWidth, backgroundColor: 'transparent'}} />
            { this._getSyncOption(stone) }
          </View>
      )
    }
    else {
      innerView = (
        <View style={{flex:1, minHeight: availableScreenHeight, width: screenWidth, alignItems:'center'}}>
          { this._getHeader(state, iconSize) }
          <View style={{flex:0.6}} />
          { this._getButton(stone, iconSize) }
          <View style={{flex:0.8}} />
          <Text style={{
            color: colors.green.hex,
            textAlign: 'center',
            paddingLeft: 30,
            paddingRight: 30,
            fontWeight: 'bold',
            fontStyle:'italic'
          }}>
            {
              Permissions.canAddSchedule ?
                "Add your first scheduled action by tapping on the big icon in the center!" :
                "You do not have permission to create schedules."
            }
          </Text>
          <View style={{flex: 2}} />
          { this._getSyncOption(stone) }
        </View>
      )
    }

    return (
      <ScrollView style={{height: availableScreenHeight, width: screenWidth}}>
        { innerView }
      </ScrollView>
    )
  }
}


class SchedulerEntry extends Component<any, any> {

  _getHeader(active) {
    let wrapperStyle = {height: 50, justifyContent:'center'};
    let headerStyle = {fontSize: 16, fontWeight:'500', paddingTop: 15, color: active ? colors.black.hex : colors.darkGray2.hex};
    let timeText = (this.props.schedule.switchState > 0 ? "Turn on" : "Turn off") + ' at ' + Util.getTimeFormat(StoneUtil.crownstoneTimeToTimestamp(this.props.schedule.time), false);
    let activeText = active ? '' : ' (disabled)';
    if (this.props.schedule.label) {
      return (
        <View style={wrapperStyle}>
          <Text style={headerStyle}>{this.props.schedule.label + activeText}</Text>
          <View style={{flex:1}} />
          <Text style={{fontSize: 12, fontWeight:'300', color: active ? colors.black.hex : colors.darkGray2.hex}}>{timeText}</Text>
          <View style={{flex:1}} />
        </View>
      );
    }
    else {
      return (
        <View style={wrapperStyle}>
          <Text style={headerStyle}>{timeText + activeText}</Text>
          <View style={{flex:1}} />
        </View>
      );
    }
  }

  _getActiveDays(size, active) {
    let days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let localizedDays = ['M','T','W','T','F','S','S'];
    let items = [];

    let activeColor = colors.green.hex;
    let disableColor = colors.darkBackground.rgba(0.2);
    let activeTextColor = colors.white.hex;
    let disableTextColor = colors.darkBackground.rgba(0.6);

    if (active === false) {
      activeColor = colors.darkGray2.hex;
      disableColor = colors.darkGray2.rgba(0.2);
      activeTextColor = colors.white.hex;
      disableTextColor = colors.darkGray2.rgba(0.6);
    }

    for (let i = 0; i < days.length; i++) {
      let dayActive = this.props.schedule.activeDays[days[i]] === true;
      items.push(
        <View
          key={this.props.scheduleId + 'activeDay' + i}
          style={{
            width: size,
            height: size,
            borderRadius: 0.5*size,
            backgroundColor: dayActive ? activeColor : disableColor,
            alignItems:'center',
            justifyContent:'center'
          }}
        >
          <Text style={{
            fontSize:9.5,
            fontWeight: dayActive ? 'bold' : '300',
            color: dayActive ? activeTextColor : disableTextColor,
            backgroundColor:"transparent"
          }}>{localizedDays[i]}</Text>
        </View>
      );
      if (i < days.length - 1) {
        items.push(<View key={this.props.scheduleId + 'activeDayFlex' + i} style={{flex: 1}}/>);
      }
    }

    return items;
  }


  render() {
    let dayIconSize = 18;
    let rowHeight = 90;
    let active = this.props.schedule.active;

    let content = (
      <View style={{ flexDirection: 'row', width: screenWidth - 15, height: rowHeight, justifyContent:'center' }}>
        <View style={{ flex:1 }}>
          {this._getHeader(active)}
          <View style={{flex:1}} />
          <View style={{
            flexDirection:'row',
            height: dayIconSize+15,
            width: 0.5*(screenWidth-30),
            alignItems:'center',
            justifyContent:'center',
            paddingBottom: 15,
            overflow:"hidden",
          }}>
            {this._getActiveDays(dayIconSize, active)}
          </View>
        </View>
        <View style={{height: rowHeight, width:60, alignItems: 'center', justifyContent:'center'}}>
          <IconButton
            name={"md-create"}
            size={14}
            color={colors.white.hex}
            buttonStyle={{backgroundColor: colors.darkBackground.hex, width:20, height:20, borderRadius:10}}
          />
        </View>
      </View>
    );

    if (Permissions.canEditSchedule) {
      return (
        <TouchableOpacity
          onPress={() => {
            Actions.deviceScheduleEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: this.props.scheduleId});
          }}
          style={{
            flexDirection: 'row',
            width: screenWidth - 15,
            height: rowHeight,
            justifyContent:'center',
          }}
        >
          { content }
        </TouchableOpacity>
      );
    }
    else {
      return content;
    }
  }
}