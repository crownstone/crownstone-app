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
  _getDays() {
    let items = [];
    let pressure = 1;
    if (this.props.tight) {
      pressure = 3;
    }


    items.push(<View key={'selectableDayFlexStart'} style={{flex:pressure}} />);
    for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
      let day = DAY_INDICES_MONDAY_START[i];

      if (this.props.customElement) {
        items.push(
          this.props.customElement({
            key: "dayElement" + day,
            callback: () => {
              let newData = { ...this.props.data };
              newData[day] = !newData[day];
              this.props.onChange(newData, day);
            },
            selected: this.props.data[day],
            label: DAY_SHORT_LABEL_MAP[day],
          }));
      }
      else {
        items.push(
          <SmallWeekdayElement
            key={"dayElement" + day}
            callback={() => {
              let newData = { ...this.props.data };
              newData[day] = !newData[day];
              this.props.onChange(newData, day);
            }}
            selected={this.props.data[day]}
            label={DAY_SHORT_LABEL_MAP[day]}
          />
        )
      }
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
        { this._getDays() }
      </View>
    )
  }
}


export class WeekDayListLarge extends Component<any, any> {
  _getDayIterator(days, keyLabel) {
    let items = [];

    items.push(<View key={'selectableDayFlexStart' + keyLabel} style={{flex:1}} />);
    for (let i = 0; i < days.length; i++) {
      let day = days[i];
      if (this.props.customElement) {
        items.push(
          <View key={"dayElement" + day}>
            {
            this.props.customElement({
              callback: () => {
                let newData = { ...this.props.data };
                newData[day] = !newData[day];
                this.props.onChange(newData, day);
              },
              selected: this.props.data[day],
              label: DAY_SHORT_LABEL_MAP[day],
              disabled: this.props.disabledDays[day],
            })
            }
          </View>);
      }
      else {
        items.push(
          <LargeWeekdayElement
            key={"dayElement" + day}
            callback={() => {
              let newData = { ...this.props.data };
              newData[day] = !newData[day];
              this.props.onChange(newData, day);
            }}
            selected={this.props.data[day]}
            label={DAY_SHORT_LABEL_MAP[day]}
            disabled={this.props.disabledDays[day]}
          />
        );
      }
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

export function SmallWeekdayElement(props: {callback, selected, label}) {
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
export function LargeWeekdayElement(props: {callback, margin?, selected, label, disabled}) {
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

export function LargeDeleteWeekdayElement(props: {callback, margin?, selected, label, disabled}) {
  let size = screenWidth/7;


  let itemStyle : ViewStyle = {
    width: size,
    height: size,
    borderRadius: 0.5*size,
    borderColor: colors.white.rgba(0.9),
    borderWidth: size*0.06,
    backgroundColor: props.selected ? colors.csOrange.hex : colors.csBlueDark.rgba(0.1),
    margin: size/12,
    alignItems:'center',
    justifyContent:'center'
  }
  if (props.disabled) {
    itemStyle.borderWidth = 0;
    itemStyle.backgroundColor = colors.csBlueDark.rgba(0.06);
    return (
      <View style={itemStyle}>
        <Text style={{
          fontSize:12,
          color: colors.csBlueDark.rgba(0.25),
          backgroundColor:"transparent"
        }}>{props.label}</Text>
      </View>
    );
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