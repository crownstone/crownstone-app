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

  getLabel() {
    let timeIndicator = Util.getTimeFormat(this.props.data.startTime)
    if (this.props.data.generatedFrom === 'keepAliveSphere') {
      // exit sphere
      return 'In the Sphere since ' + timeIndicator
    }
  }

  render() {
    return (
      <View style={{flexDirection: 'row', width: screenWidth, height: this.props.height * 0.5, paddingLeft:25, marginTop:5, alignItems:"center"}}>
        <View style={{ width: screenWidth,  height:this.props.height * 0.5, backgroundColor: colors.white.rgba(0.2), position:'absolute', top: -this.props.height*0.05}} />
        <View style={{ width: screenWidth - 59, height:2,     backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.25,      left: 29}} />
        <View style={{ width: 8,  height:8,  borderRadius:4,  backgroundColor: colors.white.hex,               position:'absolute', top: this.props.height*0.25 - 3,  left: 49}} />
        <View style={{ width: 4,  height:4,  borderRadius:2,  backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.25 - 1,  left: screenWidth - 30}} />
        <View style={{ width: 4,  height:4,  borderRadius:2,  backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.25 - 1,  left: 25}} />

        <View style={{flex:1, height: this.props.height* 0.5, paddingLeft: 50, paddingTop: 5, alignItems:'flex-start', flexDirection:'row'}}>
          <Text style={{color:colors.white.hex, fontWeight:'bold', paddingLeft:10,  marginBottom:10}}>{this.getLabel()}</Text>
        </View>
      </View>
    )
  }

}