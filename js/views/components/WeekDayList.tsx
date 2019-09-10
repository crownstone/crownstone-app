import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("WeekDayList", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import {colors, screenWidth} from '../styles'

export let DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; // these are keys
export let WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri']; // these are keys
export let WEEKEND_DAYS = ['Sat','Sun']; // these are keys
export let DAYS_FULL = [
  lang('DAY_Monday'),
  lang('DAY_Tuesday'),
  lang('DAY_Wednesday'),
  lang('DAY_Thursday'),
  lang('DAY_Friday'),
  lang('DAY_Saturday'),
  lang('DAY_Sunday'),
];

export class WeekDayList extends Component<any, any> {
  _getDays(size) {
    let localizedDays = [lang("DAY_Mon"), lang("DAY_Tue"), lang("DAY_Wed"), lang("DAY_Thu"), lang("DAY_Fri"), lang("DAY_Sat"), lang("DAY_Sun")];
    let items = [];
    let pressure = 1;
    if (this.props.tight) {
      pressure = 3;
    }


    items.push(<View key={'selectableDayFlexStart'} style={{flex:pressure}} />);
    for (let i = 0; i < DAYS.length; i++) {
      items.push(
        <TouchableOpacity
          key={'selectableDay'+i}
          onPress={() => {
            let newData = {...this.props.data};
            newData[DAYS[i]] = !newData[DAYS[i]];
            this.props.onChange(newData, DAYS[i]);
          }}
          style={{
            width: size,
            height: size,
            borderRadius: 0.5*size,
            borderColor: colors.white.rgba(0.7),
            borderWidth: 2,
            backgroundColor: this.props.data[DAYS[i]] ? colors.green.hex : ( this.props.darkTheme === true ? colors.white.rgba(0.3) : colors.csBlueDark.rgba(0.2)),
            alignItems:'center',
            justifyContent:'center'
          }}
        >
          <Text style={{
            fontSize:12,
            fontWeight: 'bold',
            color: this.props.data[DAYS[i]] ? colors.white.hex : ( this.props.darkTheme === true ? colors.white.hex : colors.csBlueDark.rgba(0.6)),
            backgroundColor:"transparent"
          }}>{localizedDays[i]}</Text>
        </TouchableOpacity>
      );

      if (i < DAYS.length -1) {
        items.push(<View key={'selectableDayFlex'+i} style={{flex:1}} />);
      }
    }
    items.push(<View key={'selectableDayFlexEnd'} style={{flex:pressure}} />);

    return items;
  }

  render() {
    let size = screenWidth/9;
    return (
      <View style={{
        height: size*1.5,
        width: screenWidth,
        backgroundColor: "transparent",
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center'
      }}>
        { this._getDays(size) }
      </View>
    )
  }
}


export class WeekDayListLarge extends Component<any, any> {
  _getDayIterator(size, days, localizedDays, keyLabel) {
    let items = [];
    let pressure = 1;
    if (this.props.tight) {
      pressure = 3;
    }


    items.push(<View key={'selectableDayFlexStart' + keyLabel} style={{flex:1}} />);
    for (let i = 0; i < days.length; i++) {
      items.push(
        <TouchableOpacity
          key={'selectableDay'+i + keyLabel}
          onPress={() => {
            let newData = {...this.props.data};
            newData[days[i]] = !newData[days[i]];
            this.props.onChange(newData, days[i]);
          }}
          style={{
            width: size,
            height: size,
            borderRadius: 0.5*size,
            borderColor: colors.white.rgba(0.8),
            borderWidth: size*0.06,
            backgroundColor: this.props.data[days[i]] ? colors.green.hex : ( this.props.darkTheme === true ? colors.white.rgba(0.3) : colors.csBlueDark.rgba(0.2)),
            alignItems:'center',
            margin: (screenWidth - size*6)/12,
            justifyContent:'center'
          }}
        >
          <Text style={{
            fontSize: size*0.25,
            fontWeight: 'bold',
            color: this.props.data[days[i]] ? colors.white.hex : ( this.props.darkTheme === true ? colors.white.hex : colors.csBlueDark.rgba(0.6)),
            backgroundColor:"transparent"
          }}>{localizedDays[i]}</Text>
        </TouchableOpacity>
      );

    }
    items.push(<View key={'selectableDayFlexEnd' + keyLabel} style={{flex:1}} />);

    return items;
  }

  _getWeekDays(size) {
    let localizedDays = [lang("DAY_Mon"), lang("DAY_Tue"), lang("DAY_Wed"), lang("DAY_Thu"), lang("DAY_Fri")];
    return this._getDayIterator(size, WEEK_DAYS, localizedDays, 'weekDays');
  }

  _getWeekendDays(size) {
    let localizedDays = [lang("DAY_Sat"), lang("DAY_Sun")];
    return this._getDayIterator(size, WEEKEND_DAYS, localizedDays, 'weekendDays');
  }

  render() {
    let size = screenWidth/7;
    return (
      <View style={{
        width: screenWidth,
        backgroundColor: "transparent",
        alignItems:'center',
        justifyContent:'center'
      }}>
      <View style={{
        width: screenWidth,
        backgroundColor: "transparent",
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center'
      }}>
        { this._getWeekDays(size) }
      </View>
        <View style={{
          width: screenWidth,
          backgroundColor: "transparent",
          flexDirection:'row',
          alignItems:'center',
          justifyContent:'center'
        }}>
          { this._getWeekendDays(size) }
        </View>
      </View>
    );
  }
}
