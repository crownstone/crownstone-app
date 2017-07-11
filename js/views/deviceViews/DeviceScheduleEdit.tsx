import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  DatePickerIOS,
  Platform,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TimePickerAndroid,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../styles'
import {IconButton} from "../components/IconButton";
import {ErrorContent} from "../content/ErrorContent";
import {eventBus} from "../../util/EventBus";
import {deviceStyles} from "./DeviceOverview";
import {textStyle} from "./elements/DeviceBehaviour";
import {Background} from "../components/Background";
import {TopBar} from "../components/Topbar";
import {ListEditableItems} from "../components/ListEditableItems";
import {Util} from "../../util/Util";


export class DeviceScheduleEdit extends Component<any, any> {
  constructor(props) {
    super();


    if (props.scheduleId !== null && props.scheduleId !== undefined) {
      const store = props.store;
      const state = store.getState();
      const schedule = state.spheres[props.sphereId].stones[props.stoneId].schedules[props.scheduleId];
      this.state = {...schedule};
      this.state.activeDays = {...schedule.activeDays};
    }
    else {
      this.state = {
        label: '',
        time: new Date().valueOf(),
        switchState: 1,
        fadeDuration: 0,
        ignoreLocationTriggers: false,
        active: true,
        repeatMode: '24h', // 24h / minute
        activeDays: {
          Mon: true,
          Tue: true,
          Wed: true,
          Thu: true,
          Fri: true,
          Sat: new Date().getDay() === 6, // only on by default if it actually IS Saturday
          Sun: new Date().getDay() === 0, // only on by default if it actually IS Sunday
        },
      }
    }
  }

  _getAndroidUI() {
    return <TouchableOpacity onPress={() => {
      TimePickerAndroid.open({
        hour: 14,
        minute: 0,
        is24Hour: false, // Will display '2 PM'
      })
        .then((date) => { console.log("data", date)})
        .catch((err) => { console.log("err", err)})
    }} >
    </TouchableOpacity>
  }

  _getIosUI() {
    let items = [];

    items.push({type:'spacer'});
    items.push({__item:
      <DatePickerIOS
        date={new Date(this.state.time)}
        onDateChange={(date) => { this.setState({time: date.valueOf()}) }}
        mode="time"
        style={{backgroundColor:colors.white.rgba(0.75), width:screenWidth, height:210}}
      />
    });

    items.push({label:'Label', type: 'textEdit', placeholder:'name for this action', value: this.state.label, callback: (newText) => {
      this.setState({label:newText});
    }});
    items.push({label:'ACTION', type: 'lightExplanation',  below:false});
    items.push({label:'Switch Crownstone', type: 'switch', value: this.state.switchState === 1, callback: (newValue) => {
      this.setState({switchState: newValue ? 1 : 0});
    }});

    items.push({label:'REPEAT', type: 'lightExplanation',  below:false});
    items.push({__item:
      <RepeatWeekday data={this.state.activeDays} onChange={(newData) => { this.setState({activeDays: newData}); }} />
    });

    if (this.props.scheduleId !== null && this.props.scheduleId !== undefined) {
      items.push({label:'SCHEDULING OPTIONS', type: 'lightExplanation',  below:false});
      items.push({label:'Schedule active', type: 'switch', value: this.state.active, callback: (newValue) => {
        this.setState({active: newValue});
      }});
      items.push({
        label: 'Remove',
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: () => {
        Alert.alert(
          "Are you sure?",
          "Removing a scheduled action will also remove it from the Crownstone. You can disable the action to temporarily stop it.",
          [{text: 'Cancel', style: 'cancel'}, {text: 'Remove', style:'destructive', onPress: () => {
            this._deleteSchedule();
          }}]
        )
      }});
    }
    items.push({type: 'spacer'});

    return <ListEditableItems items={items} style={{width:screenWidth}} />
  }

  _createSchedule() {
    let newScheduleId = Util.getUUID();
    let newSchedulerData = {...this.state};
    newSchedulerData.scheduleEntryIndex = 1;
    this.props.store.dispatch({type:"ADD_STONE_SCHEDULE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: newScheduleId, data: newSchedulerData});
    Actions.pop();
  }

  _updateSchedule() {
    if (this.props.scheduleId) {
      this.props.store.dispatch({
        type: "UPDATE_STONE_SCHEDULE",
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        scheduleId: this.props.scheduleId,
        data: {...this.state}
      });
      Actions.pop();
    }
    else {
      Actions.pop();
    }
  }

  _deleteSchedule() {
    this.props.store.dispatch({type:"REMOVE_STONE_SCHEDULE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: this.props.scheduleId});
    Actions.pop();
  }

  render() {
    return (
      <Background image={this.props.backgrounds.detailsDark} hideTopBar={true}>
        <TopBar
          leftAction={() => { this._updateSchedule(); }}
          right={this.props.scheduleId ? undefined : 'Create'}
          rightStyle={{fontWeight: 'bold'}}
          rightAction={this.props.scheduleId ? undefined : () => { this._createSchedule(); } }
          title={this.props.scheduleId ? "Edit Schedule" : "Add Schedule"} />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView style={{flex:1}}>
          <View style={{alignItems:'center', width: screenWidth}}>
            { Platform.OS === 'android' ? this._getAndroidUI() : this._getIosUI() }
          </View>
        </ScrollView>
      </Background>
    );
  }
}

class RepeatWeekday extends Component<any, any> {
  _getDays(size) {
    let days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let localizedDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let items = [];

    items.push(<View key={'selectableDayFlexStart'} style={{flex:1}} />);
    for (let i = 0; i < days.length; i++) {
      items.push(
        <TouchableOpacity
          key={'selectableDay'+i}
          onPress={() => {
            let newState = {...this.props.data};
            newState[days[i]] = !this.props.data[days[i]];
            this.props.onChange(newState);
          }}
          style={{
            width: size,
            height: size,
            borderRadius: 0.5*size,
            backgroundColor: this.props.data[days[i]] ? colors.green.hex : colors.darkBackground.rgba(0.2),
            alignItems:'center',
            justifyContent:'center'
          }}
        >
          <Text style={{
            fontSize:11,
            fontWeight: this.props.data[days[i]] ? 'bold' : '300',
            color: this.props.data[days[i]] ? colors.white.hex : colors.darkBackground.rgba(0.6),
            backgroundColor:"transparent"
          }}>{localizedDays[i]}</Text>
        </TouchableOpacity>
      );
      items.push(<View key={'selectableDayFlex'+i} style={{flex:1}} />)
    }

    return items;
  }

  render() {
    let size = screenWidth/10;
    return (
      <View style={{
        height: size*1.5,
        width: screenWidth,
        backgroundColor: colors.white.hex,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center'
      }}>
        { this._getDays(size) }
      </View>
    )
  }
}
