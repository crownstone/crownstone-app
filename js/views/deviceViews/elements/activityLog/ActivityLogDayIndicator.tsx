import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
import {Util} from "../../../../util/Util";
import {colors, screenWidth} from "../../../styles";
import {DAYS_FULL} from "../../DeviceScheduleEdit";
import {Icon} from "../../../components/Icon";


export class ActivityLogDayIndicator extends Component<any, any> {

  getDayLabel() {
    let dt = new Date().valueOf() - this.props.data.timestamp;
    let day = 24*3600000;
    if (dt < day) {
      return " - Yesterday";
    }
    else if (dt < 7*day) {
      return " - " + DAYS_FULL[new Date(this.props.data.timestamp - 1300).getDay()]
    }
    return '';
  }

  render() {
    return (
      <View style={{flexDirection: 'row', width: screenWidth, height: this.props.height, paddingLeft:25, marginTop:25, alignItems:"center"}}>
        <View style={{ width: screenWidth,  height:this.props.height * 0.8,     backgroundColor: colors.white.rgba(0.2), position:'absolute', top: this.props.height*0.1}} />
        <View style={{ width: screenWidth - 59, height:2,     backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.5,      left: 29}} />
        <View style={{ width: 8,  height:8,  borderRadius:4,  backgroundColor: colors.white.hex,       position:'absolute', top: this.props.height*0.5 - 3,  left: 49}} />
        <View style={{ width: 4,  height:4,  borderRadius:2,  backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.5 - 1,  left: screenWidth - 30}} />
        <View style={{ width: 4,  height:4,  borderRadius:2,  backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.5 - 1,  left: 25}} />

        <View style={{flex:1, height: this.props.height, paddingLeft: 66, paddingTop: 29, alignItems:'flex-start', flexDirection:'row'}}>
          <Icon name={'md-arrow-round-down'} color={'#fff'} size={20} style={{position:'relative', top:-2}} />
          <Text style={{color:colors.white.hex, fontWeight:'bold', paddingLeft:10,  marginBottom:10}}>{Util.getDateFormat(this.props.data.timestamp) + this.getDayLabel()}</Text>
        </View>
      </View>
    )
  }

}