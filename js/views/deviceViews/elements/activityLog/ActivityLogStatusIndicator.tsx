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


export class ActivityLogStatusIndicator extends Component<any, any> {

  getDayLabel() {
    let midnight = new Date(new Date(new Date().setHours(0)).setMinutes(0)).setSeconds(0);
    if (this.props.data.startTime < midnight) {
      return "yesterday";
    }
    return 'today';
  }


  getLabel() {
    let timeIndicator = Util.getTimeFormat(this.props.data.startTime);
    return this.props.data.count + ' ' + (this.props.data.count > 1 ? 'heartbeats' : 'heartbeat') + ' since ' + timeIndicator + " " + this.getDayLabel() + ".";
  }

  render() {
    return (
      <View style={{flexDirection: 'row', width: screenWidth, height: this.props.height * 0.65, paddingLeft:25, marginTop:5, alignItems:"center"}}>
        <View style={{ width: screenWidth,  height:this.props.height * 0.65, backgroundColor: colors.white.rgba(0.2), position:'absolute', top: -this.props.height*0.05}} />
        <View style={{ width: screenWidth - 59, height:2,     backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.25,      left: 29}} />
        <View style={{ width: 8,  height:8,  borderRadius:4,  backgroundColor: colors.white.hex,               position:'absolute', top: this.props.height*0.25 - 3,  left: 49}} />
        <View style={{ width: 4,  height:4,  borderRadius:2,  backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.25 - 1,  left: screenWidth - 30}} />
        <View style={{ width: 4,  height:4,  borderRadius:2,  backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.25 - 1,  left: 25}} />

        <View style={{position:'absolute', top: this.props.height * 0.04, left: 55}}>
          <Text style={{color:colors.white.hex, fontWeight:'bold', paddingLeft:10,  marginBottom:10}}>{"I'm in range!"}</Text>
          <Text style={{color:colors.white.hex, fontWeight:'bold', paddingLeft:10,  marginBottom:10}}>{this.getLabel()}</Text>
        </View>
      </View>
    )
  }

}