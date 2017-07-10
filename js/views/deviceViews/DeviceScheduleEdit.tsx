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
        Sat: false,
        Sun: false,
      },
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


    return <ListEditableItems items={items} style={{width:screenWidth}} />
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    return (
      <Background image={this.props.backgrounds.detailsDark} hideTopBar={true}>
        <TopBar
          leftAction={() => { Actions.pop(); }}
          right={() => {}}
          rightAction={() => {}}
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
