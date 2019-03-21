
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SchedulerEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, TextStyle
} from "react-native";
const Actions = require('react-native-router-flux').Actions;

import {colors, screenWidth} from '../styles'
import {Util} from "../../util/Util";
import {StoneUtil} from "../../util/StoneUtil";
import {IconButton} from "./IconButton";
import {Permissions} from "../../backgroundProcesses/PermissionManager";

export class SchedulerEntry extends Component<any, any> {

  _getHeader(active) {
    let wrapperStyle : TextStyle = {height: 50, justifyContent:'center'};
    let headerStyle : TextStyle = {fontSize: 16, fontWeight:'500', paddingTop: 15, color: active ? colors.black.hex : colors.darkGray2.hex};
    let timeText = lang('Do_X_at',this.props.schedule.switchState > 0, Util.getTimeFormat(StoneUtil.crownstoneTimeToTimestamp(this.props.schedule.time), false));
    let activeText = active ? '' :  lang("__disabled_");
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
    let localizedDays = [
      lang("Mon_day_first_letter"),
      lang("Tue_day_first_letter"),
      lang("Wed_day_first_letter"),
      lang("Thu_day_first_letter"),
      lang("Fri_day_first_letter"),
      lang("Sat_day_first_letter"),
      lang("Sun_day_first_letter"),
    ]
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

    if (Permissions.inSphere(this.props.sphereId).canEditSchedule) {
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