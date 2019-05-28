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
            this.props.onChange(newData);
          }}
          style={{
            width: size,
            height: size,
            borderRadius: 0.5*size,
            borderColor: colors.white.rgba(0.4),
            borderWidth: 1,
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
        backgroundColor: this.props.darkTheme === true ? "transparent" : colors.white.hex,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center'
      }}>
        { this._getDays(size) }
      </View>
    )
  }
}
