import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("WeekDayList", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, ViewStyle
} from "react-native";

import {colors, screenWidth} from '../styles'
import {
  DAY_INDICES_MONDAY_START,
  WEEK_DAY_INDICES,
  WEEKEND_DAY_INDICES, DAY_SHORT_LABEL_MAP
} from "../../Constants";


export class WeekDayList extends Component<any, any> {
  _getDays(size) {
    let items = [];
    let pressure = 1;
    if (this.props.tight) {
      pressure = 3;
    }


    items.push(<View key={'selectableDayFlexStart'} style={{flex:pressure}} />);
    for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
      let day = DAY_INDICES_MONDAY_START[i];
      items.push(
        <SmallWeekdayElement
          key={"dayElement"+day}
          callback={() => {
            let newData = {...this.props.data};
            newData[day] = !newData[day];
            this.props.onChange(newData, day);
          }}
          selected={this.props.data[day]}
          label={DAY_SHORT_LABEL_MAP[day]}
          conflict={false}
        />
      )

      if (i < DAY_INDICES_MONDAY_START.length -1) {
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
  _getDayIterator(days, keyLabel) {
    let items = [];

    items.push(<View key={'selectableDayFlexStart' + keyLabel} style={{flex:1}} />);
    for (let i = 0; i < days.length; i++) {

      console.log("this.props.conflictDays && this.props.conflictDays[days[i]].conflict && !this.props.conflictDays[days[i]].resolved",this.props.conflictDays,this.props.conflictDays[days[i]].conflict, !this.props.conflictDays[days[i]].resolved, days[i])
      items.push(
        <LargeWeekdayElement
          key={"dayElement"+days[i]}
          callback={() => {
            let newData = {...this.props.data};
            newData[days[i]] = !newData[days[i]];
            this.props.onChange(newData, days[i]);
          }}
          selected={this.props.data[days[i]]}
          label={DAY_SHORT_LABEL_MAP[days[i]]}
          conflict={this.props.conflictDays && this.props.conflictDays[days[i]].conflict && !this.props.conflictDays[days[i]].resolved}
        />
      );

    }
    items.push(<View key={'selectableDayFlexEnd' + keyLabel} style={{flex:1}} />);

    return items;
  }

  _getWeekDays() {
    return this._getDayIterator(WEEK_DAY_INDICES, 'weekDays');
  }

  _getWeekendDays() {
    return this._getDayIterator(WEEKEND_DAY_INDICES, 'weekendDays');
  }

  render() {
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
        { this._getWeekDays() }
      </View>
        <View style={{
          width: screenWidth,
          backgroundColor: "transparent",
          flexDirection:'row',
          alignItems:'center',
          justifyContent:'center'
        }}>
          { this._getWeekendDays() }
        </View>
      </View>
    );
  }
}

export function SmallWeekdayElement(props: {callback, selected, label, conflict}) {
  return (
    <WeekdayElement
      size={screenWidth/9}
      callback={props.callback}
      selected={props.selected}
      label={props.label}
      margin={0}
    />
  );
}
export function LargeWeekdayElement(props: {callback, margin?, selected, label, conflict}) {
  let size = screenWidth/7;
  return (
    <WeekdayElement
      size={size}
      callback={props.callback}
      selected={props.selected}
      label={props.label}
      margin={props.margin || size/12}
    />
  );
}

export function WeekdayElement(props: {size, margin, callback, selected, label}) {
  let itemStyle : ViewStyle = {
    width: props.size,
    height: props.size,
    borderRadius: 0.5*props.size,
    borderColor: colors.white.rgba(0.9),
    borderWidth: props.size*0.06,
    backgroundColor: props.selected ? colors.green.hex : colors.csBlueDark.rgba(0.1),
    margin: props.margin,
    alignItems:'center',
    justifyContent:'center'
  }


  return (
    <TouchableOpacity
      onPress={props.callback}
      style={itemStyle}
    >
      <Text style={{
        fontSize:12,
        fontWeight: 'bold',
        color: props.selected ? colors.white.hex : colors.csBlueDark.rgba(0.6),
        backgroundColor:"transparent"
      }}>{props.label}</Text>
    </TouchableOpacity>
  );
}