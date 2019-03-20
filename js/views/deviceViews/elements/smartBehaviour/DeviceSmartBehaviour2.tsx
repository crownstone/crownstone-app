
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
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
const Actions = require('react-native-router-flux').Actions;

import { colors, deviceStyles, OrangeLine, screenHeight, screenWidth } from "../../../styles";
import { Background } from "../../../components/Background";
import { WeekDayList } from "../../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./SmartBehaviourSummaryGraph";

export class DeviceSmartBehaviour2 extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "A Crownstone",
    }
  };


  render() {
    let iconSize = 0.15*screenHeight;

    return (
      <Background image={this.props.backgrounds.detailsDark}>
        <OrangeLine/>
        <View style={{ width: screenWidth, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={[deviceStyles.header]}>{ "Smart Behaviour" }</Text>
          <View style={{height: 0.2*iconSize}} />
          <WeekDayList
            data={{Mon: true, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false}}
            tight={true}
            darkTheme={true}
            onChange={() => {}}
          />
          <View style={{height: 0.1*iconSize}} />
          <SmartBehaviourSummaryGraph />
        </View>

      </Background>
    )
  }
}
