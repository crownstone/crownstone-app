import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { Languages } from "../../../Languages";



function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining", key)(a,b,c,d,e);
}


export function RoomTraining(props) {
    return (
      <Background>
        <KeepAwake />
        <View style={{height:30}}/>
        <Text style={styles.boldExplanation}>{"In order for me to know when you are in this room, I need to learn a bit more about it."}</Text>
        <Text style={styles.explanation}>{"By walking around the room, I can listen for the Crownstone signals and recognise the room afterwards."}</Text>

        <View style={{flex:1}}/>
        <View style={{height:0.35*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
        <View style={{flex:1}}/>

        <Text style={styles.explanation}>{"I'll guide you in this process once we start."}</Text>
        <Text style={styles.explanation}>{"Are you ready?"}</Text>
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            icon={"ios-play"}
            label={ "Let's go! "}
            callback={() => { NavigationUtil.navigate('RoomTraining_inHand_intro', this.props); }}
          />
        </View>
      </Background>
    );
  }

RoomTraining.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);
  return TopBarUtil.getOptions({title: `Locating the ${location.config.name}`, closeModal: true});
};

