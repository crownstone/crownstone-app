
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  StyleSheet,
  Text, TouchableOpacity,
  View
} from "react-native";


import { colors, deviceStyles, OrangeLine, screenHeight, screenWidth } from "../../../styles";
import { Background } from "../../../components/Background";
import { IconButton } from "../../../components/IconButton";
import { core } from "../../../../core";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { TopbarButton } from "../../../components/topbar/TopbarButton";

export class DeviceSmartBehaviour extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "A Crownstone",
      headerRight: <TopbarButton text={"Add"} onPress={ () => { NavigationUtil.navigate("DeviceSmartBehaviour_TypeSelector"); }} />,
    }
  };


  render() {
    let iconSize = 0.2*screenHeight;

    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
        <OrangeLine/>
        <View style={{ width: screenWidth, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={[deviceStyles.header]}>{ "Behaviour" }</Text>
          <View style={{height: 0.2*iconSize}} />
          <Text style={deviceStyles.specification}>{"This is how I respond to your presence, the time of day and more!\n\nTap the button below to get started!"}</Text>
          <View style={{height: 0.2*iconSize}} />
          <TouchableOpacity
            onPress={() => { NavigationUtil.navigate("DeviceSmartBehaviour_TypeSelector")}}
          >
            <IconButton
              name="c1-brain"
              size={0.8*iconSize}
              color="#fff"
              addIcon={true}
              buttonSize={iconSize}
              buttonStyle={{backgroundColor:colors.csBlueDark.hex, borderRadius: 0.2*iconSize}}
            />
          </TouchableOpacity>
        </View>

      </Background>
    )
  }
}
