import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View, ScrollView } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import { Languages } from "../../../Languages";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import {bindTopbarButtons} from "../../components/hooks/viewHooks";




export function RoomTraining_inHand_intro(props) {
  bindTopbarButtons(props);

  return (
    <Background>
      <ScrollView contentContainerStyle={{flexGrow:1, paddingTop: topBarHeight}} contentInsetAdjustmentBehavior={"never"}>
        <View style={{height: topBarHeight}} />
        <KeepAwake />
        <View style={{height:20}}/>
        <Text style={styles.header}>{"Initial training session"}</Text>
        <Text style={styles.boldExplanation}>{"First we will walk around the room with the phone in your hand, arm stretched out."}</Text>
        <Text style={styles.explanation}>{"Once the phone vibrates, move it to a new position and hold it there. Repeat this with as many unique positions as possible."}</Text>

        <View style={{flex:1}}/>
        <View style={{height:0.35*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
        <View style={{flex:1}}/>

        <Text style={styles.explanation}>{"Once I have collected enough information, I'll let you know!."}</Text>
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            icon={'ios-play'}
            label={ "Start!"}
            callback={() => { NavigationUtil.navigate('RoomTraining_training', {sphereId: props.sphereId, locationId: props.locationId, type: "IN_HAND"}); }}
          />
        </View>
      </ScrollView>
    </Background>
  );
}

RoomTraining_inHand_intro.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);
  return TopBarUtil.getOptions({title: `Locating the ${location.config.name}`, closeModal: true});
}