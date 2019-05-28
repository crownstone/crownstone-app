import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSchedule", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  TouchableOpacity,
  ScrollView,
  Text,
  View
} from 'react-native';


import { styles, colors, screenWidth, screenHeight, availableScreenHeight, deviceStyles } from "../../styles";
import {IconButton} from "../../components/IconButton";
import {textStyle} from "./DeviceBehaviour";
import {ListEditableItems} from "../../components/ListEditableItems";
import {Util} from "../../../util/Util";
import {Icon} from "../../components/Icon";
import {BatchCommandHandler} from "../../../logic/BatchCommandHandler";
import {LOGe} from "../../../logging/Log";
import {SchedulerEntry} from "../../components/SchedulerEntry";
import {Scheduler} from "../../../logic/Scheduler";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {ScheduleUtil} from "../../../util/ScheduleUtil";
import { xUtil } from "../../../util/StandAloneUtil";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";


export class DeviceSchedule extends LiveComponent<any, any> {

  unsubscribeStoreEvents;
  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = core.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      if (
        change.changeAppSettings || change.updateStoneSchedule && change.updateStoneSchedule.stoneIds[this.props.stoneId]
      ) {
        this.forceUpdate();
      }
    });
  }
  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  _getItems(schedules) {
    let items = [];

    let scheduleIds = Object.keys(schedules);
    if (scheduleIds.length > 0) {
      items.push({label: lang("SCHEDULED_ACTIONS"), type: 'lightExplanation',  below:false});

      scheduleIds.forEach((scheduleId) => {
        let schedule = schedules[scheduleId];

        items.push({__item:
          <View style={[styles.listView,{backgroundColor: colors.white.rgba(0.75), paddingRight:0}]}>
            <SchedulerEntry
              schedule={schedule}
              scheduleId={scheduleId}
              stoneId={this.props.stoneId}
              sphereId={this.props.sphereId}
              size={45}
            />
          </View>
        })
      });
    }

    return items;
  }

  _getSyncOption(stone) {
    if (Permissions.inSphere(this.props.sphereId).canDeleteSchedule) {
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
          if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
            Alert.alert(
              lang("_Cant_see_Crownstone___Yo_header"),
              lang("_Cant_see_Crownstone___Yo_body"),
              [{text:lang("_Cant_see_Crownstone___Yo_left")}]
            );
          }
          else {
            this._syncSchedules(stone);
          }
        }}>
          <Icon name="md-sync" size={20} color={colors.csBlueDark.hex} style={{paddingRight:5}} />
          <Text style={{color: colors.csBlueDark.hex}}>{ lang("Sync_schedules_from_Crown") }</Text>
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
    core.eventBus.emit("showLoading", lang("Downloading_schedules_fro"));
    BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getSchedules'}, {},1, 'sync schedules from DeviceSchedule')
      .then((stoneSchedules : {data: [bridgeScheduleEntry]}) => {
        let dbSchedules = stone.schedules;
        let syncActions = [];
        let activeIds = {};
        stoneSchedules.data.forEach((schedule) => {
          let matchingId = ScheduleUtil.findMatchingScheduleId(schedule, dbSchedules);
          if (matchingId === null) {
            syncActions.push({
              type: 'ADD_STONE_SCHEDULE', stoneId: this.props.stoneId, sphereId: this.props.sphereId, scheduleId: xUtil.getUUID(),
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

        core.store.batchDispatch(syncActions);
        core.eventBus.emit("showLoading", lang("Done_"));
        Scheduler.scheduleCallback(() => { core.eventBus.emit("hideLoading"); }, 400);
      })
      .catch((err) => {
        core.eventBus.emit("hideLoading");
        LOGe.info("DeviceSchedule: Could not get the schedules from the Crownstone.", err);
        Alert.alert(
          lang("_Could_not_Sync__Move_clo_header"),
          lang("_Could_not_Sync__Move_clo_body"),
          [{text:lang("_Could_not_Sync__Move_clo_left")}]
        );
      });

    BatchCommandHandler.executePriority();
  }

  _getHeader(state, iconSize, customLabel = null) {
    let AI = Util.data.getAiData(state, this.props.sphereId);
    let label =  lang("You_can_tell__to_switch_t",AI.name);

    if (customLabel) {
      label = customLabel;
    }

    return (
      <View style={{ width: screenWidth, alignItems:'center' }}>
        <View style={{height: 30}} />
        <Text style={deviceStyles.header}>{ lang("Schedule") }</Text>
        <View style={{height: 0.2*iconSize}} />
        <Text style={textStyle.specification}>{label}</Text>
      </View>
    );
  }

  _getButton(stone, iconSize) {
    let canAddSchedule = Permissions.inSphere(this.props.sphereId).canAddSchedule;

    let button = (
      <IconButton
        name="ios-clock"
        size={0.8*iconSize}
        color="#fff"
        addIcon={canAddSchedule}
        buttonSize={iconSize}
        buttonStyle={{backgroundColor:colors.csBlueDark.hex, borderRadius: 0.2*iconSize}}
      />
    );

    if (canAddSchedule) {
      return (
        <TouchableOpacity onPress={() => {
            if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
              Alert.alert(
                lang("_Cant_see_Crownstone___You_header"),
                lang("_Cant_see_Crownstone___You_body"),
                [{text:lang("_Cant_see_Crownstone___You_left")}]
              );
            }
            else {
             NavigationUtil.launchModal( "DeviceScheduleEdit",{sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: null});
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
    const store = core.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const schedules = stone.schedules;

    let iconSize = 0.15*screenHeight;
    let items = this._getItems(schedules);

    let innerView;
    let spherePermissions = Permissions.inSphere(this.props.sphereId);
    if (!spherePermissions.canSeeSchedules) {
      innerView = (
        <View style={{flex:1, width: screenWidth, alignItems:'center'}}>
          { this._getHeader(state, iconSize, lang("You_do_not_have_permissio")) }
        </View>
      )
    }
    else if (!xUtil.versions.canIUse(stone.config.firmwareVersion, '1.5.0')) {
      innerView = (
        <View style={{flex:1, width: screenWidth, alignItems:'center'}}>
          { this._getHeader(state, iconSize, lang("This_Crownstone_needs_to_")) }
        </View>
      )
    }
    else if (stone.config.locked === true) {
      innerView = (
        <View style={{flex:1, width: screenWidth, alignItems:'center'}}>
          { this._getHeader(state, iconSize, lang("This_Crownstone_is_locked")) }
        </View>
      )
    }
    else if (items.length > 0) {
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
          }}>{ lang("Add_your_first_scheduled_",Permissions.inSphere(this.props.sphereId).canAddSchedule) }</Text>
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