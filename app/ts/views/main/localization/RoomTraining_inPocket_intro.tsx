import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import {bindTopbarButtons} from "../../components/hooks/viewHooks";
import { ScrollView } from 'react-native';




export function RoomTraining_inPocket_intro(props) {
  bindTopbarButtons(props);

return (
    <Background>
      <ScrollView contentContainerStyle={{flexGrow:1, paddingTop: topBarHeight}} contentInsetAdjustmentBehavior={"never"}>
        <KeepAwake />
        <View style={{height:20}}/>
        <Text style={styles.header}>{"Additional training session"}</Text>
        <Text style={styles.boldExplanation}>{"We walk around the room in the same way as you'd do normally. Put your phone in your pocket and walk around the room."}</Text>
        <Text style={styles.explanation}>{"Stand in places you commonly stand with the phone in your pocket. After this, take the phone out of your pocket and place it on surfaces in the room where it is likely to be normally."}</Text>

        <View style={{flex:1}}/>
        <View style={{height:0.35*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
        <View style={{flex:1}}/>

        <Text style={styles.explanation}>{"Collect as much as you can!"}</Text>
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          <Button
            backgroundColor={colors.blue.hex}
            icon={'ios-play'}
            label={ "Start!"}
            callback={() => { NavigationUtil.navigate('RoomTraining_training', {sphereId: props.sphereId, locationId: props.locationId, type: "IN_POCKET"}); }}
          />
        </View>
      </ScrollView>
    </Background>
  );
}


RoomTraining_inPocket_intro.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);
  return TopBarUtil.getOptions({title: `Locating the ${location.config.name}`, closeModal: true});
}